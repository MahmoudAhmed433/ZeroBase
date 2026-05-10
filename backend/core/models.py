from django.conf import settings
from django.db import models


class UserRole(models.TextChoices):
    STUDENT = "student", "Student"
    COMPANY = "company", "Company"


class BaseProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="base_profile")
    role = models.CharField(max_length=20, choices=UserRole.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["role"])]


class StudentProfile(models.Model):
    base_profile = models.OneToOneField(BaseProfile, on_delete=models.CASCADE, related_name="student")
    full_name = models.CharField(max_length=255)
    profile_username = models.CharField(max_length=50, unique=True, blank=True, null=True)
    university = models.CharField(max_length=255, blank=True, default="")
    major = models.CharField(max_length=255, blank=True, default="")
    year = models.PositiveSmallIntegerField(default=1)
    bio = models.TextField(blank=True, default="")
    profile_picture = models.URLField(blank=True, null=True)
    skills = models.JSONField(default=list)
    interests = models.JSONField(default=list)
    projects = models.JSONField(default=list, blank=True)
    saved_posts = models.ManyToManyField("CompanyPost", blank=True, related_name="saved_by_students")


class CompanyProfile(models.Model):
    base_profile = models.OneToOneField(BaseProfile, on_delete=models.CASCADE, related_name="company")
    company_name = models.CharField(max_length=255)
    industry = models.CharField(max_length=255)
    size = models.CharField(max_length=80)
    website = models.URLField(blank=True, null=True)
    description = models.TextField()
    logo = models.URLField(blank=True, null=True)
    is_verified = models.BooleanField(default=True)


class CompanyPost(models.Model):
    POST_TYPES = (
        ("job", "Job"),
        ("internship", "Internship"),
        ("training", "Training"),
    )
    company = models.ForeignKey(CompanyProfile, on_delete=models.CASCADE, related_name="posts")
    title = models.CharField(max_length=255)
    description = models.TextField()
    post_type = models.CharField(max_length=20, choices=POST_TYPES)
    location = models.CharField(max_length=255)
    salary = models.CharField(max_length=255, blank=True, null=True)
    requirements = models.TextField()
    tags = models.JSONField(default=list)
    payment_status = models.CharField(
        max_length=20,
        choices=(("pending", "Pending"), ("paid", "Paid"), ("failed", "Failed")),
        default="pending",
    )
    payment_amount_cents = models.PositiveIntegerField(default=1500)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    boost_expires_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["post_type", "created_at"]),
            models.Index(fields=["created_at"]),
        ]


class RefreshToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="refresh_tokens")
    token_hash = models.CharField(max_length=128, unique=True)
    jti = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    is_revoked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    replaced_by = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        indexes = [models.Index(fields=["user", "is_revoked", "expires_at"])]


class CompanySubscriptionPlan(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    monthly_post_limit = models.PositiveIntegerField(default=0)
    supports_boost = models.BooleanField(default=False)
    monthly_price_cents = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)


class CompanySubscription(models.Model):
    company = models.OneToOneField(CompanyProfile, on_delete=models.CASCADE, related_name="subscription")
    plan = models.ForeignKey(CompanySubscriptionPlan, on_delete=models.PROTECT)
    started_at = models.DateTimeField(auto_now_add=True)
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)


class CompanyCreditWallet(models.Model):
    company = models.OneToOneField(CompanyProfile, on_delete=models.CASCADE, related_name="credit_wallet")
    available_credits = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)


class CreditTransaction(models.Model):
    wallet = models.ForeignKey(CompanyCreditWallet, on_delete=models.CASCADE, related_name="transactions")
    credits = models.IntegerField()
    reason = models.CharField(max_length=120)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class PostPaymentTransaction(models.Model):
    post = models.ForeignKey(CompanyPost, on_delete=models.CASCADE, related_name="payment_transactions")
    company = models.ForeignKey(CompanyProfile, on_delete=models.CASCADE, related_name="post_payments")
    amount_cents = models.PositiveIntegerField(default=1500)
    currency = models.CharField(max_length=10, default="USD")
    status = models.CharField(
        max_length=20, choices=(("pending", "Pending"), ("paid", "Paid"), ("failed", "Failed")), default="pending"
    )
    provider = models.CharField(max_length=30, default="mock")
    transaction_ref = models.CharField(max_length=128, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
