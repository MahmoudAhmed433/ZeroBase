from core.models import CompanyProfile, StudentProfile, UserRole
from core.services.auth_service import normalize_public_username
from core.services.post_service import serialize_post
from core.services.security import SecurityError, ensure_safe_text


def student_profile_payload(profile: StudentProfile):
    return {
        "role": UserRole.STUDENT,
        "email": profile.base_profile.user.email,
        "username": profile.profile_username or "",
        "full_name": profile.full_name,
        "university": profile.university or "",
        "major": profile.major or "",
        "year": profile.year,
        "bio": profile.bio or "",
        "profile_picture": profile.profile_picture,
        "skills": profile.skills,
        "interests": profile.interests,
        "projects": profile.projects,
        "saved_posts": [post.id for post in profile.saved_posts.all()],
    }


def company_profile_payload(profile: CompanyProfile):
    posts = [serialize_post(p) for p in profile.posts.all().order_by("-created_at")[:50]]
    return {
        "role": UserRole.COMPANY,
        "email": profile.base_profile.user.email,
        "company_name": profile.company_name,
        "industry": profile.industry,
        "size": profile.size,
        "website": profile.website,
        "description": profile.description,
        "logo": profile.logo,
        "is_verified": profile.is_verified,
        "posts": posts,
        "posted_jobs_history": [
            {
                "id": p.id,
                "title": p.title,
                "post_type": p.post_type,
                "created_at": p.created_at.isoformat(),
                "is_published": p.is_published,
                "payment_status": p.payment_status,
            }
            for p in profile.posts.all().order_by("-created_at")
        ],
    }


def update_profile(user, role: str, payload: dict):
    if role == UserRole.STUDENT:
        profile = user.base_profile.student
        if "username" in payload and payload["username"]:
            new_handle = normalize_public_username(str(payload["username"]))
            if (
                StudentProfile.objects.filter(profile_username__iexact=new_handle)
                .exclude(pk=profile.pk)
                .exists()
            ):
                raise SecurityError("Username already taken")
            profile.profile_username = new_handle
        if "full_name" in payload:
            profile.full_name = ensure_safe_text(str(payload["full_name"]), "full_name")
        for field in ("university", "major"):
            if field in payload:
                val = payload[field]
                setattr(profile, field, ensure_safe_text(str(val), field) if val else "")
        if "year" in payload and payload["year"] is not None:
            year = int(payload["year"])
            if year <= 0:
                raise SecurityError("year must be positive")
            profile.year = year
        if "bio" in payload:
            profile.bio = ensure_safe_text(str(payload.get("bio") or ""), "bio")
        if "profile_picture" in payload:
            url = (payload.get("profile_picture") or "").strip()
            profile.profile_picture = url or None
        if "skills" in payload:
            profile.skills = [ensure_safe_text(str(v), "skills") for v in payload["skills"]]
        if "interests" in payload:
            profile.interests = [ensure_safe_text(str(v), "interests") for v in payload["interests"]]
        if "projects" in payload:
            profile.projects = payload["projects"]
        profile.save()
        return student_profile_payload(profile)

    profile = user.base_profile.company
    for field in ("company_name", "industry", "size", "description"):
        if field in payload:
            setattr(profile, field, ensure_safe_text(str(payload[field]), field))
    if "website" in payload:
        raw = (payload.get("website") or "").strip()
        profile.website = raw or None
    if "logo" in payload:
        raw_logo = (payload.get("logo") or "").strip()
        profile.logo = raw_logo or None
    profile.save()
    return company_profile_payload(profile)
