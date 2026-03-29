import { useEffect, useState } from "react"
import { FiEdit2, FiTrash2 } from "react-icons/fi"

function FlashSalesTable({ flashSales, loading, onEdit, onDelete }) {
  const [nowMs, setNowMs] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (loading && flashSales.length === 0) {
    return <div className="text-center py-5">Đang tải...</div>
  }

  if (flashSales.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">Không có flash sale nào</p>
      </div>
    )
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatus = (flashSale) => {
    const now = new Date(nowMs)
    const start = new Date(flashSale.start_time)
    const end = new Date(flashSale.end_time)
    const isActive = flashSale.is_active !== false

    if (!isActive) {
      return { label: "Vô hiệu", className: "bg-danger" }
    }

    if (start > now) {
      return { label: "Chưa bắt đầu", className: "bg-info" }
    }

    if (end < now) {
      return { label: "Đã kết thúc", className: "bg-secondary" }
    }

    return { label: "Đang diễn ra", className: "bg-success" }
  }

  const getProductCount = (flashSale) => {
    return flashSale.items?.length || flashSale.flashsaleitem_set?.length || flashSale.products?.length || 0
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover mb-0">
        <thead className="table-light">
          <tr>
            <th>Tên flash sale</th>
            <th>Giảm giá</th>
            <th>Sản phẩm</th>
            <th>Thời gian</th>
            <th>Trạng thái</th>
            <th style={{ width: "150px" }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {flashSales.map(flashSale => {
            const status = getStatus(flashSale)

            return (
            <tr key={flashSale.id}>
              <td className="fw-bold">{flashSale.name}</td>
              <td>
                <span className="badge bg-warning text-dark">{flashSale.discount_percent}%</span>
              </td>
              <td>{getProductCount(flashSale)} sản phẩm</td>
              <td>
                <small className="text-nowrap">
                  {formatDateTime(flashSale.start_time)} {" -> "} {formatDateTime(flashSale.end_time)}
                </small>
              </td>
              <td>
                <span className={`badge ${status.className}`}>{status.label}</span>
              </td>
              <td>
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => onEdit(flashSale)}
                  title="Chỉnh sửa"
                >
                  <FiEdit2 />
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(flashSale)}
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

export default FlashSalesTable
