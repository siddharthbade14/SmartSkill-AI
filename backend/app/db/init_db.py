import os
import json
import logging
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import engine, SessionLocal, Base
from app.models.user import User
from app.models.document import Document
from app.models.quiz import Quiz
from app.models.question import Question

logger = logging.getLogger("smartskill_ai.init_db")

SAMPLE_DOCUMENT_TEXT = """
GOVERNMENT OF INDIA
MINISTRY OF STATISTICS AND PROGRAMME IMPLEMENTATION (MoSPI)
National Sample Survey & National Accounts Technical Manual (Handbook 2026)

1. Sampling Frame Architecture & Primary Sampling Units (PSU)
For rural sectors, the Primary Sampling Unit (PSU) is defined strictly as the Census Village in accordance with the latest decennial Population Census frame.
In urban areas, the Urban Frame Survey (UFS) blocks constitute the First Stage Units (FSUs).
Stratification must minimize intra-stratum variance by grouping administrative sub-districts showing homogeneous agricultural and demographic characteristics.

2. Non-Response Protocols & Field Verification Standard Operating Procedures
When an investigator encounters a non-responsive sampled household or locked dwelling, informal substitution is strictly prohibited.
The surveyor must log standardized Non-Response Code 03 (Temporary Absence) or Code 04 (Refusal) after three documented visits.
Substitution is permitted only with explicit written authorization from the Field Supervisor using a pre-designated replacement unit from the identical sub-stratum.

3. National Accounts Compilation & Gross Value Added (GVA)
Under the System of National Accounts (SNA 2008) guideline implemented by the Central Statistics Office,
Gross Value Added (GVA) at basic prices is compiled as Output at basic prices minus Intermediate Consumption at purchaser's prices.
Gross Domestic Product (GDP) at market prices is subsequently derived as GVA at basic prices plus Product Taxes minus Product Subsidies.

4. Consumer Price Index (CPI) Basket Weighing & Quality Standards
CPI weights are calculated strictly from the nationwide Household Consumer Expenditure Survey (HCES).
Inter-temporal consistency checks require surveyors to flag any price quote exhibiting a variance exceeding 20% relative to the prior month's report.
All microdata must undergo statistical anonymization (k-anonymity >= 5) before release to open government repositories.
"""

SAMPLE_TABLES_JSON = json.dumps([
    {
        "table_index": 1,
        "page_number": 1,
        "caption": "Table 1: State-wise Sample Allocation Matrix (Sample Round)",
        "headers": ["State / Region", "Rural PSUs", "Urban FSUs", "Target Margin of Error (%)", "Supervisory Audit Rate"],
        "rows": [
            ["Northern Zone (Uttar Pradesh, Punjab)", "1,240", "980", "1.8%", "15% Mandatory"],
            ["Western Zone (Maharashtra, Gujarat)", "1,120", "1,040", "1.7%", "15% Mandatory"],
            ["Southern Zone (Karnataka, Tamil Nadu)", "960", "880", "1.9%", "15% Mandatory"],
            ["Eastern & NE (West Bengal, Assam)", "840", "620", "2.1%", "20% Mandatory"]
        ]
    }
])


