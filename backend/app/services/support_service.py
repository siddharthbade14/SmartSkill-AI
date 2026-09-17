import os
import smtplib
import logging
import asyncio
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any

from app.core.config import settings

logger = logging.getLogger("smartskill_ai.support")


def _send_smtp_email_sync(
    sender_name: str,
    sender_email: str,
    category: str,
    subject: str,
    message: str,
    role: str = "Portal User",
    department: str = "MoSPI"
) -> Dict[str, Any]:
    """
    Synchronous worker to dispatch email to smartskillai3@gmail.com via Gmail SMTP.
    Executed in a background thread by send_support_query.
    """
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Ensure data directory exists for query persistence
    log_dir = os.path.join(os.path.dirname(__file__), "../../data")
    os.makedirs(log_dir, exist_ok=True)
    query_log_file = os.path.join(log_dir, "support_queries.log")

    # Persistent query log entry
    log_entry = (
        f"[{timestamp}] CATEGORY: {category} | FROM: {sender_name} <{sender_email}> "
        f"({role}, {department})\n"
        f"SUBJECT: {subject}\n"
        f"MESSAGE: {message}\n"
        f"{'-' * 60}\n"
    )
    try:
        with open(query_log_file, "a", encoding="utf-8") as f:
            f.write(log_entry)
    except Exception as e:
        logger.warning(f"Could not write query to log file: {e}")

    # Check if Gmail App Password or SMTP is configured
    app_password = (settings.GMAIL_APP_PASSWORD or "").replace(" ", "").strip()
    if not app_password:
        logger.info(
            "GMAIL_APP_PASSWORD not set in environment. Query saved to log. "
            "Configure GMAIL_APP_PASSWORD to enable live delivery to smartskillai3@gmail.com."
        )
        return {
            "success": True,
            "method": "queued_locally",
            "timestamp": timestamp,
            "recipient": settings.SUPPORT_EMAIL,
            "message": "Your query has been recorded. To activate direct live Gmail inbox delivery, configure GMAIL_APP_PASSWORD in .env."
        }

    # Construct Multipart Email
    email_subject = f"[Support Query] {category}: {subject}"
    msg = MIMEMultipart("alternative")
    msg["Subject"] = email_subject
    msg["From"] = f"SmartSkill AI <{settings.GMAIL_USER}>"
    msg["To"] = settings.SUPPORT_EMAIL
    msg["Reply-To"] = sender_email

    # Plain text version (clean and concise)
    plain_text = (
        f"SmartSkill AI Support Query\n\n"
        f"From: {sender_name} <{sender_email}> ({role}, {department})\n"
        f"Category: {category}\n"
        f"Subject: {subject}\n"
        f"Date: {timestamp}\n\n"
        f"Query:\n"
        f"{message}\n\n"
        f"--- Reply directly to this email to respond to {sender_name} ---"
    )

    # Clean, concise HTML version
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }}
        .card {{ max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; }}
        .header {{ background: #0B2545; color: #ffffff; padding: 14px 20px; }}
        .header h2 {{ margin: 0; font-size: 16px; font-weight: 700; }}
        .header span {{ font-size: 11px; color: #94a3b8; }}
        .content {{ padding: 18px 20px; color: #1e293b; font-size: 13px; line-height: 1.5; }}
        .info-row {{ margin-bottom: 6px; }}
        .info-label {{ font-weight: 600; color: #64748b; display: inline-block; width: 75px; }}
        .badge {{ background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }}
        .message-box {{ background: #f8fafc; border-left: 3px solid #0B2545; padding: 12px 14px; margin-top: 14px; border-radius: 4px; font-size: 13px; line-height: 1.5; white-space: pre-wrap; }}
        .footer {{ background: #f8fafc; padding: 10px 20px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2>SmartSkill AI • Support Inquiry</h2>
          <span>MoSPI Official Statistics Portal • {timestamp}</span>
        </div>
        <div class="content">
          <div class="info-row"><span class="info-label">From:</span> <strong>{sender_name}</strong> &lt;{sender_email}&gt;</div>
          <div class="info-row"><span class="info-label">Role:</span> {role} ({department})</div>
          <div class="info-row"><span class="info-label">Category:</span> <span class="badge">{category}</span></div>
          <div class="info-row"><span class="info-label">Subject:</span> <strong>{subject}</strong></div>
          
          <div class="message-box">{message}</div>
        </div>
        <div class="footer">
          Reply directly to this email to respond to {sender_name}.
        </div>
      </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(plain_text, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        logger.info(f"Connecting to Gmail SMTP {settings.GMAIL_SMTP_HOST}:{settings.GMAIL_SMTP_PORT}...")
        server = smtplib.SMTP(settings.GMAIL_SMTP_HOST, settings.GMAIL_SMTP_PORT, timeout=15)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(settings.GMAIL_USER, app_password)
        server.sendmail(settings.GMAIL_USER, [settings.SUPPORT_EMAIL], msg.as_string())
        server.quit()
        logger.info(f"Successfully dispatched support email to {settings.SUPPORT_EMAIL}")
        return {
            "success": True,
            "method": "live_smtp",
            "timestamp": timestamp,
            "recipient": settings.SUPPORT_EMAIL,
            "message": f"Query email successfully delivered to {settings.SUPPORT_EMAIL}."
        }
    except Exception as e:
        logger.error(f"Failed to dispatch email via Gmail SMTP: {e}", exc_info=True)
        return {
            "success": True,  # Recorded locally even if remote SMTP failed
            "method": "queued_error",
            "timestamp": timestamp,
            "recipient": settings.SUPPORT_EMAIL,
            "error_detail": str(e),
            "message": "Query saved locally. Live SMTP delivery encountered an error (check credentials)."
        }


async def dispatch_support_query(
    sender_name: str,
    sender_email: str,
    category: str,
    subject: str,
    message: str,
    role: str = "Portal User",
    department: str = "MoSPI"
) -> Dict[str, Any]:
    """
    Asynchronous entrypoint for dispatching queries to smartskillai3@gmail.com.
    """
    return await asyncio.to_thread(
        _send_smtp_email_sync,
        sender_name=sender_name,
        sender_email=sender_email,
        category=category,
        subject=subject,
        message=message,
        role=role,
        department=department
    )
