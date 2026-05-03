from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer, EmailOrUsernameTokenObtainPairSerializer, UserListSerializer, UserWriteSerializer, UserAddressSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
from django.core.paginator import Paginator
from .models import CustomUser
from django.db.models import Q

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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_users(request):
    if not request.user.is_staff:
        return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
    
    search = request.GET.get('search', '').strip()
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 10))
    
    users = CustomUser.objects.all().order_by('-date_joined')
    
    if search:
        users = users.filter(
            Q(username__icontains=search) |
            Q(email__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search)
        )
    
    paginator = Paginator(users, page_size)
    page_obj = paginator.get_page(page)
    
    serializer = UserListSerializer(page_obj.object_list, many=True)
    
    return Response({
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'current_page': page,
        'results': serializer.data
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user(request, user_id):
    if not request.user.is_staff:
        return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = CustomUser.objects.get(id=user_id)
        serializer = UserListSerializer(user)
        return Response(serializer.data)
    except CustomUser.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_user(request):
    if not request.user.is_staff:
        return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = UserWriteSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(UserListSerializer(user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_user(request, user_id):
    if not request.user.is_staff:
        return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = UserWriteSerializer(user, data=request.data, partial=(request.method == "PATCH"))
    if serializer.is_valid():
        user = serializer.save()
        return Response(UserListSerializer(user).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_user(request, user_id):
    if not request.user.is_staff:
        return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = CustomUser.objects.get(id=user_id)
        # Prevent deleting yourself
        if user.id == request.user.id:
            return Response({"detail": "Cannot delete yourself."}, status=status.HTTP_400_BAD_REQUEST)
        user.delete()
        return Response({"detail": "User deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    except CustomUser.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_addresses(request):
    if request.method == 'GET':
        addreses = request.user.addresses.all()
        return Response(UserAddressSerializer(addreses, many=True).data)
    serializer = UserAddressSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def user_address_detail(request, address_id):
    address = request.user.addresses.filter(id=address_id).first()
    if not address:
        return Response(
            {'detail': 'Không tìm thấy.'},
            status=status.HTTP_404_NOT_FOUND
        )
    if request.method == 'DELETE':
        address.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    serializer = UserAddressSerializer(address, data=request.data, partial=True, context={'request': request})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def set_default_address(request, address_id):
    address = request.user.addresses.filter(id=address_id).first()
    if not address:
        return Response({"detail": "Không tìm thấy."}, status=status.HTTP_404_NOT_FOUND)
    request.user.addresses.filter(is_default=True).update(is_default=False)
    address.is_default = True
    address.save()
    return Response({"detail": "Đã đặt thành địa chỉ mặc định."})