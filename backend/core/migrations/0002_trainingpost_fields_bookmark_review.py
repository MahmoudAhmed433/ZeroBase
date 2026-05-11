import django.db.models.deletion
import django.utils.timezone
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="trainingpost",
            name="category",
            field=models.CharField(default="General", max_length=120),
        ),
        migrations.AddField(
            model_name="trainingpost",
            name="level",
            field=models.CharField(default="Beginner", max_length=80),
        ),
        migrations.AddField(
            model_name="trainingpost",
            name="price",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.CreateModel(
            name="Bookmark",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("post", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="bookmarks", to="core.trainingpost")),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="bookmarks", to="core.customuser")),
            ],
            options={"ordering": ["-created_at"], "unique_together": {("post", "student")}},
        ),
        migrations.CreateModel(
            name="CompanyReview",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("rating", models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])),
                ("comment", models.TextField()),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("company", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reviews", to="core.company")),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="company_reviews", to="core.customuser")),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
