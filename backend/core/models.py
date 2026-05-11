from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class CustomUser(AbstractUser):
    class Roles(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        COMPANY = "COMPANY", "Company"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Roles.choices)
    full_name = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)

    REQUIRED_FIELDS = ["email", "role"]

    def __str__(self):
        return f"{self.username} ({self.role})"


class Company(models.Model):
    user = models.OneToOneField(
        CustomUser, related_name="company_profile", on_delete=models.CASCADE, null=True, blank=True
    )
    name = models.CharField(max_length=255)
    logo = models.URLField(blank=True)
    about_summary = models.TextField()

    industry = models.CharField(max_length=120)
    founded_date = models.DateField(null=True, blank=True)
    headquarters = models.CharField(max_length=255, blank=True)
    employee_range = models.CharField(max_length=120, blank=True)

    official_website = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    crunchbase_url = models.URLField(blank=True)

    market_contribution = models.TextField(blank=True)
    achievements = models.JSONField(default=list, blank=True)
    sources = models.JSONField(default=list, blank=True)
    milestones = models.JSONField(default=list, blank=True)

    trust_score = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-trust_score", "name"]

    def __str__(self):
        return self.name

    def calculate_trust_score(self):
        score = 0
        if self.official_website:
            score += 25
        if self.linkedin_url:
            score += 25
        if self.crunchbase_url:
            score += 20
        # Up to 30 points from sources count.
        score += min(len(self.sources or []) * 6, 30)
        return max(0, min(score, 100))

    def save(self, *args, **kwargs):
        self.trust_score = self.calculate_trust_score()
        super().save(*args, **kwargs)

    @property
    def average_rating(self):
        reviews = self.reviews.all()
        if not reviews.exists():
            return 0
        return round(sum(item.rating for item in reviews) / reviews.count(), 1)

    @property
    def reviews_count(self):
        return self.reviews.count()


class TrainingPost(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="posts")
    title = models.CharField(max_length=255)
    description = models.TextField(help_text="Practical tasks and learning outcomes.")
    duration = models.CharField(max_length=120)
    category = models.CharField(max_length=120, default="General")
    level = models.CharField(max_length=80, default="Beginner")
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    prerequisites = models.TextField(blank=True)
    instructor_info = models.CharField(
        max_length=255,
        help_text="Must be a working professional.",
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Application(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        CONTACTED = "CONTACTED", "Contacted"
        COMPLETED = "COMPLETED", "Completed"

    post = models.ForeignKey(TrainingPost, on_delete=models.CASCADE, related_name="applications")
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="applications")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("post", "student")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student.username} -> {self.post.title}"


class Bookmark(models.Model):
    post = models.ForeignKey(TrainingPost, on_delete=models.CASCADE, related_name="bookmarks")
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="bookmarks")
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("post", "student")
        ordering = ["-created_at"]


class CompanyReview(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="reviews")
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="company_reviews")
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]
