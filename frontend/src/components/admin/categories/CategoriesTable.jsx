function CategoriesTable({ categories, onEdit, onDelete }) {
  if (!categories || categories.length === 0) {
    return <div className="text-muted">Không tìm thấy danh mục.</div>
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
          {categories.map((category) => (
            <tr key={category.id}>
              <td>{category.name}</td>
              <td>{category.slug}</td>
              <td>{category.is_active ? "Đang hoạt động" : "Tạm khóa"}</td>
              <td className="text-end">
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => onEdit(category)}
                >
                  Sửa
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(category)}
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

export default CategoriesTable
