from django.db import migrations, models


def backfill_profile_username(apps, schema_editor):
    StudentProfile = apps.get_model("core", "StudentProfile")
    for sp in StudentProfile.objects.all():
        if not sp.profile_username:
            sp.profile_username = f"student_{sp.pk}"
            sp.save(update_fields=["profile_username"])


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0003_companyprofile_is_verified_companypost_is_published_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="studentprofile",
            name="bio",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="studentprofile",
            name="profile_picture",
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="studentprofile",
            name="profile_username",
            field=models.CharField(blank=True, max_length=50, null=True, unique=True),
        ),
        migrations.AlterField(
            model_name="studentprofile",
            name="major",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AlterField(
            model_name="studentprofile",
            name="university",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AlterField(
            model_name="studentprofile",
            name="year",
            field=models.PositiveSmallIntegerField(default=1),
        ),
        migrations.RunPython(backfill_profile_username, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="studentprofile",
            name="profile_username",
            field=models.CharField(max_length=50, unique=True),
        ),
    ]
