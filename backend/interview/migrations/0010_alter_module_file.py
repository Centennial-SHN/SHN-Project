# Generated by Django 5.0.9 on 2024-10-19 22:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('interview', '0009_interview_timestamps'),
    ]

    operations = [
        migrations.AlterField(
            model_name='module',
            name='file',
            field=models.TextField(blank=True, null=True),
        ),
    ]
