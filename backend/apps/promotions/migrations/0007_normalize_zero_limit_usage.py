from django.db import migrations


def normalize_zero_limit_usage(apps, schema_editor):
    Voucher = apps.get_model("promotions", "Voucher")
    Voucher.objects.filter(limit_usage=0).update(limit_usage=None)


class Migration(migrations.Migration):

    dependencies = [
        ("promotions", "0006_alter_voucher_limit_usage"),
    ]

    operations = [
        migrations.RunPython(normalize_zero_limit_usage, migrations.RunPython.noop),
    ]
