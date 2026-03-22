function SizesTable({ sizes, onEdit, onDelete, sizeTypes }) {
  if (!sizes || sizes.length === 0) {
    return <div className="text-muted">Không tìm thấy kích cỡ.</div>
  }

  const typeMap = sizeTypes.reduce((acc, type) => {
    acc[type.value] = type.label
    return acc
  }, {})

  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Loại</th>
            <th className="text-end">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {sizes.map((size) => (
            <tr key={size.id}>
              <td>{size.name}</td>
              <td>{typeMap[size.type] || size.type}</td>
              <td className="text-end">
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => onEdit(size)}
                >
                  Sửa
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(size)}
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

export default SizesTable
