function UsersTable({ users, onEdit, onDelete }) {
  if (!users || users.length === 0) {
    return <div className="text-muted">No users found.</div>
  }

  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Full Name</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.full_name || "-"}</td>
              <td>
                {user.is_superuser ? (
                  <span className="badge bg-danger">Superuser</span>
                ) : user.is_staff ? (
                  <span className="badge bg-primary">Staff</span>
                ) : (
                  <span className="badge bg-secondary">Customer</span>
                )}
              </td>
              <td>
                {user.is_active ? (
                  <span className="badge bg-success">Active</span>
                ) : (
                  <span className="badge bg-warning">Inactive</span>
                )}
              </td>
              <td>{new Date(user.date_joined).toLocaleDateString()}</td>
              <td className="text-end">
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => onEdit(user)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(user)}
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

export default UsersTable
