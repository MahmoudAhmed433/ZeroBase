from django.contrib import admin

from django.contrib.auth.admin import UserAdmin

from .models import Application, Bookmark, Company, CompanyReview, CustomUser, TrainingPost


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("ZeroBase", {"fields": ("role", "full_name", "bio")}),
    )
    list_display = ("username", "email", "role", "is_staff")
    list_filter = ("role", "is_staff", "is_active")


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "industry", "trust_score", "is_verified", "founded_date")
    list_filter = ("industry", "is_verified")
    search_fields = ("name", "about_summary", "headquarters")
    readonly_fields = ("trust_score", "created_at", "updated_at")
    actions = ["mark_verified", "mark_unverified"]

    fieldsets = (
        ("Identity", {"fields": ("name", "logo", "about_summary")}),
        (
            "Company Profile",
            {"fields": ("industry", "founded_date", "headquarters", "employee_range")},
        ),
        (
            "Trust Data",
            {
                "fields": (
                    "official_website",
                    "linkedin_url",
                    "crunchbase_url",
                    "sources",
                    "trust_score",
                    "is_verified",
                )
            },
        ),
        (
            "Impact",
            {"fields": ("market_contribution", "achievements", "milestones")},
        ),
        ("System", {"fields": ("created_at", "updated_at")}),
    )

    @admin.action(description="Mark selected companies as verified")
    def mark_verified(self, request, queryset):
        queryset.update(is_verified=True)

    @admin.action(description="Mark selected companies as unverified")
    def mark_unverified(self, request, queryset):
        queryset.update(is_verified=False)


@admin.register(TrainingPost)
class TrainingPostAdmin(admin.ModelAdmin):
    list_display = ("title", "company", "category", "level", "price", "duration", "created_at")
    search_fields = ("title", "description", "instructor_info")
    list_filter = ("category", "level", "created_at")


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("student", "post", "status", "created_at")
    list_filter = ("status", "created_at")


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ("student", "post", "created_at")
    list_filter = ("created_at",)


@admin.register(CompanyReview)
class CompanyReviewAdmin(admin.ModelAdmin):
    list_display = ("company", "student", "rating", "created_at")
    list_filter = ("rating", "created_at")
