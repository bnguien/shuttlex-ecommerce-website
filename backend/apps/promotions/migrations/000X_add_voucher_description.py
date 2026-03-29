from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ("promotions", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="voucher",
            name="description",
            field=models.CharField(max_length=255, blank=True, default=""),
        ),
    ]