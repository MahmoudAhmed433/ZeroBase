from django.db.models import Q
from django.utils import timezone

from core.models import CompanyPost, PostPaymentTransaction
from core.services.security import SecurityError, ensure_safe_text


def serialize_post(post: CompanyPost):
    return {
        "id": post.id,
        "company": {
            "id": post.company.id,
            "name": post.company.company_name,
            "logo": post.company.logo,
        },
        "title": post.title,
        "description": post.description,
        "type": post.post_type,
        "location": post.location,
        "salary": post.salary,
        "requirements": post.requirements,
        "tags": post.tags,
        "payment_status": post.payment_status,
        "is_published": post.is_published,
        "payment_amount_usd": post.payment_amount_cents / 100,
        "is_featured": post.is_featured,
        "created_at": post.created_at.isoformat(),
    }


def create_post(company_profile, payload: dict):
    required = ("title", "description", "type", "location", "requirements")
    if any(not payload.get(k) for k in required):
        raise SecurityError("Missing required post fields")
    post_type = str(payload.get("type", "")).lower()
    if post_type not in {"job", "internship", "training"}:
        raise SecurityError("Invalid post type")

    tags = payload.get("tags") or []
    if not isinstance(tags, list):
        raise SecurityError("tags must be an array")

    post = CompanyPost.objects.create(
        company=company_profile,
        title=ensure_safe_text(payload["title"], "title"),
        description=ensure_safe_text(payload["description"], "description"),
        post_type=post_type,
        location=ensure_safe_text(payload["location"], "location"),
        salary=(payload.get("salary") or "").strip() or None,
        requirements=ensure_safe_text(payload["requirements"], "requirements"),
        tags=[ensure_safe_text(str(t), "tag") for t in tags],
        payment_status="pending",
        is_published=False,
        payment_amount_cents=1500,
    )
    PostPaymentTransaction.objects.create(
        post=post, company=company_profile, amount_cents=1500, status="pending", provider="mock"
    )
    return serialize_post(post)


def list_company_posts(company_profile):
    return [serialize_post(post) for post in company_profile.posts.all().order_by("-created_at")]


def confirm_post_payment(company_profile, post_id: int, payload: dict):
    post = CompanyPost.objects.filter(id=post_id, company=company_profile).first()
    if not post:
        raise SecurityError("Post not found")
    payment_status = payload.get("payment_status")
    transaction_ref = (payload.get("transaction_ref") or "").strip()
    if payment_status != "paid" or not transaction_ref:
        post.payment_status = "failed"
        post.save(update_fields=["payment_status"])
        PostPaymentTransaction.objects.create(
            post=post,
            company=company_profile,
            amount_cents=post.payment_amount_cents,
            status="failed",
            provider="mock",
            transaction_ref=transaction_ref or None,
        )
        raise SecurityError("Payment not completed")
    PostPaymentTransaction.objects.create(
        post=post,
        company=company_profile,
        amount_cents=post.payment_amount_cents,
        status="paid",
        provider="mock",
        transaction_ref=transaction_ref,
    )
    post.payment_status = "paid"
    post.is_published = True
    post.published_at = timezone.now()
    post.save(update_fields=["payment_status", "is_published", "published_at"])
    return serialize_post(post)


def list_posts(*, query: str = "", post_type: str = "", page: int = 1, page_size: int = 10):
    qs = CompanyPost.objects.select_related("company").filter(
        is_published=True, payment_status="paid", company__is_verified=True
    )
    if post_type:
        qs = qs.filter(post_type=post_type.lower())
    if query:
        qs = qs.filter(
            Q(title__icontains=query)
            | Q(tags__icontains=query)
            | Q(company__company_name__icontains=query)
        )

    page = max(page, 1)
    page_size = min(max(page_size, 1), 50)
    start = (page - 1) * page_size
    end = start + page_size
    total = qs.count()
    items = [serialize_post(post) for post in qs.order_by("-created_at")[start:end]]
    return {"items": items, "page": page, "page_size": page_size, "total": total, "has_next": total > end}
