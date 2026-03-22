function BrandDeleteDialog({ open, brand, onCancel, onConfirm }) {
  if (!open) return null

  return (
    <div className="modal d-block" tabIndex="-1" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Xóa thương hiệu</h5>
            <button type="button" className="btn-close" onClick={onCancel} />
          </div>
          <div className="modal-body">
            <p className="mb-0">
              Bạn có chắc muốn xóa <strong>{brand?.name || "thương hiệu này"}</strong>?
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onCancel}>Hủy</button>
            <button className="btn btn-danger" onClick={onConfirm}>Xóa</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BrandDeleteDialog
