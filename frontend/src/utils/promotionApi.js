import api from "../api";

/**
 * Fetch all available voucher type options
 * @returns {Promise<Array>} List of voucher types with id, code, label
 */
export const fetchVoucherTypeOptions = async () => {
  try {
    const response = await api.get("/voucher-types/");
    return response.data || [];
  } catch (error) {
    console.error("Error fetching voucher types:", error);
    return [];
  }
};

/**
 * Fetch all available discount type options
 * @returns {Promise<Array>} 
 */
export const fetchDiscountTypeOptions = async () => {
  try {
    const response = await api.get("/discount-types/");
    return response.data || [];
  } catch (error) {
    console.error("Error fetching discount types:", error);
    return [];
  }
};

/**
 * Fetch both voucher and discount type options in parallel
 * @returns {Promise<Object>} Object with voucherTypes and discountTypes arrays
 */
export const fetchPromotionOptions = async () => {
  try {
    const [voucherTypesResponse, discountTypesResponse] = await Promise.all([
      api.get("/voucher-types/"),
      api.get("/discount-types/"),
    ]);

    return {
      voucherTypes: voucherTypesResponse.data || [],
      discountTypes: discountTypesResponse.data || [],
    };
  } catch (error) {
    console.error("Error fetching promotion options:", error);
    return {
      voucherTypes: [],
      discountTypes: [],
    };
  }
};
