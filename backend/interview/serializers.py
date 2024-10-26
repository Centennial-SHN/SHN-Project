from rest_framework import serializers
from .models import Module, Users,Admin

class ModuleSerializer(serializers.ModelSerializer):
    files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )
    # class Meta:
    #     model = Module
    #     fields = "__all__"
    #     extra_kwargs = {
    #         'moduleid': {'required': False}  # Make moduleid not required in the serializer
    #     }
    class Meta:
        model = Module
        fields = ['moduleid', 'modulename', 'prompt', 'voice', 
                 'system_prompt', 'case_abstract', 'file', 'model','files']
        read_only_fields = ['moduleid']

    def create(self, validated_data):
        validated_data.pop('files', None)
        module = Module.objects.create(**validated_data)
        return module

        
        
    

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = ['email', 'password']
    # def create(self, validated_data):
    #     user = super().create(validated_data) 
    #     password = user.password
    #     print(user.password)
    #     user.set_password(password)
    #     print(user.password)
    #     user.save()
    #     return user
    def create(self, validated_data):
        # Create a new user instance
        user = Users.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
        )
        # user.save()  # Save the user instance to the database
        return user

    def validate_email(self, value):
        # Check if the email is already registered
        if Users.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value):
        # Add custom password validation if needed
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value