from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0002_rename_core_basepr_role_afa4dc_idx_core_basepr_role_0ecb77_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="companyprofile",
            name="is_verified",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="companypost",
            name="is_published",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="companypost",
            name="payment_amount_cents",
            field=models.PositiveIntegerField(default=1500),
        ),
        migrations.AddField(
            model_name="companypost",
            name="payment_status",
            field=models.CharField(
                choices=[("pending", "Pending"), ("paid", "Paid"), ("failed", "Failed")],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="companypost",
            name="published_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name="PostPaymentTransaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("amount_cents", models.PositiveIntegerField(default=1500)),
                ("currency", models.CharField(default="USD", max_length=10)),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "Pending"), ("paid", "Paid"), ("failed", "Failed")],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("provider", models.CharField(default="mock", max_length=30)),
                ("transaction_ref", models.CharField(blank=True, max_length=128, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="post_payments", to="core.companyprofile"
                    ),
                ),
                (
                    "post",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="payment_transactions", to="core.companypost"
                    ),
                ),
            ],
        ),
    ]
