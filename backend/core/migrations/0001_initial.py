from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="BaseProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(choices=[("student", "Student"), ("company", "Company")], max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="base_profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="CompanyProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("company_name", models.CharField(max_length=255)),
                ("industry", models.CharField(max_length=255)),
                ("size", models.CharField(max_length=80)),
                ("website", models.URLField(blank=True, null=True)),
                ("description", models.TextField()),
                ("logo", models.URLField(blank=True, null=True)),
                (
                    "base_profile",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE, related_name="company", to="core.baseprofile"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="CompanyPost",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField()),
                ("post_type", models.CharField(choices=[("job", "Job"), ("internship", "Internship"), ("training", "Training")], max_length=20)),
                ("location", models.CharField(max_length=255)),
                ("salary", models.CharField(blank=True, max_length=255, null=True)),
                ("requirements", models.TextField()),
                ("tags", models.JSONField(default=list)),
                ("is_featured", models.BooleanField(default=False)),
                ("boost_expires_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="posts", to="core.companyprofile"),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="RefreshToken",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("token_hash", models.CharField(max_length=128, unique=True)),
                ("jti", models.CharField(max_length=64, unique=True)),
                ("expires_at", models.DateTimeField()),
                ("is_revoked", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "replaced_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="core.refreshtoken"),
                ),
                (
                    "user",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="refresh_tokens", to=settings.AUTH_USER_MODEL),
                ),
            ],
        ),
        migrations.CreateModel(
            name="StudentProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("full_name", models.CharField(max_length=255)),
                ("university", models.CharField(max_length=255)),
                ("major", models.CharField(max_length=255)),
                ("year", models.PositiveSmallIntegerField()),
                ("skills", models.JSONField(default=list)),
                ("interests", models.JSONField(default=list)),
                ("projects", models.JSONField(blank=True, default=list)),
                (
                    "base_profile",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE, related_name="student", to="core.baseprofile"
                    ),
                ),
                ("saved_posts", models.ManyToManyField(blank=True, related_name="saved_by_students", to="core.companypost")),
            ],
        ),
        migrations.CreateModel(
            name="CompanySubscriptionPlan",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=50, unique=True)),
                ("name", models.CharField(max_length=100)),
                ("monthly_post_limit", models.PositiveIntegerField(default=0)),
                ("supports_boost", models.BooleanField(default=False)),
                ("monthly_price_cents", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name="CompanySubscription",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("started_at", models.DateTimeField(auto_now_add=True)),
                ("ends_at", models.DateTimeField()),
                ("is_active", models.BooleanField(default=True)),
                (
                    "company",
                    models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="subscription", to="core.companyprofile"),
                ),
                ("plan", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="core.companysubscriptionplan")),
            ],
        ),
        migrations.CreateModel(
            name="CompanyCreditWallet",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("available_credits", models.PositiveIntegerField(default=0)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="credit_wallet", to="core.companyprofile"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="CreditTransaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("credits", models.IntegerField()),
                ("reason", models.CharField(max_length=120)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "wallet",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="transactions", to="core.companycreditwallet"),
                ),
            ],
        ),
        migrations.AddIndex(model_name="baseprofile", index=models.Index(fields=["role"], name="core_basepr_role_afa4dc_idx")),
        migrations.AddIndex(
            model_name="companypost",
            index=models.Index(fields=["post_type", "created_at"], name="core_compan_post_ty_1ee4f2_idx"),
        ),
        migrations.AddIndex(model_name="companypost", index=models.Index(fields=["created_at"], name="core_compan_created_b0b823_idx")),
        migrations.AddIndex(
            model_name="refreshtoken",
            index=models.Index(fields=["user", "is_revoked", "expires_at"], name="core_refres_user_id_7ecf15_idx"),
        ),
    ]
