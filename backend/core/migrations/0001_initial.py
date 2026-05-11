import django.contrib.auth.models
import django.contrib.auth.validators
import django.utils.timezone
import django.db.models.deletion
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="CustomUser",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("password", models.CharField(max_length=128, verbose_name="password")),
                ("last_login", models.DateTimeField(blank=True, null=True, verbose_name="last login")),
                ("is_superuser", models.BooleanField(default=False, help_text="Designates that this user has all permissions without explicitly assigning them.", verbose_name="superuser status")),
                ("username", models.CharField(error_messages={"unique": "A user with that username already exists."}, help_text="Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.", max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name="username")),
                ("first_name", models.CharField(blank=True, max_length=150, verbose_name="first name")),
                ("last_name", models.CharField(blank=True, max_length=150, verbose_name="last name")),
                ("is_staff", models.BooleanField(default=False, help_text="Designates whether the user can log into this admin site.", verbose_name="staff status")),
                ("is_active", models.BooleanField(default=True, help_text="Designates whether this user should be treated as active. Unselect this instead of deleting accounts.", verbose_name="active")),
                ("date_joined", models.DateTimeField(default=django.utils.timezone.now, verbose_name="date joined")),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("role", models.CharField(choices=[("STUDENT", "Student"), ("COMPANY", "Company")], max_length=20)),
                ("full_name", models.CharField(blank=True, max_length=255)),
                ("bio", models.TextField(blank=True)),
                ("groups", models.ManyToManyField(blank=True, help_text="The groups this user belongs to. A user will get all permissions granted to each of their groups.", related_name="user_set", related_query_name="user", to="auth.group", verbose_name="groups")),
                ("user_permissions", models.ManyToManyField(blank=True, help_text="Specific permissions for this user.", related_name="user_set", related_query_name="user", to="auth.permission", verbose_name="user permissions")),
            ],
            options={
                "verbose_name": "user",
                "verbose_name_plural": "users",
                "abstract": False,
            },
            managers=[("objects", django.contrib.auth.models.UserManager())],
        ),
        migrations.CreateModel(
            name="Company",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("logo", models.URLField(blank=True)),
                ("about_summary", models.TextField()),
                ("industry", models.CharField(max_length=120)),
                ("founded_date", models.DateField(blank=True, null=True)),
                ("headquarters", models.CharField(blank=True, max_length=255)),
                ("employee_range", models.CharField(blank=True, max_length=120)),
                ("official_website", models.URLField(blank=True)),
                ("linkedin_url", models.URLField(blank=True)),
                ("crunchbase_url", models.URLField(blank=True)),
                ("market_contribution", models.TextField(blank=True)),
                ("achievements", models.JSONField(blank=True, default=list)),
                ("sources", models.JSONField(blank=True, default=list)),
                ("milestones", models.JSONField(blank=True, default=list)),
                ("trust_score", models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])),
                ("is_verified", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="company_profile", to="core.customuser")),
            ],
            options={"ordering": ["-trust_score", "name"]},
        ),
        migrations.CreateModel(
            name="TrainingPost",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(help_text="Practical tasks and learning outcomes.")),
                ("duration", models.CharField(max_length=120)),
                ("prerequisites", models.TextField(blank=True)),
                ("instructor_info", models.CharField(help_text="Must be a working professional.", max_length=255)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("company", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="posts", to="core.company")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="Application",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("PENDING", "Pending"), ("ACCEPTED", "Accepted"), ("CONTACTED", "Contacted"), ("COMPLETED", "Completed")], default="PENDING", max_length=20)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("post", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="applications", to="core.trainingpost")),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="applications", to="core.customuser")),
            ],
            options={"ordering": ["-created_at"], "unique_together": {("post", "student")}},
        ),
    ]
