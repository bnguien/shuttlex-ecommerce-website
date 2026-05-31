import React, { useState, useEffect } from 'react'
import api from '../../api'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../ui/Toast'
import './ProductReviews.css'

function ProductReviews({ product }) {
  const showToast = useToast()
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isStaff = useAuthStore(state => state.isStaff)
  const username = useAuthStore(state => state.username)
  
  const [reviews, setReviews] = useState([])
  const [tags, setTags] = useState([])
  const [eligibility, setEligibility] = useState({ eligible: false, already_reviewed: false, purchased_variant_id: null })
  const [loading, setLoading] = useState(true)
  
  // Filtering & Pagination
  const [selectedFilterTag, setSelectedFilterTag] = useState("Tất cả")
  const [currentPage, setCurrentPage] = useState(1)
  const reviewsPerPage = 5
  
  // Write Review form
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState("")
  const [selectedTags, setSelectedTags] = useState([])
  const [submitting, setSubmitting] = useState(false)
  
  // Staff Reply state
  const [replyText, setReplyText] = useState({})
  const [submittingReply, setSubmittingReply] = useState({})
  const [activeReplyBox, setActiveReplyBox] = useState(null)

  // Fetch reviews & active tags
  const fetchData = async () => {
    if (!product?.id) return
    setLoading(true)
    try {
      const [reviewsRes, tagsRes] = await Promise.all([
        api.get(`api/reviews/?product_id=${product.id}`),
        api.get(`api/reviews/tags/?category_id=${product.category?.id || ''}`)
      ])
      setReviews(reviewsRes.data || [])
      setTags(tagsRes.data || [])
    } catch (err) {
      console.error(err)
      showToast("Không thể tải danh sách đánh giá sản phẩm.", "error")
    } finally {
      setLoading(false)
    }
  }

  // Fetch user eligibility
  const checkUserEligibility = async () => {
    if (!product?.id || !isAuthenticated) {
      setEligibility({ eligible: false, already_reviewed: false, purchased_variant_id: null })
      return
    }
    try {
      const res = await api.get(`api/reviews/eligibility/?product_id=${product.id}`)
      setEligibility(res.data)
    } catch (err) {
      console.error("Eligibility check error:", err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [product?.id])

  useEffect(() => {
    checkUserEligibility()
  }, [product?.id, isAuthenticated])

  // Star select helper
  const handleStarClick = (selectedRating) => {
    setRating(selectedRating)
  }

  // Form Tag toggle
  const handleTagToggle = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId))
    } else {
      setSelectedTags([...selectedTags, tagId])
    }
  }

  // Form Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!product?.id) return
    
    if (!rating || rating < 1 || rating > 5) {
      showToast("Vui lòng chọn số sao từ 1 đến 5.", "error")
      return
    }
    
    if (content.trim().length < 10) {
      showToast("Vui lòng viết cảm nhận chi tiết hơn (tối thiểu 10 ký tự).", "error")
      return
    }
    
    setSubmitting(true)
    try {
      const payload = {
        product: product.id,
        rating,
        content: content.trim(),
        tags: selectedTags,
        variant: eligibility.purchased_variant_id
      }
      
      await api.post('api/reviews/create/', payload)
      showToast("Đăng đánh giá thành công! Cảm ơn phản hồi của bạn.", "success")
      
      // Reset form
      setContent("")
      setSelectedTags([])
      setRating(5)
      
      // Refresh
      fetchData()
      checkUserEligibility()
    } catch (err) {
      const errorMsg = err.response?.data?.non_field_errors?.[0] || 
                       err.response?.data?.detail || 
                       err.response?.data?.content?.[0] || 
                       "Không thể gửi đánh giá. Vui lòng kiểm tra lại."
      showToast(errorMsg, "error")
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle Like / Helpful
  const handleToggleLike = async (reviewId) => {
    if (!isAuthenticated) {
      showToast("Vui lòng đăng nhập để tương tác đánh giá.", "error")
      return
    }
    try {
      const res = await api.post(`api/reviews/${reviewId}/like/`)
      
      // Update state locally
      setReviews(prev => prev.map(rev => {
        if (rev.id === reviewId) {
          return {
            ...rev,
            liked_by_user: res.data.liked,
            likes_count: res.data.likes_count
          }
        }
        return rev
      }))
      
      if (res.data.liked) {
        showToast("Đã ghi nhận đánh giá hữu ích!", "success")
      } else {
        showToast("Đã hủy lượt tương tác hữu ích.", "success")
      }
    } catch (err) {
      showToast("Không thể thực hiện hành động này.", "error")
    }
  }

  // Submit Staff/Admin Reply
  const handleReplySubmit = async (e, reviewId) => {
    e.preventDefault()
    const contentText = replyText[reviewId]?.trim()
    if (!contentText) {
      showToast("Vui lòng nhập nội dung phản hồi.", "error")
      return
    }

    setSubmittingReply(prev => ({ ...prev, [reviewId]: true }))
    try {
      const res = await api.post(`api/reviews/${reviewId}/reply/`, { content: contentText })
      
      // Update review reply list locally
      setReviews(prev => prev.map(rev => {
        if (rev.id === reviewId) {
          return {
            ...rev,
            reply: {
              content: res.data.content,
              created_at: res.data.created_at
            }
          }
        }
        return rev
      }))

      showToast("Gửi phản hồi thành công!", "success")
      setReplyText(prev => ({ ...prev, [reviewId]: "" }))
      setActiveReplyBox(null)
    } catch (err) {
      showToast("Không thể gửi phản hồi. Vui lòng thử lại.", "error")
    } finally {
      setSubmittingReply(prev => ({ ...prev, [reviewId]: false }))
    }
  }

  // Calculations for rating stats
  const totalReviewsCount = reviews.length
  const averageRating = totalReviewsCount > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviewsCount).toFixed(1)
    : 0

  const getRatingCount = (starValue) => {
    return reviews.filter(rev => rev.rating === starValue).length
  }

  const getRatingPercent = (starValue) => {
    if (totalReviewsCount === 0) return 0
    return Math.round((getRatingCount(starValue) / totalReviewsCount) * 100)
  }

  // Tag filter count helper
  const getTagFilterCount = (tagName) => {
    if (tagName === "Tất cả") return totalReviewsCount
    return reviews.filter(rev => rev.tags.some(t => t.name === tagName)).length
  }

  // Filtered reviews
  const filteredReviews = reviews.filter(rev => {
    if (selectedFilterTag === "Tất cả") return true
    return rev.tags.some(t => t.name === selectedFilterTag)
  })

  // Pagination
  const indexOfLastReview = currentPage * reviewsPerPage
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage
  const currentReviews = filteredReviews.slice(indexOfFirstReview, indexOfLastReview)
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage)

  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum)
    // Smooth scroll to reviews header
    document.getElementById("reviews-anchor")?.scrollIntoView({ behavior: 'smooth' })
  }

  // Helper for user avatar initials
  const getInitials = (username) => {
    if (!username) return "?"
    return username.slice(0, 2).toUpperCase()
  }

  // Render stars helper
  const renderStars = (count) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      if (i <= count) {
        stars.push(<i key={i} className="bi bi-star-fill me-1"></i>)
      } else {
        stars.push(<i key={i} className="bi bi-star me-1"></i>)
      }
    }
    return stars
  }

  return (
    <div className="container px-4 px-lg-5 reviews-section" id="reviews-anchor">
      <h3 className="fw-bold mb-4 text-dark border-bottom pb-3">Đánh giá sản phẩm</h3>

      {/* Main Grid: Rating Summary + Write Review */}
      <div className="row g-4">
        {/* Rating Summary Card */}
        <div className="col-lg-5">
          <div className="rating-summary-card h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-baseline gap-3 mb-2">
                <span className="rating-large">{averageRating || "0.0"}</span>
                <span className="fs-5 text-muted">/ 5</span>
              </div>
              
              <div className="rating-stars-gold mb-2">
                {renderStars(Math.round(averageRating))}
              </div>
              
              <div className="total-ratings-text mb-4">
                {totalReviewsCount} đánh giá khách hàng
              </div>

              {/* Progress Bars */}
              <div className="rating-progress-rows">
                {[5, 4, 3, 2, 1].map(star => (
                  <div className="rating-bar-row" key={star}>
                    <span className="rating-bar-label">{star} ★</span>
                    <div className="rating-bar-track">
                      <div 
                        className="rating-bar-fill" 
                        style={{ width: `${getRatingPercent(star)}%` }}
                      ></div>
                    </div>
                    <span className="rating-bar-count">{getRatingCount(star)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter Tags in Summary */}
            {totalReviewsCount > 0 && (
              <div className="filter-tags-container">
                {["Tất cả", ...tags.map(t => t.name)].map((tagName) => {
                  const count = getTagFilterCount(tagName)
                  if (count === 0 && tagName !== "Tất cả") return null
                  
                  return (
                    <button
                      key={tagName}
                      type="button"
                      className={`filter-tag-btn ${selectedFilterTag === tagName ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedFilterTag(tagName)
                        setCurrentPage(1)
                      }}
                    >
                      {tagName} ({count})
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Write Review Form Block */}
        <div className="col-lg-7">
          {isAuthenticated ? (
            eligibility.eligible ? (
              !eligibility.already_reviewed ? (
                <div className="write-review-card h-100">
                  <h4 className="write-review-title">Viết đánh giá của bạn</h4>
                  <form onSubmit={handleSubmitReview}>
                    
                    {/* Star selector */}
                    <div className="mb-3">
                      <span className="form-label-muted d-block">Chọn số sao</span>
                      <div className="star-rating-selector" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i
                            key={star}
                            className={`bi bi-star-fill star-interactive ${
                              (hoverRating || rating) >= star ? 'selected' : ''
                            }`}
                            onClick={() => handleStarClick(star)}
                            onMouseEnter={() => setHoverRating(star)}
                          ></i>
                        ))}
                      </div>
                    </div>

                    {/* Tag selectors */}
                    {tags.length > 0 && (
                      <div className="mb-3">
                        <span className="form-label-muted d-block">Chọn thẻ đặc điểm cảm nhận</span>
                        <div className="tag-select-container">
                          {tags.map((tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              className={`tag-select-pill ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
                              onClick={() => handleTagToggle(tag.id)}
                            >
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Content textarea */}
                    <div className="mb-4">
                      <span className="form-label-muted d-block">Nội dung đánh giá</span>
                      <textarea
                        className="review-textarea"
                        placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm (chất vải, đúng kích thước, giao hàng nhanh...)..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                      ></textarea>
                      <div className="text-end small mt-1 text-muted">
                        Tối thiểu 10 ký tự. Hiện tại: {content.length} ký tự.
                      </div>
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      className="submit-review-btn w-100 py-3 text-uppercase fw-bold"
                      disabled={submitting}
                    >
                      {submitting ? "Đang gửi đánh giá..." : "Gửi đánh giá sản phẩm"}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="write-review-card h-100 d-flex flex-column justify-content-center align-items-center text-center p-5">
                  <div className="fs-1 text-success mb-3">
                    <i className="bi bi-patch-check-fill text-success" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h4 className="fw-bold mb-2">Đã gửi đánh giá</h4>
                  <p className="text-muted small">
                    Bạn đã gửi đánh giá cho sản phẩm này rồi. Cảm ơn sự đóng góp của bạn!
                  </p>
                </div>
              )
            ) : (
              <div className="write-review-card h-100 d-flex flex-column justify-content-center align-items-center text-center p-5">
                <div className="fs-1 text-warning mb-3">
                  <i className="bi bi-lock-fill text-warning" style={{ fontSize: '3rem' }}></i>
                </div>
                <h4 className="fw-bold mb-2 text-warning">Tính năng bị khóa</h4>
                <p className="text-muted small">
                  Chỉ những khách hàng đã mua sản phẩm này thành công mới có quyền viết đánh giá để đảm bảo chất lượng phản hồi trung thực.
                </p>
              </div>
            )
          ) : (
            <div className="write-review-card h-100 d-flex flex-column justify-content-center align-items-center text-center p-5">
              <div className="fs-1 text-muted mb-3">
                <i className="bi bi-box-arrow-in-right" style={{ fontSize: '3rem' }}></i>
              </div>
              <h4 className="fw-bold mb-2 text-light">Yêu cầu đăng nhập</h4>
              <p className="text-muted small mb-4">
                Vui lòng đăng nhập tài khoản của bạn để gửi phản hồi cho sản phẩm này.
              </p>
              <a href="/login" className="btn btn-outline-success px-4 py-2 rounded-pill fw-bold text-success border-success">
                Đăng nhập ngay
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <h4 className="fw-bold mt-5 mb-3" id="reviews-list-start">
        Đánh giá của khách hàng ({filteredReviews.length})
      </h4>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="reviews-empty-state">
          <div className="empty-state-icon">
            <i className="bi bi-chat-left-text" style={{ fontSize: '2.5rem' }}></i>
          </div>
          <h5 className="empty-state-title">Chưa có đánh giá nào</h5>
          <p className="empty-state-desc">
            Sản phẩm này hiện chưa có lượt phản hồi nào từ người mua.
          </p>
        </div>
      ) : (
        <div className="reviews-list-container">
          {currentReviews.map((review) => (
            <div className="review-user-card" key={review.id}>
              {/* User Meta Row */}
              <div className="d-flex align-items-start justify-content-between mb-3 flex-wrap gap-2">
                <div className="d-flex align-items-center gap-3">
                  <div className="user-avatar-circle">
                    {getInitials(review.user)}
                  </div>
                  <div>
                    <h5 className="reviewer-name m-0">{review.user}</h5>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <span className="verified-purchase-badge">
                        <i className="bi bi-check-circle-fill"></i> Đã mua hàng
                      </span>
                      <span className="review-date">
                        • {new Date(review.created_at).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="review-stars-container text-end">
                  {renderStars(review.rating)}
                </div>
              </div>

              {/* Variant info */}
              {review.variant_info && (
                <div className="review-variant-text">
                  Phân loại: <span className="text-light">{review.variant_info}</span>
                </div>
              )}

              {/* Tag capsules */}
              {review.tags?.length > 0 && (
                <div className="review-tags-capsules">
                  {review.tags.map(tag => (
                    <span className="review-tag-capsule" key={tag.id}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Content body */}
              <p className="review-body-text">{review.content}</p>

              {/* Admin reply bubble */}
              {review.reply ? (
                <div className="admin-reply-box">
                  <div className="admin-reply-header">
                    <div className="admin-reply-title">
                      <i className="bi bi-patch-check-fill"></i> ShuttleX Phản hồi từ cửa hàng
                    </div>
                    <span className="admin-reply-date">
                      {new Date(review.reply.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <p className="admin-reply-body m-0">{review.reply.content}</p>
                </div>
              ) : (
                isStaff && !activeReplyBox && (
                  <div className="mt-2 bg-dark p-3 rounded border border-secondary">
                    <span className="no-reply-text d-block mb-2 text-danger">⚠️ Chưa có phản hồi từ cửa hàng</span>
                    <button
                      className="reply-badge-btn"
                      onClick={() => setActiveReplyBox(review.id)}
                    >
                      <i className="bi bi-chat-dots-fill"></i> Phản hồi ngay
                    </button>
                  </div>
                )
              )}

              {/* Reply composer for Admin/Staff */}
              {isStaff && activeReplyBox === review.id && (
                <div className="staff-reply-composer">
                  <form onSubmit={(e) => handleReplySubmit(e, review.id)}>
                    <textarea
                      className="staff-reply-textarea"
                      placeholder="Nhập nội dung phản hồi chính thức từ ShuttleX..."
                      rows="3"
                      value={replyText[review.id] || ""}
                      onChange={(e) => setReplyText({
                        ...replyText,
                        [review.id]: e.target.value
                      })}
                      required
                    ></textarea>
                    <div className="d-flex justify-content-end gap-2 mt-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary text-white"
                        onClick={() => setActiveReplyBox(null)}
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="submit"
                        className="staff-reply-btn"
                        disabled={submittingReply[review.id]}
                      >
                        {submittingReply[review.id] ? "Đang gửi..." : "Gửi phản hồi"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Review Actions: Helpful Button */}
              <div className="review-actions mt-3">
                <button
                  type="button"
                  className={`helpful-interaction-btn ${review.liked_by_user ? 'liked' : ''}`}
                  onClick={() => handleToggleLike(review.id)}
                >
                  <i className="bi bi-hand-thumbs-up-fill"></i> Hữu ích ({review.likes_count ?? 0})
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="reviews-pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              className={`pagination-item-btn ${currentPage === pageNum ? 'active' : ''}`}
              onClick={() => handlePageChange(pageNum)}
            >
              {pageNum}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductReviews
