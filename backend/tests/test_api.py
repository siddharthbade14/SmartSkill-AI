import pytest
from fastapi.testclient import TestClient
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.config import settings
from app.db.init_db import init_db

# Ensure seed data is initialized for test execution
init_db()

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == settings.PROJECT_NAME


def test_auth_login_admin():
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "admin@mospi.gov.in", "password": "Admin@123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" == "access_token" in data
    assert data["user"]["role"] == "admin"
    assert data["user"]["email"] == "admin@mospi.gov.in"


def test_auth_login_learner():
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "officer@mospi.gov.in", "password": "Learner@123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "learner"


def test_auth_invalid_credentials():
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "admin@mospi.gov.in", "password": "WrongPassword999"}
    )
    assert response.status_code == 401


def test_documents_listing():
    # Login as admin
    login_resp = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "admin@mospi.gov.in", "password": "Admin@123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    docs_resp = client.get(f"{settings.API_V1_STR}/documents/", headers=headers)
    assert docs_resp.status_code == 200
    docs = docs_resp.json()
    assert len(docs) >= 1
    assert "MoSPI" in docs[0]["title"]


def test_hitl_pending_and_review():
    # Login as admin
    login_resp = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "admin@mospi.gov.in", "password": "Admin@123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch pending questions
    pending_resp = client.get(f"{settings.API_V1_STR}/hitl/questions/pending", headers=headers)
    assert pending_resp.status_code == 200
    pending_questions = pending_resp.json()
    assert len(pending_questions) > 0

    target_q = pending_questions[0]
    q_id = target_q["id"]

    # Review and approve with modification
    review_payload = {
        "review_status": "APPROVED",
        "reviewer_notes": "Verified against Chapter 1 of the official manual by Senior Trainer.",
        "difficulty": "Intermediate"
    }
    review_resp = client.put(
        f"{settings.API_V1_STR}/hitl/questions/{q_id}/review",
        json=review_payload,
        headers=headers
    )
    assert review_resp.status_code == 200
    reviewed_q = review_resp.json()
    assert reviewed_q["review_status"] == "APPROVED"
    assert reviewed_q["reviewer_notes"] == review_payload["reviewer_notes"]


def test_learner_assessment_lifecycle():
    # 1. Login as learner
    login_resp = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "officer@mospi.gov.in", "password": "Learner@123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get available published quizzes
    avail_resp = client.get(f"{settings.API_V1_STR}/assessments/available", headers=headers)
    assert avail_resp.status_code == 200
    quizzes = avail_resp.json()
    assert len(quizzes) >= 1
    quiz_id = quizzes[0]["id"]

    # 3. Start quiz
    start_resp = client.get(f"{settings.API_V1_STR}/assessments/{quiz_id}/start", headers=headers)
    assert start_resp.status_code == 200
    quiz_data = start_resp.json()
    questions = quiz_data["questions"]
    assert len(questions) > 0
    # Ensure learner cannot see correct answers
    assert "correct_option" not in questions[0]
    assert "explanation" not in questions[0]

    # 4. Submit answers
    submission_payload = {
        "time_spent_seconds": 180,
        "answers": [
            {"question_id": questions[0]["id"], "selected_option": "A"},
            {"question_id": questions[1]["id"], "selected_option": "B"} if len(questions) > 1 else {"question_id": questions[0]["id"], "selected_option": "A"}
        ]
    }
    submit_resp = client.post(
        f"{settings.API_V1_STR}/assessments/{quiz_id}/submit",
        json=submission_payload,
        headers=headers
    )
    assert submit_resp.status_code == 200
    result = submit_resp.json()
    assert "score" in result
    assert "percentage" in result
    assert "competency_breakdown" in result
    assert "recommendations" in result
    assert len(result["competency_breakdown"]) > 0

    # 5. Check learner attempts history
    history_resp = client.get(f"{settings.API_V1_STR}/assessments/attempts", headers=headers)
    assert history_resp.status_code == 200
    attempts = history_resp.json()
    assert len(attempts) >= 1


def test_admin_analytics_overview():
    # Login as admin
    login_resp = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "admin@mospi.gov.in", "password": "Admin@123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    analytics_resp = client.get(f"{settings.API_V1_STR}/assessments/analytics/overview", headers=headers)
    assert analytics_resp.status_code == 200
    data = analytics_resp.json()
    assert "total_attempts" in data
    assert "unique_learners" in data
    assert "average_score_percent" in data
    assert "pass_rate_percent" in data


def test_quiz_clone_unpublish_and_delete():
    # Login as admin
    login_resp = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "admin@mospi.gov.in", "password": "Admin@123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch quizzes
    quizzes_resp = client.get(f"{settings.API_V1_STR}/quizzes/", headers=headers)
    assert quizzes_resp.status_code == 200
    quizzes = quizzes_resp.json()
    assert len(quizzes) > 0
    target_quiz = quizzes[0]

    # Clone quiz
    clone_resp = client.post(f"{settings.API_V1_STR}/quizzes/{target_quiz['id']}/clone", headers=headers)
    assert clone_resp.status_code == 201
    cloned_quiz = clone_resp.json()
    assert "Copy of" in cloned_quiz["title"]
    assert cloned_quiz["status"] == "UNDER_REVIEW"

    # Unpublish cloned quiz (should succeed or remain under review)
    unpub_resp = client.post(f"{settings.API_V1_STR}/quizzes/{cloned_quiz['id']}/unpublish", headers=headers)
    assert unpub_resp.status_code == 200
    assert unpub_resp.json()["status"] == "UNDER_REVIEW"

    # Delete cloned quiz
    del_resp = client.delete(f"{settings.API_V1_STR}/quizzes/{cloned_quiz['id']}", headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True

