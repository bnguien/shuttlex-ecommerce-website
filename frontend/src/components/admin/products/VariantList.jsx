function VariantList({ variants, onEdit, onDelete }) {
  if (!variants || variants.length === 0) {
    return <div className="text-muted">No variants yet.</div>
  }

  return (
    <div className="table-responsive">
      <table className="table align-middle">
        <thead>
          <tr>
            <th>Size</th>
            <th>Color</th>
            <th>SKU</th>
            <th>Price</th>
            <th>Stock</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => (
            <tr key={variant.id}>
              <td>{variant.size?.name || "-"}</td>
              <td>{variant.color || "-"}</td>
              <td>{variant.sku || "-"}</td>
              <td>{variant.price || variant.display_price || "-"}</td>
              <td>{variant.stock ?? "-"}</td>
              <td className="text-end">
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => onEdit(variant)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(variant)}
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

export default VariantList
