from rest_framework import serializers
from .models import Module, Users

class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = "__all__"