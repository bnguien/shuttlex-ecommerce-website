function FlashSaleDeleteDialog({ isOpen, flashSale, onClose, onConfirm, loading }) {
  if (!isOpen) return null

  return (
    <>
      <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Xóa flash sale</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <p>
                Bạn có chắc muốn xóa flash sale <strong>{flashSale?.name}</strong>?
              </p>
              <p className="text-muted mb-0">
                Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  )
}

export default FlashSaleDeleteDialog
