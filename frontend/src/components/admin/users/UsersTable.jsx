function UsersTable({ users, onEdit, onDelete }) {
  if (!users || users.length === 0) {
    return <div className="text-muted">Không tìm thấy người dùng.</div>
  }

  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0">
        <thead>
          <tr>
            <th>Tên đăng nhập</th>
            <th>Email</th>
            <th>Họ và tên</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Ngày tham gia</th>
            <th className="text-end">Thao tác</th>
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
                  <span className="badge bg-danger">Quản trị cao nhất</span>
                ) : user.is_staff ? (
                  <span className="badge bg-primary">Nhân viên</span>
                ) : (
                  <span className="badge bg-secondary">Khách hàng</span>
                )}
              </td>
              <td>
                {user.is_active ? (
                  <span className="badge bg-success">Đang hoạt động</span>
                ) : (
                  <span className="badge bg-warning">Tạm khóa</span>
                )}
              </td>
              <td>{new Date(user.date_joined).toLocaleDateString()}</td>
              <td className="text-end">
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => onEdit(user)}
                >
                  Sửa
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(user)}
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

export default UsersTable
