# Generated by Django 5.0.9 on 2024-10-23 01:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("interview", "0017_alter_module_file"),
    ]

    operations = [
        migrations.AlterField(
            model_name="module",
            name="case_abstract",
            field=models.TextField(),
        ),
        migrations.AlterField(
            model_name="module",
            name="prompt",
            field=models.TextField(),
        ),
        migrations.AlterField(
            model_name="module",
            name="system_prompt",
            field=models.TextField(),
        ),
    ]