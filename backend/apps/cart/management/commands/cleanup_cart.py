from datetime import timedelta
import logging

from django.core.management import BaseCommand
from django.utils import timezone

from backend.apps.cart.models import Cart

logger = logging.getLogger(__name__)

class Command(BaseCommand):
     help = 'Delete shopping carts that have not been accessed in the last 30 days.'
     def add_arguments(self, parser):
          '''Allow users to specify the number of expiration days via --days flag'''
          parser.add_argument(
               '--days',
               type=int,
               default=30,
               help='Specify the number of days of inactivity before deletion (default: 30)'
          )
     
     def handle(self, *args, **options):
          days = options['days']
          expiry_limit = timezone.now() - timedelta(days=days)

          '''Query for carts that have not been accessed since the expiry_limit'''
          expired_carts = Cart.objects.filter(
               last_accessed_at__lt=expiry_limit, 
               is_active=True,
               user__isnull=True
          )
          count  = expired_carts.count()

          if count == 0:
               self.stdout.write(self.style.SUCCESS('No expired carts found. System is clean.'))
               return

          '''Bulk delete - this will trigger CASCADE deletion for CartItems'''
          expired_carts.delete()

          message = f"Successfully deleted {count} stale carts inactive since {expiry_limit.strftime('%d-%m-%Y')}"
          self.stdout.write(self.style.SUCCESS(message))
          logger.info(message)