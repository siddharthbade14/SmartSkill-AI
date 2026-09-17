from typing import List, Dict, Any
from app.schemas.assessment import CompetencyScore, CourseRecommendation


class RecommendationService:
    """
    iGOT Karmayogi Course Recommendation Engine.
    Maps identified statistical and governance knowledge gaps to targeted micro-learning courses.
    """

    IGOT_COURSE_CATALOG: Dict[str, Dict[str, Any]] = {
        "Sampling Frame & Design": {
            "course_id": "IGOT-MOSPI-101",
            "title": "Mastering Survey Sampling & Estimation Methodologies",
            "provider": "iGOT Karmayogi & National Statistical Systems Training Academy (NSSTA)",
            "duration": "2.5 Hours (Self-paced)",
            "url": "https://igotkarmayogi.gov.in/app/search?query=sampling+survey",
            "description": "Comprehensive training on stratified multi-stage sampling, rural/urban PSU selection, and variance minimization."
        },
        "Statistical Methodology & Data Governance": {
            "course_id": "IGOT-MOSPI-102",
            "title": "National Statistical Framework & Data Governance",
            "provider": "iGOT Karmayogi & MoSPI",
            "duration": "3 Hours",
            "url": "https://igotkarmayogi.gov.in/app/search?query=statistical+governance",
            "description": "Foundational principles of official statistics, administrative registers, and inter-agency data sharing standards."
        },
        "Data Quality Control & Field Verification": {
            "course_id": "IGOT-MOSPI-103",
            "title": "Field Data Verification, Auditing & Bias Mitigation",
            "provider": "iGOT Karmayogi & Field Operations Division (FOD)",
            "duration": "1.5 Hours",
            "url": "https://igotkarmayogi.gov.in/app/search?query=field+verification",
            "description": "Protocols for handling non-response, digital schedule validation, and field audit supervisory checks."
        },
        "National Accounts Statistics": {
            "course_id": "IGOT-MOSPI-104",
            "title": "National Accounts Compilation & Gross Value Added (GVA)",
            "provider": "iGOT Karmayogi & Central Statistics Office (CSO)",
            "duration": "4 Hours",
            "url": "https://igotkarmayogi.gov.in/app/search?query=national+accounts",
            "description": "In-depth guide to the System of National Accounts (SNA 2008), product and production taxes, and GVA compilation."
        },
        "Price Statistics & Indices": {
            "course_id": "IGOT-MOSPI-105",
            "title": "CPI & IIP Methodology and Index Construction",
            "provider": "iGOT Karmayogi & Economic Statistics Division",
            "duration": "2 Hours",
            "url": "https://igotkarmayogi.gov.in/app/search?query=price+indices",
            "description": "Consumer Price Index basket weighing, Laspeyres vs Paasche formulation, and industrial data adjustments."
        },
        "Data Governance & Audit": {
            "course_id": "IGOT-GOV-201",
            "title": "Digital Personal Data Protection & Public Data Integrity",
            "provider": "iGOT Karmayogi & MeitY",
            "duration": "2 Hours",
            "url": "https://igotkarmayogi.gov.in/app/search?query=data+integrity",
            "description": "Legal frameworks, anonymization protocols, and cyber security safeguards for government data officers."
        }
    }

    # Default fallback course
    DEFAULT_COURSE = {
        "course_id": "IGOT-GEN-001",
        "title": "Foundations of Public Policy Analysis & Statistical Literacy",
        "provider": "iGOT Karmayogi",
        "duration": "2 Hours",
        "url": "https://igotkarmayogi.gov.in/app/search?query=statistics",
        "description": "Core competencies in interpreting government reports, statistical indicators, and program monitoring."
    }

    @classmethod
    def evaluate_competencies_and_recommend(
        cls,
        answers_with_questions: List[Dict[str, Any]]
    ) -> (List[CompetencyScore], List[CourseRecommendation]):
        """
        Evaluates scores per competency domain and assigns tailored iGOT courses for weak spots.
        """
        domain_counts: Dict[str, Dict[str, int]] = {}

        for item in answers_with_questions:
            domain = item.get("competency_tag", "Statistical Methodology & Data Governance")
            is_correct = item.get("is_correct", False)

            if domain not in domain_counts:
                domain_counts[domain] = {"total": 0, "correct": 0}
            domain_counts[domain]["total"] += 1
            if is_correct:
                domain_counts[domain]["correct"] += 1

        competency_scores: List[CompetencyScore] = []
        recommendations: List[CourseRecommendation] = []
        recommended_course_ids = set()

        for domain, stats in domain_counts.items():
            total = stats["total"]
            correct = stats["correct"]
            pct = round((correct / total) * 100.0, 1) if total > 0 else 0.0

            if pct >= 80.0:
                status = "Mastered"
            elif pct >= 60.0:
                status = "Competent"
            else:
                status = "Needs Revision"

            competency_scores.append(
                CompetencyScore(
                    competency=domain,
                    total=total,
                    correct=correct,
                    percentage=pct,
                    status=status
                )
            )

            # Recommend course if score is below 80% (or if at least one question in that domain was incorrect)
            if pct < 80.0:
                course_info = cls.IGOT_COURSE_CATALOG.get(domain)
                if not course_info:
                    # Match by substring
                    for k, v in cls.IGOT_COURSE_CATALOG.items():
                        if k.lower() in domain.lower() or domain.lower() in k.lower():
                            course_info = v
                            break

                if not course_info:
                    course_info = cls.DEFAULT_COURSE

                if course_info["course_id"] not in recommended_course_ids:
                    recommended_course_ids.add(course_info["course_id"])
                    recommendations.append(
                        CourseRecommendation(
                            course_id=course_info["course_id"],
                            title=course_info["title"],
                            provider=course_info["provider"],
                            duration=course_info["duration"],
                            competency=domain,
                            reason=f"Recommended because your mastery score in '{domain}' was {pct}%. Completing this module will reinforce key concepts.",
                            url=course_info["url"]
                        )
                    )

        # If learner performed exceptionally well across all domains, recommend an advanced mastery course
        if not recommendations:
            adv_course = cls.IGOT_COURSE_CATALOG["Statistical Methodology & Data Governance"]
            recommendations.append(
                CourseRecommendation(
                    course_id=adv_course["course_id"],
                    title=adv_course["title"],
                    provider=adv_course["provider"],
                    duration=adv_course["duration"],
                    competency="Advanced Statistical Governance",
                    reason="Excellent performance! This advanced course will further deepen your strategic statistical leadership skills.",
                    url=adv_course["url"]
                )
            )

        return competency_scores, recommendations


recommendation_service = RecommendationService()
