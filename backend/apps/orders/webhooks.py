from decimal import Decimal
import hmac
import hashlib
import re

from django.conf import settings
from django.db import models, transaction
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
          
import logging

logger = logging.getLogger(__name__)

class SepayWebhookView(APIView):
     authentication_classes = []
     permission_classes = []
     
     def post(self, request, *args, **kwargs):
          # --- 1. Nhận Payload ---
          data = request.data
          logger.info(f"[SePay Webhook] Received payload: {data}")

          # --- 2. Xác thực API Key ---
          import os
          expected_key = os.environ.get("SEPAY_API_KEY", "")
          auth_header = request.headers.get("Authorization", "")
          
          if not expected_key:
               logger.error("[SePay Webhook] SEPAY_API_KEY is not set in environment variables!")
               return Response({"detail": "Server configuration error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

          if not auth_header.endswith(expected_key):
               logger.warning(f"[SePay Webhook] Unauthorized request. Header: {auth_header}")
               return Response({"detail": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
          
          # --- 3. Bóc tách payload ---
          amount = float(data.get("transferAmount", 0))
          content = data.get("content", "").upper()
          transaction_id = str(data.get("id", ""))
          
          logger.info(f"[SePay Webhook] Processing: Amount={amount}, Content='{content}', TransID={transaction_id}")

          # --- 4. Kiểm tra số tiền tối thiểu ---
          if amount < 2000:
               logger.info(f"[SePay Webhook] Amount {amount} is below threshold 2000. Skipping.")
               return Response({"detail": "Amount too small"}, status=status.HTTP_200_OK)
          
          # --- 5. Tìm mã đơn hàng (Regex thông minh hơn) ---
          match = re.search(r'SO[\s-]?([A-Z0-9]+)', content)
          if not match:
               logger.warning(f"[SePay Webhook] No order code found in content: '{content}'")
               return Response({"detail": "No order code found"}, status=status.HTTP_200_OK)
          
          # Lấy toàn bộ mã (ví dụ SO-ABC hoặc SOABC)
          extracted_code = match.group(0)
          logger.info(f"[SePay Webhook] Extracted code: {extracted_code}")

          with transaction.atomic():
               try:
                    # Thử tìm chính xác hoặc tìm dạng không có dấu gạch ngang
                    # (Để linh hoạt nếu user viết sai hoặc bank xóa ký tự đặc biệt)
                    core_code = match.group(1) 
                    full_code_with_dash = f"SO-{core_code}"
                    
                    order = Order.objects.select_for_update().filter(
                         models.Q(code__iexact=full_code_with_dash) | 
                         models.Q(code__iexact=f"SO{core_code}")
                    ).first()
                    
                    if not order:
                         logger.warning(f"[SePay Webhook] Order {extracted_code} not found in database.")
                         return Response({"detail": f"Order {extracted_code} not found"}, status=status.HTTP_200_OK)
               except Exception as e:
                    logger.error(f"[SePay Webhook] Database error: {str(e)}")
                    return Response({"detail": "Internal error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
               
               if order.payment_status == PaymentStatus.PAID:
                    logger.info(f"[SePay Webhook] Order {order.code} was already marked as PAID.")
                    return Response({"detail": "Already paid"}, status=status.HTTP_200_OK)
               
               # --- 6. Cập nhật trạng thái ---
               old_status = order.status
               old_payment = order.payment_status
               
               order.payment_status = PaymentStatus.PAID
               if order.status == OrderStatus.PENDING:
                    order.status = OrderStatus.CONFIRMED
               order.paid_at = timezone.now()
               order.payment_transaction_id = transaction_id
               order.payment_provider = "sepay"
               order.payment_provider_response = data
               order.save()
               
               OrderHistory.objects.create(
                    order=order,
                    from_status=old_status,
                    to_status=order.status,
                    from_payment_status=old_payment,
                    to_payment_status=order.payment_status,
                    note=f"Thanh toán tự động qua SePay: {amount}VND (Mã GD: {transaction_id})",
               )
               
               logger.info(f"[SePay Webhook] SUCCESSFULLY updated Order {order.code} to PAID.")
               return Response({"success": True}, status=status.HTTP_200_OK)
