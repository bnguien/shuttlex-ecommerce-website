import { useEffect, useState } from "react"
import api, { BASE_URL } from "../../../api"
import { FiCheck, FiMessageSquare, FiTrash2, FiUser, FiCalendar, FiBox, FiStar } from "react-icons/fi"

function AdminReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("all") // 'all', 'unapproved', 'approved'
  const [replyingToId, setReplyingToId] = useState(null)
  const [replyContent, setReplyContent] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const fetchReviews = async () => {
    setLoading(true)
    setError("")
    try {
      let url = "api/reviews/admin-list/"
      if (filter === "approved") {
        url += "?is_approved=true"
      } else if (filter === "unapproved") {
        url += "?is_approved=false"
      }
      const response = await api.get(url)
      setReviews(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error(err)
      setError("Không thể tải danh sách đánh giá của khách hàng.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [filter])

  const handleApprove = async (reviewId) => {
    setActionLoading(true)
    try {
      await api.post(`api/reviews/${reviewId}/approve/`)
      // Update local state
      setReviews(prev =>
        prev.map(r => (r.id === reviewId ? { ...r, is_approved: true } : r))
      )
    } catch (err) {
      console.error(err)
      alert("Duyệt đánh giá thất bại. Vui lòng thử lại.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này?")) {
      return
    }
    setActionLoading(true)
    try {
      await api.delete(`api/reviews/${reviewId}/delete/`)
      // Remove from local state
      setReviews(prev => prev.filter(r => r.id !== reviewId))
    } catch (err) {
      console.error(err)
      alert("Xóa đánh giá thất bại. Vui lòng thử lại.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleReplySubmit = async (reviewId) => {
    if (!replyContent.trim()) {
      alert("Vui lòng nhập nội dung phản hồi.")
      return
    }
    setActionLoading(true)
    try {
      const res = await api.post(`api/reviews/${reviewId}/reply/`, {
        content: replyContent.trim()
      })
      // Update local state with the new/updated reply
      setReviews(prev =>
        prev.map(r =>
          r.id === reviewId
            ? {
                ...r,
                reply: {
                  content: res.data.content,
                  created_at: res.data.created_at
                }
              }
            : r
        )
      )
      setReplyingToId(null)
      setReplyContent("")
    } catch (err) {
      console.error(err)
      alert("Gửi phản hồi thất bại. Vui lòng thử lại.")
    } finally {
      setActionLoading(false)
    }
  }

  const startReply = (review) => {
    setReplyingToId(review.id)
    setReplyContent(review.reply ? review.reply.content : "")
  }

  const renderStars = (rating) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FiStar
          key={i}
          className="me-1"
          style={{
            fill: i <= rating ? "#ffc107" : "none",
            color: i <= rating ? "#ffc107" : "#dee2e6"
          }}
        />
      )
    }
    return stars
  }

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-semibold mb-1">Quản lý Đánh giá</h2>
          <p className="text-muted mb-0 small">
            Tiếp nhận, phê duyệt đánh giá và phản hồi thắc mắc của khách hàng mua hàng.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body p-3">
          <div className="d-flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`btn btn-sm px-4 rounded-pill ${
                filter === "all" ? "btn-primary" : "btn-light text-secondary"
              }`}
            >
              Tất cả ({reviews.length})
            </button>
            <button
              onClick={() => setFilter("unapproved")}
              className={`btn btn-sm px-4 rounded-pill ${
                filter === "unapproved" ? "btn-warning text-dark" : "btn-light text-secondary"
              }`}
            >
              Chờ phê duyệt ({reviews.filter(r => !r.is_approved).length})
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`btn btn-sm px-4 rounded-pill ${
                filter === "approved" ? "btn-success" : "btn-light text-secondary"
              }`}
            >
              Đã phê duyệt ({reviews.filter(r => r.is_approved).length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="text-muted mt-2">Đang tải danh sách đánh giá...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger shadow-sm" role="alert">
          {error}
        </div>
      ) : reviews.length === 0 ? (
        <div className="card text-center py-5 border-0 shadow-sm">
          <div className="card-body">
            <h5 className="text-muted mb-2">Không tìm thấy đánh giá nào</h5>
            <p className="text-muted small">
              Không có sản phẩm nào thuộc bộ lọc này hoặc chưa có đánh giá nào từ người dùng.
            </p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {reviews.map(review => (
            <div key={review.id} className="col-12">
              <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden">
                {/* Visual Accent Pill for Status */}
                <div
                  className="position-absolute"
                  style={{
                    top: "16px",
                    right: "16px",
                    zIndex: 2
                  }}
                >
                  {review.is_approved ? (
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill small">
                      ● Đã phê duyệt
                    </span>
                  ) : (
                    <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2 rounded-pill small">
                      ● Chờ phê duyệt
                    </span>
                  )}
                </div>

                <div className="card-body p-4">
                  <div className="row align-items-start g-3">
                    {/* Column 1: Product info */}
                    <div className="col-md-3 border-end">
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={`${BASE_URL}${review.product_image}`}
                          alt={review.product_name}
                          className="rounded border shadow-sm"
                          style={{
                            width: "64px",
                            height: "64px",
                            objectFit: "cover"
                          }}
                        />
                        <div>
                          <h6 className="fw-bold mb-1 text-dark text-truncate" style={{ maxWidth: "160px" }}>
                            {review.product_name}
                          </h6>
                          <div className="text-muted small d-flex align-items-center gap-1">
                            <FiBox size={13} />
                            <span>
                              {review.variant_info ? `Mẫu: ${review.variant_info}` : "Bản tiêu chuẩn"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: User content */}
                    <div className="col-md-6">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="d-flex align-items-center justify-content-center bg-secondary-subtle rounded-circle" style={{ width: "32px", height: "32px" }}>
                          <FiUser className="text-secondary" />
                        </div>
                        <div>
                          <strong className="text-dark d-block leading-none">@{review.user}</strong>
                          <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                            <FiCalendar size={11} />
                            {new Date(review.created_at).toLocaleDateString("vi-VN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="mb-2">{renderStars(review.rating)}</div>

                      {/* Tags */}
                      {review.tags && review.tags.length > 0 && (
                        <div className="mb-3 d-flex flex-wrap gap-1">
                          {review.tags.map(tag => (
                            <span key={tag.id} className="badge bg-secondary-subtle text-secondary rounded-sm px-2 py-1 small">
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Content */}
                      <p className="text-dark bg-light p-3 rounded border mb-3" style={{ fontSize: "0.95rem", lineHeight: "1.5" }}>
                        {review.content}
                      </p>

                      {/* Existing Admin Reply */}
                      {review.reply && (
                        <div className="bg-primary-subtle border-start border-primary border-4 p-3 rounded mb-3">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="fw-bold text-primary small d-flex align-items-center gap-1">
                              <FiMessageSquare size={13} /> Phản hồi từ Quản trị viên
                            </span>
                            <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                              {new Date(review.reply.created_at).toLocaleDateString("vi-VN", {
                                day: "numeric",
                                month: "numeric",
                                year: "numeric"
                              })}
                            </span>
                          </div>
                          <p className="text-dark mb-0 small" style={{ lineHeight: "1.4" }}>
                            {review.reply.content}
                          </p>
                        </div>
                      )}

                      {/* Inline Reply TextArea */}
                      {replyingToId === review.id && (
                        <div className="mt-3 border p-3 rounded bg-white shadow-sm">
                          <label className="form-label fw-bold text-dark small">
                            {review.reply ? "Chỉnh sửa phản hồi:" : "Nhập phản hồi mới:"}
                          </label>
                          <textarea
                            className="form-control mb-2"
                            rows="3"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Cảm ơn khách hàng đã đánh giá và phản hồi thắc mắc..."
                          ></textarea>
                          <div className="d-flex gap-2 justify-content-end">
                            <button
                              className="btn btn-sm btn-light border"
                              onClick={() => {
                                setReplyingToId(null)
                                setReplyContent("")
                              }}
                              disabled={actionLoading}
                            >
                              Hủy
                            </button>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleReplySubmit(review.id)}
                              disabled={actionLoading}
                            >
                              Gửi phản hồi
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Column 3: Actions */}
                    <div className="col-md-3 text-end d-flex flex-column gap-2 justify-content-center align-items-end h-100">
                      {!review.is_approved && (
                        <button
                          className="btn btn-sm btn-success d-flex align-items-center gap-1 justify-content-center w-75"
                          onClick={() => handleApprove(review.id)}
                          disabled={actionLoading}
                        >
                          <FiCheck size={14} /> Duyệt ngay
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 justify-content-center w-75"
                        onClick={() => startReply(review)}
                        disabled={actionLoading}
                      >
                        <FiMessageSquare size={14} /> {review.reply ? "Sửa phản hồi" : "Phản hồi"}
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 justify-content-center w-75"
                        onClick={() => handleDelete(review.id)}
                        disabled={actionLoading}
                      >
                        <FiTrash2 size={14} /> Xóa đánh giá
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminReviewsPage
