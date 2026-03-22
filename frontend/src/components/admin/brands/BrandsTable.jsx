function BrandsTable({ brands, onEdit, onDelete }) {
  if (!brands || brands.length === 0) {
    return <div className="text-muted">Không tìm thấy thương hiệu.</div>
  }

  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Slug</th>
            <th>Trạng thái</th>
            <th className="text-end">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {brands.map((brand) => (
            <tr key={brand.id}>
              <td>{brand.name}</td>
              <td>{brand.slug}</td>
              <td>{brand.is_active ? "Đang hoạt động" : "Tạm khóa"}</td>
              <td className="text-end">
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => onEdit(brand)}
                >
                  Sửa
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(brand)}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default BrandsTable
