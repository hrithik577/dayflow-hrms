import math
from typing import List, Dict, Any
from app.schemas.ai import ResumeScreeningRequest, ResumeScreeningResponse

def screen_resume_and_match(req: ResumeScreeningRequest) -> ResumeScreeningResponse:
    # 1. Skill Match Evaluation
    req_skills_clean = [s.strip().lower() for s in req.required_skills if s.strip()]
    cand_skills_clean = [s.strip().lower() for s in req.candidate_skills if s.strip()]

    # Extract additional skills mentioned in resume text
    resume_lower = req.candidate_resume_text.lower()
    for s in req_skills_clean:
        if s in resume_lower and s not in cand_skills_clean:
            cand_skills_clean.append(s)

    matched_skills = [s for s in req_skills_clean if s in cand_skills_clean]
    missing_skills = [s for s in req_skills_clean if s not in cand_skills_clean]

    skill_score = (len(matched_skills) / max(1, len(req_skills_clean))) * 100.0

    # 2. Text Keyword / Semantic Alignment
    jd_words = set(w for w in req.job_description.lower().split() if len(w) > 3)
    resume_words = set(w for w in req.candidate_resume_text.lower().split() if len(w) > 3)
    
    overlap = jd_words.intersection(resume_words)
    semantic_score = (len(overlap) / max(1, len(jd_words))) * 100.0 if jd_words else 80.0
    semantic_score = min(100.0, semantic_score * 2.0) # Scale factor for high relevance

    # 3. Experience Alignment
    exp_required = req.min_years_experience
    exp_actual = req.candidate_experience_years

    if exp_required == 0:
        exp_score = 100.0
        exp_desc = "Experience requirement satisfied (Entry/Open Level)."
    elif exp_actual >= exp_required:
        exp_score = 100.0
        exp_desc = f"Meets/exceeds requirement ({exp_actual} yrs vs {exp_required} yrs required)."
    else:
        exp_score = (exp_actual / max(0.1, exp_required)) * 100.0
        exp_desc = f"Below requirement ({exp_actual} yrs vs {exp_required} yrs required)."

    # 4. Overall Weighted Score (50% Skill, 30% Semantic, 20% Experience)
    overall_match = round(
        (skill_score * 0.50) + (semantic_score * 0.30) + (exp_score * 0.20),
        1
    )

    # 5. Recommendation Thresholds
    if overall_match >= 75.0 and len(missing_skills) <= 1:
        recommendation = "STRONG_MATCH"
    elif overall_match >= 55.0:
        recommendation = "POTENTIAL_MATCH"
    else:
        recommendation = "WEAK_MATCH"

    matched_display = [s.title() for s in matched_skills]
    missing_display = [s.title() for s in missing_skills]

    explainable_breakdown = {
        "Skill Alignment": round(skill_score, 1),
        "Job Description Relevance": round(semantic_score, 1),
        "Experience Match": round(exp_score, 1)
    }

    summary = (
        f"Candidate {req.candidate_name} scored {overall_match}% for '{req.job_title}'. "
        f"Skill coverage: {len(matched_skills)}/{len(req_skills_clean)} required skills matched. "
        f"Experience assessment: {exp_desc}"
    )

    return ResumeScreeningResponse(
        candidate_name=req.candidate_name,
        job_title=req.job_title,
        match_score=overall_match,
        recommendation=recommendation,
        matched_skills=matched_display,
        missing_required_skills=missing_display,
        skill_match_pct=round(skill_score, 1),
        experience_match=exp_desc,
        explainable_breakdown=explainable_breakdown,
        summary_rationale=summary
    )
