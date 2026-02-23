from rest_framework import serializers
from .models import CustomUser
from django.db import IntegrityError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = CustomUser
        fields = ["username", "email", "password1", "password2", "first_name", "last_name", "phone", "address"]
        extra_kwargs = {
            "first_name": {"required": False},
            "last_name": {"required": False},
            "phone": {"required": False},
            "address": {"required": False},
        }

    def validate_email(self, value):
        value = (value or "").strip().lower()
        if value and CustomUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email đã tồn tại.")
        return value

    def validate_username(self, value):
        value = (value or "").strip()
        if value and CustomUser.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username đã tồn tại.")
        return value

    def validate(self, data):
        if data.get('password1') != data.get('password2'):
            raise serializers.ValidationError({"password2": ["Passwords do not match."]})
        return data

    def save(self, **kwargs):
        return super().save(**kwargs)

    def create(self, validated_data):
        password = validated_data.pop('password1', None)
        validated_data.pop('password2', None)
        email = validated_data.get("email")
        if email:
            validated_data["email"] = email.strip().lower()

        try:
            user = CustomUser(**validated_data)
            if password:
                user.set_password(password)
            user.save()
            return user
        except IntegrityError as e:
            msg = str(e).lower()
            if "email" in msg:
                raise serializers.ValidationError({"email": ["Email đã tồn tại."]})
            if "username" in msg:
                raise serializers.ValidationError({"username": ["Username đã tồn tại."]})
            raise serializers.ValidationError({"detail": ["Dữ liệu không hợp lệ."]})


class RegisterSerializer(serializers.ModelSerializer):
    """Custom register serializer for dj-rest-auth with email validation"""
    password1 = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = CustomUser
        fields = ["username", "email", "password1", "password2", "first_name", "last_name"]
        extra_kwargs = {
            "first_name": {"required": False},
            "last_name": {"required": False},
        }

    def validate_email(self, value):
        value = (value or "").strip().lower()
        if value and CustomUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email đã tồn tại.")
        return value

    def validate_username(self, value):
        value = (value or "").strip()
        if value and CustomUser.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username đã tồn tại.")
        return value

    def validate(self, data):
        if data.get('password1') != data.get('password2'):
            raise serializers.ValidationError({"password2": ["Passwords do not match."]})
        return data

    def save(self, *args, **kwargs):
        password = self.validated_data.pop('password1', None)
        self.validated_data.pop('password2', None)
        email = self.validated_data.get("email")
        if email:
            self.validated_data["email"] = email.strip().lower()

        user = CustomUser(**self.validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        login = (attrs.get("username") or "").strip()
        password = attrs.get("password")

        if not login or not password:
            raise serializers.ValidationError('Must include "username" and "password".')

        if "@" in login:
            user = CustomUser.objects.filter(email__iexact=login).first()
            if user:
                attrs["username"] = user.username

        return super().validate(attrs)


class UserListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 
                  'phone', 'address', 'is_active', 'is_staff', 'is_superuser', 
                  'date_joined', 'last_login']
        read_only_fields = ['id', 'date_joined', 'last_login']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class UserWriteSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 
                  'phone', 'address', 'is_active', 'is_staff', 'is_superuser']
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False},
            'phone': {'required': False},
            'address': {'required': False},
        }
    
    def validate_email(self, value):
        value = (value or "").strip().lower()
        if not value:
            raise serializers.ValidationError("Email is required.")
        
        qs = CustomUser.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Email already exists.")
        return value
    
    def validate_username(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Username is required.")
        
        qs = CustomUser.objects.filter(username__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Username already exists.")
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        email = validated_data.get('email', '')
        if email:
            validated_data['email'] = email.strip().lower()
        
        user = CustomUser(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        email = validated_data.get('email', instance.email)
        if email:
            validated_data['email'] = email.strip().lower()
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance
