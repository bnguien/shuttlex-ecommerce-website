import { useEffect, useState } from "react"
import { fetchPromotionOptions } from "../../../utils/promotionApi"

function VoucherModal({ isOpen, voucher, onClose, onSave, loading }) {
  const [formData, setFormData] = useState({
    voucher_type: null,
    discount_type: null,
    value: "",
    max_discount_amount: "",
    min_order_value: 0,
    limit_usage: 100,
    unlimited_usage: false,
    start_date: "",
    end_date: "",
    is_active: true,
    new_customer_only: false,
    description: "",
  })

  const [voucherTypes, setVoucherTypes] = useState([])
  const [discountTypes, setDiscountTypes] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadOptions()
    }
  }, [isOpen])

  const loadOptions = async () => {
    setLoadingOptions(true)
    const { voucherTypes, discountTypes } = await fetchPromotionOptions()
    setVoucherTypes(voucherTypes)
    setDiscountTypes(discountTypes)
    setLoadingOptions(false)
  }

  useEffect(() => {
    if (voucher && voucherTypes.length > 0 && discountTypes.length > 0) {
      const voucherTypeValue = typeof voucher.voucher_type === "object" 
        ? voucher.voucher_type.id 
        : voucherTypes.find(t => t.code === voucher.voucher_type)?.id || null

      const discountTypeValue = typeof voucher.discount_type === "object"
        ? voucher.discount_type.id
        : discountTypes.find(d => d.code === voucher.discount_type)?.id || null

      setFormData({
        voucher_type: voucherTypeValue,
        discount_type: discountTypeValue,
        value: voucher.value || "",
        max_discount_amount: voucher.max_discount_amount || "",
        min_order_value: voucher.min_order_value || 0,
        limit_usage: (voucher.limit_usage ?? 0) > 0 ? voucher.limit_usage : "",
        unlimited_usage: voucher.limit_usage == null || Number(voucher.limit_usage) <= 0,
        start_date: (voucher.start_date || "").split("T")[0],
        end_date: (voucher.end_date || "").split("T")[0],
        is_active: voucher.is_active !== false,
        new_customer_only: voucher.new_customer_only === true,
        description: voucher.description || "",
      })
    } else if (!voucher && voucherTypes.length > 0 && discountTypes.length > 0) {
      const today = new Date()
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)

      const defaultVoucherTypeId = voucherTypes.find(t => t.code === "PRODUCT")?.id || null
      const defaultDiscountTypeId = discountTypes.find(d => d.code === "PERCENTAGE")?.id || null
      
      setFormData({
        voucher_type: defaultVoucherTypeId,
        discount_type: defaultDiscountTypeId,
        value: "",
        max_discount_amount: "",
        min_order_value: 0,
        limit_usage: 100,
        unlimited_usage: false,
        start_date: today.toISOString().split("T")[0],
        end_date: nextMonth.toISOString().split("T")[0],
        is_active: true,
        new_customer_only: false,
        description: "",
      })
    }
  }, [voucher, voucherTypes, discountTypes])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name === "unlimited_usage") {
      setFormData(prev => ({
        ...prev,
        unlimited_usage: checked,
        limit_usage: checked ? "" : (prev.limit_usage || 100),
      }))
      return
    }

    if (name === "discount_type") {
      setFormData(prev => ({
        ...prev,
        discount_type: value ? parseInt(value) : null,
        max_discount_amount: discountTypes.find(d => d.id === parseInt(value))?.code === "FIXED" ? "" : prev.max_discount_amount,
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : (name === "voucher_type" ? (value ? parseInt(value) : null) : value)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.voucher_type) {
      alert("Vui lòng chọn loại mã giảm giá")
      return
    }
    if (!formData.discount_type) {
      alert("Vui lòng chọn kiểu giảm giá")
      return
    }
    if (!formData.value) {
      alert("Vui lòng nhập giá trị giảm giá")
      return
    }
    if (!formData.start_date || !formData.end_date) {
      alert("Vui lòng chọn ngày bắt đầu và kết thúc")
      return
    }

    if (!formData.unlimited_usage) {
      const limitUsage = Number(formData.limit_usage)
      if (!Number.isInteger(limitUsage) || limitUsage < 1) {
        alert("Giới hạn lần dùng phải là số nguyên lớn hơn hoặc bằng 1")
        return
      }
    }

    const payload = { ...formData }

    if (payload.unlimited_usage) {
      payload.limit_usage = null
    } else {
      payload.limit_usage = Number(payload.limit_usage)
    }
    delete payload.unlimited_usage

    const discountTypeObj = discountTypes.find(d => d.id === payload.discount_type)
    if (discountTypeObj?.code === "FIXED") {
      delete payload.max_discount_amount
    }

    onSave(payload)
  }

  if (!isOpen) return null

  const currentDiscountType = discountTypes.find(d => d.id === formData.discount_type)
  const isFixedDiscount = currentDiscountType?.code === "FIXED"

  const hasValidLimit = formData.unlimited_usage || (Number.isInteger(Number(formData.limit_usage)) && Number(formData.limit_usage) >= 1)
  const isFormValid = formData.voucher_type && formData.discount_type && formData.value && formData.start_date && formData.end_date && hasValidLimit && !loadingOptions

  return (
    <>
      <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {voucher ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="voucher_type" className="form-label">Loại mã giảm giá <span className="text-danger">*</span></label>
                      <select
                        id="voucher_type"
                        name="voucher_type"
                        className="form-select"
                        value={formData.voucher_type || ""}
                        onChange={handleChange}
                        disabled={loadingOptions}
                        required
                      >
                        <option value="">-- Chọn loại mã --</option>
                        {voucherTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="discount_type" className="form-label">Kiểu giảm giá <span className="text-danger">*</span></label>
                      <select
                        id="discount_type"
                        name="discount_type"
                        className="form-select"
                        value={formData.discount_type || ""}
                        onChange={handleChange}
                        disabled={loadingOptions}
                        required
                      >
                        <option value="">-- Chọn loại giảm giá --</option>
                        {discountTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="value" className="form-label">
                        Giá trị giảm giá <span className="text-danger">*</span> {currentDiscountType?.label ? `(${currentDiscountType.label})` : ""}
                      </label>
                      <input
                        type="number"
                        id="value"
                        name="value"
                        className="form-control"
                        value={formData.value}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="max_discount_amount" className="form-label">
                        Giảm tối đa (đ) {isFixedDiscount && "(không dùng)"}
                      </label>
                      <input
                        type="number"
                        id="max_discount_amount"
                        name="max_discount_amount"
                        className="form-control"
                        value={formData.max_discount_amount}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        disabled={isFixedDiscount}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-2">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          id="unlimited_usage"
                          name="unlimited_usage"
                          className="form-check-input"
                          checked={formData.unlimited_usage}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="unlimited_usage">
                          Không giới hạn lượt dùng
                        </label>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="min_order_value" className="form-label">Giá trị đơn tối thiểu (đ)</label>
                      <input
                        type="number"
                        id="min_order_value"
                        name="min_order_value"
                        className="form-control"
                        value={formData.min_order_value}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="limit_usage" className="form-label">Giới hạn lần dùng</label>
                      <input
                        type="number"
                        id="limit_usage"
                        name="limit_usage"
                        className="form-control"
                        value={formData.limit_usage}
                        onChange={handleChange}
                        min="1"
                        disabled={formData.unlimited_usage}
                        required={!formData.unlimited_usage}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="start_date" className="form-label">Ngày bắt đầu</label>
                      <input
                        type="date"
                        id="start_date"
                        name="start_date"
                        className="form-control"
                        value={formData.start_date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="end_date" className="form-label">Ngày kết thúc</label>
                      <input
                        type="date"
                        id="end_date"
                        name="end_date"
                        className="form-control"
                        value={formData.end_date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Mô tả</label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    className="form-control"
                    value={formData.description}
                    onChange={handleChange}
                    maxLength={255}
                    placeholder="Nhập mô tả cho mã giảm giá (hiển thị cho khách hàng)"
                  />
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      className="form-check-input"
                      checked={formData.is_active}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="is_active">
                      Kích hoạt mã giảm giá
                    </label>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="new_customer_only"
                      name="new_customer_only"
                      className="form-check-input"
                      checked={formData.new_customer_only}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="new_customer_only">
                      Chỉ áp dụng cho khách hàng mới (đơn đầu tiên)
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading || !isFormValid} title={!isFormValid ? "Vui lòng điền đầy đủ các trường bắt buộc" : ""}>
                  {loading ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  )
}

export default VoucherModal
