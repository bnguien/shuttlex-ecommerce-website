import { FiEdit2, FiTrash2 } from "react-icons/fi"

function VouchersTable({ vouchers, loading, onEdit, onDelete }) {
  if (loading && vouchers.length === 0) {
    return <div className="text-center py-5">Đang tải...</div>
  }

  if (vouchers.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">Không có mã giảm giá nào</p>
      </div>
    )
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "-"
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return "-"
    return date.toLocaleDateString("vi-VN")
  }

  const getOptionLabel = (option) => {
    if (!option) return "-"

    if (typeof option === "object") {
      if (option.label) return option.label
      if (option.code) return option.code
      if (option.id) return `#${option.id}`
      return "-"
    }

    if (typeof option === "string") {
      return option.trim() || "-"
    }

    return "-"
  }

  const getStatus = (voucher) => {
    if (!voucher.start_date || !voucher.end_date) {
      return { label: "Thiếu dữ liệu", className: "bg-secondary" }
    }

    const now = new Date()
    const start = new Date(voucher.start_date)
    const end = new Date(voucher.end_date)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { label: "Sai định dạng ngày", className: "bg-secondary" }
    }

    if (!voucher.is_active) {
      return { label: "Đã tắt", className: "bg-secondary" }
    }

    if ((voucher.limit_usage ?? 0) > 0 && (voucher.used_count ?? 0) >= voucher.limit_usage) {
      return { label: "Hết lượt", className: "bg-dark" }
    }

    if (now < start) {
      return { label: "Chưa bắt đầu", className: "bg-info text-dark" }
    }

    if (now > end) {
      return { label: "Đã kết thúc", className: "bg-secondary" }
    }

    return { label: "Hoạt động", className: "bg-success" }
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover mb-0">
        <thead className="table-light">
          <tr>
            <th>Mã giảm giá</th>
            <th>Loại</th>
            <th>Giá trị</th>
            <th>Dùng / Giới hạn</th>
            <th>Hiệu lực</th>
            <th>Trạng thái</th>
            <th style={{ width: "100px" }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {vouchers.map(voucher => {
            const status = getStatus(voucher)

            return (
            <tr key={voucher.id ?? voucher.code}>
              <td className="fw-bold">{voucher.code}</td>
              <td>{getOptionLabel(voucher.voucher_type)}</td>
              <td>{voucher.value} {getOptionLabel(voucher.discount_type)}</td>
              <td>
                <span>{voucher.used_count ?? 0}</span> / {((voucher.limit_usage ?? 0) > 0 ? voucher.limit_usage : "∞")}
              </td>
              <td>
                <small>{formatDate(voucher.start_date)} đến {formatDate(voucher.end_date)}</small>
              </td>
              <td>
                <span className={`badge ${status.className}`}>{status.label}</span>
                {voucher.new_customer_only && (
                  <span className="badge bg-warning text-dark ms-2">Chỉ khách mới</span>
                )}
              </td>
              <td>
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => onEdit(voucher)}
                  title="Chỉnh sửa"
                >
                  <FiEdit2 />
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(voucher)}
                  title="Xóa"
                >
                  <FiTrash2 />
                </button>
              </td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  )
}

export default VouchersTable
