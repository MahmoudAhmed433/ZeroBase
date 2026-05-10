from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.http import require_GET, require_http_methods

from core.models import RefreshToken, UserRole
from core.services.auth_service import (
    change_password,
    delete_account,
    login,
    parse_json,
    register_company,
    register_student,
    rotate_refresh_token,
)
from core.services.authz import require_auth, require_role
from core.services.post_service import confirm_post_payment, create_post, list_company_posts, list_posts
from core.services.security import SecurityError, rate_limit, token_hash
from core.services.user_service import company_profile_payload, student_profile_payload, update_profile


def _ok(data, status=200):
    return JsonResponse({"ok": True, "data": data}, status=status)


def _err(message, status=400):
    return JsonResponse({"ok": False, "error": message}, status=status)


@require_GET
def csrf_token(request):
    return _ok({"csrf_token": get_token(request)})


@require_http_methods(["POST"])
@rate_limit("register", limit=7, window_seconds=60)
def register_student_view(request):
    try:
        payload = parse_json(request)
        tokens = register_student(payload)
    except SecurityError as exc:
        return _err(str(exc), 400)
    response = _ok({"access_token": tokens["access_token"], "user": tokens["user"]}, status=201)
    response.set_cookie("refresh_token", tokens["refresh_token"], httponly=True, samesite="Lax")
    return response


@require_http_methods(["POST"])
@rate_limit("register", limit=7, window_seconds=60)
def register_company_view(request):
    try:
        payload = parse_json(request)
        tokens = register_company(payload)
    except SecurityError as exc:
        return _err(str(exc), 400)
    response = _ok({"access_token": tokens["access_token"], "user": tokens["user"]}, status=201)
    response.set_cookie("refresh_token", tokens["refresh_token"], httponly=True, samesite="Lax")
    return response


@require_http_methods(["POST"])
@rate_limit("login", limit=10, window_seconds=60)
def login_view(request):
    try:
        payload = parse_json(request)
        tokens = login(payload)
    except SecurityError as exc:
        return _err(str(exc), 401)
    response = _ok({"access_token": tokens["access_token"], "user": tokens["user"]})
    response.set_cookie("refresh_token", tokens["refresh_token"], httponly=True, samesite="Lax")
    return response


@require_http_methods(["POST"])
def refresh_view(request):
    raw = request.COOKIES.get("refresh_token")
    if not raw:
        return _err("Missing refresh token", 401)
    try:
        tokens = rotate_refresh_token(raw)
    except SecurityError as exc:
        return _err(str(exc), 401)
    response = _ok({"access_token": tokens["access_token"], "user": tokens["user"]})
    response.set_cookie("refresh_token", tokens["refresh_token"], httponly=True, samesite="Lax")
    return response


@require_http_methods(["POST"])
@require_auth
def logout_view(request):
    raw = request.COOKIES.get("refresh_token")
    if raw:
        token_obj = RefreshToken.objects.filter(token_hash=token_hash(raw)).first()
        if token_obj:
            token_obj.is_revoked = True
            token_obj.save(update_fields=["is_revoked"])
    response = _ok({"message": "Logged out"})
    response.delete_cookie("refresh_token")
    return response


@require_http_methods(["POST"])
@require_auth
@rate_limit("change-password", limit=10, window_seconds=60)
def change_password_view(request):
    try:
        payload = parse_json(request)
        change_password(request.auth_user, payload)
    except SecurityError as exc:
        return _err(str(exc), 400)
    return _ok({"message": "Password updated successfully"})


@require_http_methods(["DELETE"])
@require_auth
def delete_account_view(request):
    try:
        delete_account(request.auth_user)
    except SecurityError as exc:
        return _err(str(exc), 400)
    response = _ok({"message": "Account deleted"})
    response.delete_cookie("refresh_token")
    return response


@require_http_methods(["GET", "PATCH"])
@require_auth
def profile_view(request):
    role = request.auth_role
    user = request.auth_user
    if request.method == "GET":
        if role == UserRole.STUDENT:
            return _ok(student_profile_payload(user.base_profile.student))
        return _ok(company_profile_payload(user.base_profile.company))
    try:
        payload = parse_json(request)
        updated = update_profile(user, role, payload)
    except SecurityError as exc:
        return _err(str(exc), 400)
    return _ok(updated)


@require_http_methods(["POST"])
@require_auth
@require_role(UserRole.COMPANY)
@rate_limit("create-post", limit=20, window_seconds=60)
def create_post_view(request):
    try:
        payload = parse_json(request)
        data = create_post(request.auth_user.base_profile.company, payload)
    except SecurityError as exc:
        return _err(str(exc), 400)
    return _ok(data, status=201)


@require_http_methods(["GET"])
@require_auth
@require_role(UserRole.COMPANY)
def company_posts_view(request):
    data = list_company_posts(request.auth_user.base_profile.company)
    return _ok({"items": data})


@require_http_methods(["POST"])
@require_auth
@require_role(UserRole.COMPANY)
def confirm_post_payment_view(request, post_id):
    try:
        payload = parse_json(request)
        data = confirm_post_payment(request.auth_user.base_profile.company, int(post_id), payload)
    except SecurityError as exc:
        return _err(str(exc), 400)
    return _ok(data)


@require_GET
@require_auth
def feed_view(request):
    query = request.GET.get("search", "").strip()
    post_type = request.GET.get("type", "").strip()
    page = int(request.GET.get("page", "1") or 1)
    page_size = int(request.GET.get("page_size", "10") or 10)
    data = list_posts(query=query, post_type=post_type, page=page, page_size=page_size)
    return _ok(data)
