import json
import re

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.utils import timezone

from core.models import BaseProfile, CompanyProfile, RefreshToken, StudentProfile, UserRole
from core.services.security import (
    SecurityError,
    build_access_token,
    build_refresh_token,
    parse_jwt,
    token_hash,
    validate_email_or_raise,
    validate_password_strength,
)

User = get_user_model()


def normalize_public_username(value: str) -> str:
    s = (value or "").strip().lower()
    if not re.match(r"^[a-z0-9_]{3,32}$", s):
        raise SecurityError("Username must be 3-32 characters (letters, numbers, underscore)")
    return s


def _normalize_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str):
        return [v.strip() for v in value.split(",") if v.strip()]
    return []


@transaction.atomic
def register_student(payload: dict):
    email = validate_email_or_raise(payload.get("email", ""))
    password = payload.get("password", "")
    validate_password_strength(password)
    if User.objects.filter(username=email).exists():
        raise SecurityError("Email already registered")

    username_raw = payload.get("username", "").strip()
    if not username_raw:
        raise SecurityError("username is required")
    public_username = normalize_public_username(username_raw)
    if StudentProfile.objects.filter(profile_username__iexact=public_username).exists():
        raise SecurityError("Username already taken")

    user = User.objects.create(
        username=email,
        email=email,
        first_name=username_raw,
        password=make_password(password),
    )
    base = BaseProfile.objects.create(user=user, role=UserRole.STUDENT)
    StudentProfile.objects.create(
        base_profile=base,
        full_name=username_raw,
        profile_username=public_username,
        university="",
        major="",
        year=1,
        skills=[],
        interests=[],
    )
    return issue_tokens(user, UserRole.STUDENT)


@transaction.atomic
def register_company(payload: dict):
    email = validate_email_or_raise(payload.get("email", ""))
    password = payload.get("password", "")
    validate_password_strength(password)
    if User.objects.filter(username=email).exists():
        raise SecurityError("Email already registered")
    company_name = payload.get("company_name", "").strip()
    industry = payload.get("industry", "").strip()
    size = payload.get("size", "").strip()
    description = payload.get("description", "").strip()
    if not all([company_name, industry, size, description]):
        raise SecurityError("Missing required company profile fields")

    user = User.objects.create(
        username=email,
        email=email,
        first_name=company_name,
        password=make_password(password),
    )
    base = BaseProfile.objects.create(user=user, role=UserRole.COMPANY)
    CompanyProfile.objects.create(
        base_profile=base,
        company_name=company_name,
        industry=industry,
        size=size,
        website=(payload.get("website") or "").strip() or None,
        description=description,
    )
    return issue_tokens(user, UserRole.COMPANY)


def login(payload: dict):
    email = validate_email_or_raise(payload.get("email", ""))
    password = payload.get("password", "")
    user = authenticate(username=email, password=password)
    if not user:
        raise SecurityError("Invalid credentials")
    role = user.base_profile.role
    return issue_tokens(user, role)


@transaction.atomic
def issue_tokens(user, role):
    access_token = build_access_token(user.id, role)
    refresh_token, jti, expires = build_refresh_token(user.id)
    RefreshToken.objects.create(user=user, token_hash=token_hash(refresh_token), jti=jti, expires_at=expires)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {"id": user.id, "email": user.email, "role": role},
    }


@transaction.atomic
def rotate_refresh_token(raw_refresh_token: str):
    payload = parse_jwt(raw_refresh_token)
    if payload.get("typ") != "refresh":
        raise SecurityError("Not a refresh token")
    current_hash = token_hash(raw_refresh_token)
    token_obj = RefreshToken.objects.filter(token_hash=current_hash).select_related("user").first()
    if not token_obj or token_obj.is_revoked or token_obj.expires_at < timezone.now():
        raise SecurityError("Refresh token invalid or expired")

    token_obj.is_revoked = True
    token_obj.save(update_fields=["is_revoked"])
    role = token_obj.user.base_profile.role
    access_token = build_access_token(token_obj.user.id, role)
    refresh_token, jti, expires = build_refresh_token(token_obj.user.id)
    replacement = RefreshToken.objects.create(
        user=token_obj.user, token_hash=token_hash(refresh_token), jti=jti, expires_at=expires
    )
    token_obj.replaced_by = replacement
    token_obj.save(update_fields=["replaced_by"])

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {"id": token_obj.user.id, "email": token_obj.user.email, "role": role},
    }


def parse_json(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError as exc:
        raise SecurityError("Invalid JSON payload") from exc


@transaction.atomic
def change_password(user, payload: dict):
    old_password = payload.get("old_password", "")
    new_password = payload.get("new_password", "")
    confirm_password = payload.get("confirm_password", "")
    if not old_password or not new_password:
        raise SecurityError("Password fields are required")
    if new_password != confirm_password:
        raise SecurityError("New passwords do not match")
    validate_password_strength(new_password)
    if not user.check_password(old_password):
        raise SecurityError("Current password is incorrect")
    user.set_password(new_password)
    user.save()
    RefreshToken.objects.filter(user=user, is_revoked=False).update(is_revoked=True)


@transaction.atomic
def delete_account(user):
    user.delete()
