import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const revenueData = [
  { month: 'T1', revenue: 180 },
  { month: 'T2', revenue: 200 },
  { month: 'T3', revenue: 190 },
  { month: 'T4', revenue: 230 },
  { month: 'T5', revenue: 210 },
  { month: 'T6', revenue: 245 },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white border rounded-3 p-2 shadow-sm">
      <div className="fw-semibold">{label}</div>
      <div className="text-muted small">VND {payload[0].value}k</div>
    </div>
  )
}

function MainContent() {
  return (
    <div className="main-content p-4 bg-light h-100">
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Bảng điều khiển</h4>
        <p className="text-muted mb-0">Chào mừng bạn đến với trang quản trị ShuttleX</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-muted fw-semibold">Tổng sản phẩm</small>
              </div>
              <h5 className="fw-bold mb-1">128</h5>
              <small className="text-success">+12% so với tháng trước</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-muted fw-semibold">Danh mục</small>
              </div>
              <h5 className="fw-bold mb-1">8</h5>
              <small className="text-success">+8% so với tháng trước</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-muted fw-semibold">Đơn hàng đang xử lý</small>
              </div>
              <h5 className="fw-bold mb-1">46</h5>
              <small className="text-success">+23% so với tháng trước</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-muted fw-semibold">Doanh thu</small>
              </div>
              <h5 className="fw-bold mb-1">5,340,567 VND</h5>
              <small className="text-success">+18% so với tháng trước</small>
            </div>
          </div>
        </div>
      </div>

      {/* Xu hướng doanh thu - Recharts */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="fw-bold mb-0">Xu hướng doanh thu</h6>
          </div>

          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <AreaChart data={revenueData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickMargin={10} />
                <YAxis
                  tickMargin={10}
                  tickFormatter={(v) => `${v}k      `}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  fill="rgba(34, 197, 94, 0.15)"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Hoạt động gần đây</h6>
              <ul className="list-unstyled mb-0">
                <li className="mb-3">
                  <div className="fw-semibold">Có đơn hàng mới</div>
                  <div className="text-muted small">Đơn #SX1023 · 2 giờ trước</div>
                </li>
                <li className="mb-3">
                  <div className="fw-semibold">Đã cập nhật tồn kho sản phẩm</div>
                  <div className="text-muted small">Yonex Aerosensa 50 · 5 giờ trước</div>
                </li>
                <li>
                  <div className="fw-semibold">Người dùng mới đăng ký</div>
                  <div className="text-muted small">customer01 · 1 ngày trước</div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Công việc sắp tới</h6>

              <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox" id="task1" />
                <label className="form-check-label" htmlFor="task1">
                  <div className="fw-semibold">Kiểm tra sản phẩm sắp hết hàng</div>
                  <div className="text-muted small">Hôm nay lúc 14:00</div>
                </label>
              </div>

              <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox" id="task2" />
                <label className="form-check-label" htmlFor="task2">
                  <div className="fw-semibold">Xác nhận đơn hàng chờ xử lý</div>
                  <div className="text-muted small">Ngày mai lúc 10:00</div>
                </label>
              </div>

              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="task3" />
                <label className="form-check-label" htmlFor="task3">
                  <div className="fw-semibold">Cập nhật banner trang chủ</div>
                  <div className="text-muted small">Thứ Sáu lúc 15:00</div>
                </label>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainContent
