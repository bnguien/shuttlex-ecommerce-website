function ProductsTable({ products, onEdit, onDelete }) {
  if (!products || products.length === 0) {
    return <div className="text-muted">No products found.</div>
  }
  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Brand</th>
            <th>Price</th>
            <th>Status</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.category?.name || "-"}</td>
              <td>{product.brand?.name || "-"}</td>
              <td>{product.price || "-"}</td>
              <td>{product.is_active ? "Active" : "Inactive"}</td>
              <td className="text-end">
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => onEdit(product)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(product)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ProductsTable
