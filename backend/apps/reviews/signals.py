from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import ProductReview, ReviewReply

User = get_user_model()

AUTO_REPLIES = {
    5: "Ôi cảm ơn bạn nhiều lắm nha!! 🥹🏸 Đọc được review này shop vui lắm luôn á, biết bạn hài lòng là động lực để shop tiếp tục cố gắng rồi!! Nhớ ghé lại ủng hộ shop nha bạn ơi 🫶",
    4: "Cảm ơn bạn đã dành thời gian đánh giá nha! 🙏✨ Shop ghi nhận hết rồi, sẽ cố gắng cải thiện để lần sau bạn cho shop 5 sao luôn nha hihi 😊🏸",
    3: "Cảm ơn bạn đã thành thật chia sẻ nha! 🙏 Shop thật sự xin lỗi vì trải nghiệm lần này chưa được như kỳ vọng 😔 Bạn có thể nhắn inbox cho shop biết thêm chi tiết không ạ? Shop muốn hỗ trợ bạn sớm nhất có thể nha 💪",
}
LOW_RATING_REPLY = "Shop thật sự rất xin lỗi bạn vì lần này chưa làm bạn hài lòng 😔💔 Mình hiểu cảm giác này không dễ chịu chút nào... Bạn có thể inbox thẳng cho shop không ạ? Shop cam kết sẽ xử lý và hoàn thiện cho bạn trong thời gian sớm nhất nha! Cảm ơn bạn đã cho shop cơ hội cải thiện 🙏"


@receiver(post_save, sender=ProductReview)
def auto_reply_on_review(sender, instance, created, **kwargs):
    if not created:
        return  

    admin_user = User.objects.filter(is_staff=True).first()
    if not admin_user:
        return

    content = AUTO_REPLIES.get(instance.rating, LOW_RATING_REPLY)

    ReviewReply.objects.create(
        review=instance,
        user=admin_user,
        content=content,
    )