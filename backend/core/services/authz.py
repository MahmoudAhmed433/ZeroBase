from functools import wraps

from django.contrib.auth import get_user_model
from django.http import JsonResponse

from core.services.security import SecurityError, parse_jwt

User = get_user_model()


def require_auth(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return JsonResponse({"ok": False, "error": "Missing bearer token"}, status=401)
        token = header.split(" ", 1)[1]
        try:
            payload = parse_jwt(token)
            if payload.get("typ") != "access":
                raise SecurityError("Invalid access token")
            user = User.objects.filter(id=payload.get("sub")).first()
            if not user:
                raise SecurityError("User not found")
            request.auth_user = user
            request.auth_role = payload.get("role")
        except SecurityError as exc:
            return JsonResponse({"ok": False, "error": str(exc)}, status=401)
        return view(request, *args, **kwargs)

    return wrapped


def require_role(*roles):
    def decorator(view):
        @wraps(view)
        def wrapped(request, *args, **kwargs):
            if getattr(request, "auth_role", None) not in roles:
                return JsonResponse({"ok": False, "error": "Forbidden"}, status=403)
            return view(request, *args, **kwargs)

        return wrapped

    return decorator
