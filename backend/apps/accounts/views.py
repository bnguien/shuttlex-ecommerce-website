from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer, EmailOrUsernameTokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

class EmailOrUsernameTokenObtainPairView(TokenObtainPairView):
    """
    Custom TokenObtainPairView that allows login with email or username
    """
    serializer_class = EmailOrUsernameTokenObtainPairSerializer

# Create your views here.
@api_view(["POST"])
def UserRegisterView(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'User registered successfully!',
            'user': {
                'username': user.username,
                'email': user.email
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'message': 'Registration failed!',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_username(request):
    user = request.user
    return Response({"username": user.username})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_first_name(request):
    user = request.user
    return Response({"first_name": user.first_name})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_last_name(request):
    user = request.user
    return Response({"last_name": user.last_name})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_email(request):
    user = request.user
    return Response({"email": user.email})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_role(request):
    user = request.user
    return Response({
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser
    })