# Generated by Django 5.0.9 on 2024-10-19 22:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('interview', '0010_alter_module_file'),
    ]

    operations = [
        migrations.AlterField(
            model_name='module',
            name='file',
            field=models.JSONField(blank=True, default=list, null=True),
        ),
    ]