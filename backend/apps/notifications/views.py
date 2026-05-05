from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import NotificationSerializer
from .models import Notification


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['patch'], url_path='read')
    def mark_read(self, request, pk=None):
        notif = self.get_object();
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response({'status': 'marked as read'})
    
    @action(detail=True, methods=['patch'], url_path='unread')
    def mark_unread(self, request, pk=None):
        notif = self.get_object();
        notif.is_read = False
        notif.save(update_fields=['is_read'])
        return Response({'status': 'marked as unread'})
    
    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'all marked as read'})
        
    @action(detail=False, methods=['delete'], url_path='clear-all')
    def clear_all(self, request):
        count, _ = self.get_queryset().delete()
        
        import inflect
        p = inflect.engine()
        return Response(
            {'status': f"deleted {p.no('notification', count)}"},
            status=status.HTTP_200_OK
        )
        
    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})
    