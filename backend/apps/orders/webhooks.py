from decimal import Decimal
import hmac
import hashlib

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import authentication_classes, permission_classes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.orders.models import Order, OrderStatus, PaymentStatus, OrderHistory

def verify_vietqr_signature(raw_body: bytes, signature: str, secret_key: str) -> bool:
     if not signature:
          return False
     mac = hmac.new(secret_key.encode("utf-8"), msg=raw_body, digestmod=hashlib.sha256)
     expected = mac.hexdigest()
     return hmac.compare_digest(expected, signature.lower())

class VietQRWebhookView(APIView):
     authentication_classes = []
     permission_classes = []

     def post(self, request, *args, **kwargs):
          secret = getattr(settings, "VIETQR_WEBHOOK_SECRET", None)
          signature = request.headers.get("X-Signature", "")

          if not secret or not verify_vietqr_signature(request.body, signature, secret):
               return Response(
                    {"detail": "Invalid signature"},
                    status=status.HTTP_403_FORBIDDEN
               )

          payload = request.data
          transaction_id = payload.get("transaction_get")
          order_code = payload.get("order_code")
          amount_raw = payload.get("amount")

          if not transaction_id or not order_code or amount_raw is None:
               return Response(
                    {"detail": "Missing fields"},
                    status=status.HTTP_400_BAD_REQUEST
               )
          
          try:
               amount = Decimal(str(amount_raw))
          except Exception:
               return Response(
                    {"detail": "Invalid amount format"},
                    status=status.HTTP_400_BAD_REQUEST
               )
          
          with transaction.atomic():
               try:
                    order = Order.objects.select_for_update().get(code=order_code)
               except Order.DoesNotExist:
                    return Response(
                         {"detail": "Order not found"},
                         status=status.HTTP_200_OK
                    )

               if (
                    order.payment_transaction_id == transaction_id
                    and order.payment_status == PaymentStatus.PAID
               ):
                    return Response(
                         {"detail": "Already processed"},
                         status=status.HTTP_200_OK
               )

               
               if amount != order.total:
                    order.payment_provider = "vietqr"
                    order.payment_provider_response = payload
                    order.save(update_fields=[
                         "payment_provider",
                         "payment_provider_response"
                    ])
                    return Response(
                         {"detail": "Amount mismatch"},
                         status=status.HTTP_200_OK
                    )
               old_status = order.status
               old_payment_status = order.payment_status

               order.payment_status = PaymentStatus.PAID
               if order.status == OrderStatus.PENDING:
                    order.status = OrderStatus.CONFIRMED
               order.paid_at = timezone.now()
               order.payment_transaction_id = transaction_id
               order.payment_provider = "vietqr"
               order.payment_provider_response = payload
               order.save()

               OrderHistory.objects.create(
                    order=order,
                    from_status=old_status,
                    to_status=order.status,
                    from_payment_status=old_payment_status,
                    to_payment_status=order.payment_status,
                    note="Payment confirmed via VietQR webhook.",
               )

          return Response(
               {"detail": "OK"},
               status=status.HTTP_200_OK
          )