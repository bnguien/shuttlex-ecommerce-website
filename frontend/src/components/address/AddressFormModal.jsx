import { useState, useEffect, useMemo } from "react";
import api from "../../api";
import { useToast } from "../ui/Toast";
import MapSelector from "./MapSelector";
import PROVINCES from "../../data/provinces";
import "./AddressFormModal.css";

const PHONE_REGEX = /^0[35789]\d{8}$/;

function validatePhone(value) {
  if (!value) return "Số điện thoại là bắt buộc.";
  if (!/^\d+$/.test(value)) return "Số điện thoại chỉ được chứa chữ số.";
  if (value.length < 10) return "Số điện thoại chưa đủ 10 số.";
  if (!PHONE_REGEX.test(value))
    return "Số điện thoại không hợp lệ (phải bắt đầu bằng 03, 05, 07, 08 hoặc 09).";
  return "";
}

function RequiredLabel({ children }) {
  return (
    <label className="form-label">
      {children}{" "}
      <span style={{ color: "#dc3545", fontWeight: 500 }}>*</span>
    </label>
  );
}

function AddressFormModal({ isOpen, onClose, onSaved, editAddress }) {
  const showToast = useToast();

  const [form, setForm] = useState({
    receiver_name: "",
    phone: "",
    province: "",
    ward: "",
    street_detail: "",        
    full_address: "",         
    latitude: null,
    longtitude: null,
    is_default: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editAddress) {
      setForm({
        ...editAddress,
        street_detail: editAddress.street_detail || "",
        full_address: "",
      });
    } else {
      setForm({
        receiver_name: "",
        phone: "",
        province: "",
        ward: "",
        street_detail: "",
        full_address: "",
        latitude: null,
        longtitude: null,
        is_default: false,
      });
    }
    setErrors({});
    setTouched({});
  }, [editAddress, isOpen]);

  const selectedProvince = useMemo(
    () => PROVINCES.find((p) => p.name === form.province),
    [form.province]
  );
  const wardList = selectedProvince?.wards || [];

  const selectedWard = useMemo(
    () => wardList.find((w) => w.name === form.ward),
    [form.ward, wardList]
  );
  const flyToCoords = selectedWard
    ? [selectedWard.lat, selectedWard.lng]
    : null;

  const defaultCenter = [16.069411, 108.149258];
  const markerPos =
    form.latitude && form.longtitude
      ? [form.latitude, form.longtitude]
      : flyToCoords || defaultCenter;

  useEffect(() => {
    const parts = [
      form.street_detail?.trim(),
      form.ward?.trim(),
      form.province?.trim(),
    ].filter(Boolean);

    setForm((prev) => ({
      ...prev,
      full_address: parts.join(", "),
    }));
  }, [form.street_detail, form.ward, form.province]);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "province" && {
        ward: "",
        latitude: null,
        longtitude: null,
      }),
      ...(field === "ward" && {
        latitude: null,
        longtitude: null,
      }),
    }));

    if (field === "phone") {
      setErrors((prev) => ({ ...prev, phone: validatePhone(value) }));
    }

    if (["receiver_name", "province", "ward"].includes(field) && value) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (field === "phone") {
      setErrors((prev) => ({ ...prev, phone: validatePhone(form.phone) }));
    }
    if (field === "receiver_name" && !form.receiver_name.trim()) {
      setErrors((prev) => ({
        ...prev,
        receiver_name: "Họ tên là bắt buộc.",
      }));
    }
  };

  const handleMapChange = (lat, lng) => {
    setForm((prev) => ({ ...prev, latitude: lat, longtitude: lng }));
  };

  const validateAll = () => {
    const newErrors = {};
    if (!form.receiver_name.trim())
      newErrors.receiver_name = "Họ tên là bắt buộc.";
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) newErrors.phone = phoneErr;
    if (!form.province) newErrors.province = "Vui lòng chọn tỉnh/thành.";
    if (!form.ward) newErrors.ward = "Vui lòng chọn phường/xã.";

    setErrors(newErrors);
    setTouched({
      receiver_name: true,
      phone: true,
      province: true,
      ward: true,
    });
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateAll()) {
      showToast("Vui lòng kiểm tra lại thông tin.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        receiver_name: form.receiver_name,
        phone: form.phone,
        province: form.province,
        ward: form.ward,
        street_detail: form.street_detail, 
        latitude: form.latitude,
        longtitude: form.longtitude,
        is_default: form.is_default,
      };

      if (editAddress) {
        await api.put(`addresses/${editAddress.id}/`, payload);
      } else {
        await api.post("addresses/", payload);
      }
      showToast("Lưu địa chỉ thành công!", "success");
      onSaved();
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.phone?.[0] ||
        err.response?.data?.non_field_errors?.[0] ||
        "Lỗi khi lưu.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="address-modal-overlay" onClick={onClose}>
      <div
        className="address-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="address-modal-header">
          <h4>{editAddress ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}</h4>
          <button className="address-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="address-modal-body">
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <RequiredLabel>Họ tên người nhận</RequiredLabel>
              <input
                className={`form-control ${
                  touched.receiver_name && errors.receiver_name
                    ? "is-invalid"
                    : touched.receiver_name && !errors.receiver_name
                    ? "is-valid"
                    : ""
                }`}
                value={form.receiver_name}
                onChange={(e) => handleChange("receiver_name", e.target.value)}
                onBlur={() => handleBlur("receiver_name")}
                placeholder="Nguyễn Văn A"
              />
              {touched.receiver_name && errors.receiver_name && (
                <div className="invalid-feedback">{errors.receiver_name}</div>
              )}
            </div>

            <div className="col-md-6">
              <RequiredLabel>Số điện thoại</RequiredLabel>
              <input
                className={`form-control ${
                  touched.phone && errors.phone
                    ? "is-invalid"
                    : touched.phone && !errors.phone
                    ? "is-valid"
                    : ""
                }`}
                value={form.phone}
                onChange={(e) => {
                  // Chỉ cho nhập số
                  const val = e.target.value.replace(/\D/g, "");
                  handleChange("phone", val);
                  setTouched((prev) => ({ ...prev, phone: true }));
                }}
                onBlur={() => handleBlur("phone")}
                maxLength={10}
                placeholder="0901234567"
                inputMode="numeric"
              />
              {touched.phone && errors.phone && (
                <div className="invalid-feedback">{errors.phone}</div>
              )}
              {!errors.phone && !form.phone && (
                <div className="form-text text-muted" style={{ fontSize: 12 }}>
                </div>
              )}
            </div>
          </div>

          <div className="mb-3">
            <RequiredLabel>Tỉnh / Thành phố</RequiredLabel>
            <select
              className={`form-select ${
                touched.province && errors.province ? "is-invalid" : ""
              }`}
              value={form.province}
              onChange={(e) => {
                handleChange("province", e.target.value);
                setTouched((prev) => ({ ...prev, province: true }));
              }}
            >
              <option value="">-- Chọn tỉnh/thành --</option>
              {PROVINCES.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
            {touched.province && errors.province && (
              <div className="invalid-feedback">{errors.province}</div>
            )}
          </div>

          <div className="mb-3">
            <RequiredLabel>Phường / Xã</RequiredLabel>
            <select
              className={`form-select ${
                touched.ward && errors.ward ? "is-invalid" : ""
              }`}
              value={form.ward}
              onChange={(e) => {
                handleChange("ward", e.target.value);
                setTouched((prev) => ({ ...prev, ward: true }));
              }}
              disabled={!form.province}
            >
              <option value="">-- Chọn phường/xã --</option>
              {wardList.map((w) => (
                <option key={w.name} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
            {touched.ward && errors.ward && (
              <div className="invalid-feedback">{errors.ward}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Số nhà, Tên đường</label>
            <input
              className="form-control"
              value={form.street_detail}
              onChange={(e) => handleChange("street_detail", e.target.value)}
              placeholder="VD: 123 kiệt 5, tầng 2, Nguyễn Văn Linh"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              Địa chỉ đầy đủ{" "}
              <span style={{ color: "#2f6f2e", fontSize: 12 }}>
                (tự động ghép)
              </span>
            </label>
            <input
              className="form-control"
              value={form.full_address}
              readOnly
              style={{
                background: "var(--bs-secondary-bg, #f8f9fa)",
                color: "#555",
                fontSize: 13,
              }}
              placeholder="Sẽ tự động điền sau khi chọn tỉnh và phường"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">📍 Ghim vị trí trên bản đồ</label>
            <MapSelector
              center={defaultCenter}
              markerPos={markerPos}
              onChange={handleMapChange}
              flyTo={markerPos}
            />
            {form.latitude && (
              <small className="text-muted mt-1 d-block">
                Tọa độ: {form.latitude.toFixed(5)},{" "}
                {form.longtitude?.toFixed(5)}
              </small>
            )}
          </div>

          <div className="form-check mb-4">
            <input
              type="checkbox"
              className="form-check-input"
              id="isDefaultCheck"
              checked={form.is_default}
              onChange={(e) => handleChange("is_default", e.target.checked)}
            />
            <label className="form-check-label" htmlFor="isDefaultCheck">
              Đặt làm địa chỉ mặc định
            </label>
          </div>
        </div>

        <div className="address-modal-footer d-flex gap-2 justify-content-end">
          <button className="btn btn-outline-secondary" onClick={onClose}>
            Hủy
          </button>
          <button
            className="btn btn-success"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                />
                Đang lưu...
              </>
            ) : (
              "Lưu địa chỉ"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddressFormModal;