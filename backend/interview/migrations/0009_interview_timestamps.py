# Generated by Django 5.0.9 on 2024-10-19 19:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('interview', '0008_remove_interview_timestamps'),
    ]

    operations = [
        migrations.AddField(
            model_name='interview',
            name='timestamps',
            field=models.JSONField(default=list),
        ),
    ]