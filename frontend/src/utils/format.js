export const formatCurrencyVND = (value) => {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return "0 ₫";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};
