# Generated by Django 5.0.9 on 2024-10-19 19:12

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('interview', '0007_interview_timestamps'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='interview',
            name='timestamps',
        ),
    ]