def init_db(db: Session = None) -> None:
    """
    Idempotent database initializer and seeder.
    Ensures essential roles, sample documents, active published assessments,
    and HITL review queues are always available for evaluators and learners.
    """
    logger.info("Verifying database schema and initial data...")
    Base.metadata.create_all(bind=engine)
    
    close_db_at_end = False
    if db is None:
        db = SessionLocal()
        close_db_at_end = True

    try:
        # 1. Ensure Default System Users
        admin_user = db.query(User).filter(User.email == "admin@mospi.gov.in").first()
        if not admin_user:
            admin_user = User(
                email="admin@mospi.gov.in",
                hashed_password=get_password_hash("Admin@123"),
                full_name="Dr. Arvind Saxena (Senior Deputy Director General)",
                role="admin",
                department="National Statistical Systems Training Academy (NSSTA), MoSPI",
                is_active=True
            )
            db.add(admin_user)
            db.flush()
            logger.info("Created Admin Trainer: admin@mospi.gov.in")

        learner_user = db.query(User).filter(User.email == "officer@mospi.gov.in").first()
        if not learner_user:
            learner_user = User(
                email="officer@mospi.gov.in",
                hashed_password=get_password_hash("Learner@123"),
                full_name="Pooja Sharma (Junior Statistical Officer)",
                role="learner",
                department="Field Operations Division (FOD), MoSPI",
                is_active=True
            )
            db.add(learner_user)
            db.flush()
            logger.info("Created Learner Officer: officer@mospi.gov.in")

        # 2. Ensure Sample Ingested Document
        doc_filename = "MoSPI_Field_Manual_2026.pdf"
        sample_doc = db.query(Document).filter(Document.filename == doc_filename).first()
        if not sample_doc:
            doc_path = os.path.join(settings.UPLOAD_DIR, doc_filename)
            # Attempt to generate real PDF file on disk if possible
            try:
                os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
                if not os.path.exists(doc_path):
                    from reportlab.lib.pagesizes import letter
                    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
                    from reportlab.lib.styles import getSampleStyleSheet
                    doc_pdf = SimpleDocTemplate(doc_path, pagesize=letter)
                    styles = getSampleStyleSheet()
                    doc_pdf.build([Paragraph(SAMPLE_DOCUMENT_TEXT.replace("\n", "<br/>"), styles['Normal'])])
            except Exception as pdf_err:
                logger.warning(f"Note: PDF generation on local disk skipped: {pdf_err}")

            sample_doc = Document(
                title="MoSPI Field Operations & National Accounts Technical Manual (2026)",
                filename=doc_filename,
                file_path=doc_path,
                file_size_bytes=len(SAMPLE_DOCUMENT_TEXT),
                page_count=1,
                extracted_text=SAMPLE_DOCUMENT_TEXT,
                extracted_tables_json=SAMPLE_TABLES_JSON,
                uploaded_by_id=admin_user.id
            )
            db.add(sample_doc)
            db.flush()
            logger.info("Created sample document: MoSPI_Field_Manual_2026.pdf")

        # 3. Ensure Default Published Quiz for Learners (Active Assessment Bank)
        published_quiz = db.query(Quiz).filter(Quiz.status == "PUBLISHED").first()
        if not published_quiz:
            published_quiz = Quiz(
                title="Official Statistics & Field Survey Methodology (Level 1)",
                description="Core micro-learning module for field officers covering rural/urban PSU selection, non-response protocol, and GVA formula.",
                document_id=sample_doc.id,
                status="PUBLISHED",
                target_competency="Statistical Methodology & Data Governance",
                time_limit_minutes=15,
                passing_percentage=70,
                created_by_id=admin_user.id
            )
            db.add(published_quiz)
            db.flush()

            # Seed 4 Approved MCQs
            questions = [
                Question(
                    quiz_id=published_quiz.id,
                    question_text="For rural sectors, what entity constitutes the Primary Sampling Unit (PSU) according to the MoSPI Manual?",
                    option_a="Census Village as per the latest decennial Population Census frame",
                    option_b="Gram Panchayat administrative headquarters",
                    option_c="District Agricultural Extension block",
                    option_d="Revenue circle encompassing 10 or more contiguous hamlets",
                    correct_option="A",
                    explanation="Chapter 1 of the manual specifies that the Census Village in the latest decennial frame constitutes the rural PSU.",
                    competency_tag="Sampling Frame & Design",
                    difficulty="Beginner",
                    source_reference="Manual Section 1: Sampling Frame Architecture",
                    review_status="APPROVED",
                    reviewed_by_id=admin_user.id
                ),
                Question(
                    quiz_id=published_quiz.id,
                    question_text="What action must a field investigator take when encountering a locked dwelling on the first visit?",
                    option_a="Immediately substitute with an adjacent dwelling in the same lane",
                    option_b="Log the visit and attempt three documented visits before seeking supervisory replacement authorization",
                    option_c="Omit the schedule completely without assigning any non-response code",
                    option_d="Estimate demographic parameters from neighbor statements",
                    correct_option="B",
                    explanation="Chapter 2 strictly prohibits informal substitution; 3 visits must be logged before supervisory substitution is permitted.",
                    competency_tag="Data Quality Control & Field Verification",
                    difficulty="Intermediate",
                    source_reference="Manual Section 2: Non-Response Protocols",
                    review_status="APPROVED",
                    reviewed_by_id=admin_user.id
                ),
                Question(
                    quiz_id=published_quiz.id,
                    question_text="How is Gross Value Added (GVA) at basic prices defined in the System of National Accounts (SNA 2008)?",
                    option_a="Output at basic prices minus Intermediate Consumption at purchaser's prices",
                    option_b="GDP at market prices plus Total Product Subsidies",
                    option_c="Final Consumption Expenditure minus Total Net Exports",
                    option_d="Compensation of Employees multiplied by Capital Consumption Factor",
                    correct_option="A",
                    explanation="SNA 2008 defines GVA at basic prices as Output at basic prices minus Intermediate Consumption at purchaser's prices.",
                    competency_tag="National Accounts Statistics",
                    difficulty="Intermediate",
                    source_reference="Manual Section 3: National Accounts Compilation",
                    review_status="APPROVED",
                    reviewed_by_id=admin_user.id
                ),
                Question(
                    quiz_id=published_quiz.id,
                    question_text="According to Chapter 4, what inter-temporal variance threshold mandates supervisory price verification in CPI reporting?",
                    option_a="Variance exceeding 5%",
                    option_b="Variance exceeding 10%",
                    option_c="Variance exceeding 20% relative to the prior month",
                    option_d="Variance exceeding 50% relative to baseline year",
                    correct_option="C",
                    explanation="Chapter 4 explicitly requires flagging any price quote whose variance exceeds 20% relative to the previous month.",
                    competency_tag="Price Statistics & Indices",
                    difficulty="Advanced",
                    source_reference="Manual Section 4: CPI Weighing & Quality Standards",
                    review_status="APPROVED",
                    reviewed_by_id=admin_user.id
                )
            ]
            db.add_all(questions)
            db.flush()
            logger.info("Created Published Quiz with 4 Approved MCQs")

        # 4. Ensure HITL Draft Quiz for Admin Review Queue
        draft_quiz = db.query(Quiz).filter(Quiz.status == "UNDER_REVIEW").first()
        if not draft_quiz:
            draft_quiz = Quiz(
                title="AI-Generated Review Queue: Survey Auditing & Quality",
                description="Recently generated draft questions from the 2026 Manual awaiting human-in-the-loop expert trainer vetting.",
                document_id=sample_doc.id,
                status="UNDER_REVIEW",
                target_competency="Data Quality Control & Field Verification",
                time_limit_minutes=15,
                passing_percentage=70,
                created_by_id=admin_user.id
            )
            db.add(draft_quiz)
            db.flush()

            pending_questions = [
                Question(
                    quiz_id=draft_quiz.id,
                    question_text="In Table 1 of the manual, which geographic zone has a mandatory supervisory audit rate of 20%?",
                    option_a="Eastern & North-Eastern Zone",
                    option_b="Northern Zone",
                    option_c="Western Zone",
                    option_d="Southern Zone",
                    correct_option="A",
                    explanation="Table 1 lists the supervisory audit rate for the Eastern & NE Zone as 20% due to terrain complexity, while other zones are 15%.",
                    competency_tag="Data Quality Control & Field Verification",
                    difficulty="Intermediate",
                    source_reference="Table 1: State-wise Sample Allocation Matrix",
                    review_status="PENDING_REVIEW"
                ),
                Question(
                    quiz_id=draft_quiz.id,
                    question_text="What is the First Stage Unit (FSU) employed for urban survey sampling in the MoSPI framework?",
                    option_a="Urban Frame Survey (UFS) block",
                    option_b="Municipal Ward boundary",
                    option_c="Postal PIN Code zone",
                    option_d="Metropolitan Metropolitan Planning Committee area",
                    correct_option="A",
                    explanation="Section 1 clarifies that Urban Frame Survey (UFS) blocks constitute the FSUs in urban areas.",
                    competency_tag="Sampling Frame & Design",
                    difficulty="Beginner",
                    source_reference="Manual Section 1: Urban Frame Survey Blocks",
                    review_status="PENDING_REVIEW"
                ),
                Question(
                    quiz_id=draft_quiz.id,
                    question_text="What is the minimum statistical k-anonymity threshold required before microdata dissemination?",
                    option_a="k-anonymity >= 2",
                    option_b="k-anonymity >= 5",
                    option_c="k-anonymity >= 10",
                    option_d="k-anonymity >= 25",
                    correct_option="B",
                    explanation="Section 4 mandates that all microdata sets released to open repositories must satisfy k-anonymity >= 5.",
                    competency_tag="Data Governance & Audit",
                    difficulty="Advanced",
                    source_reference="Manual Section 4: Anonymization Standards",
                    review_status="PENDING_REVIEW"
                )
            ]
            db.add_all(pending_questions)
            db.flush()
            logger.info("Created HITL Draft Quiz with 3 Pending MCQs")

        db.commit()
        logger.info("Database initialization completed successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Database initialization encountered an error: {e}", exc_info=True)
        raise e
    finally:
        if close_db_at_end:
            db.close()
