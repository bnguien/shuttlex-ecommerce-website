import { Outlet } from "react-router-dom"
import SideBar from "./SideBar"
import TopBar from "./TopBar"
import "./AdminLayout.css"

function AdminLayout() {
  return (
    <div className="container-fluid vh-100 p-0 admin-layout">
      <div className="row h-100 g-0">
        <div className="col-2" >
          <SideBar />
        </div>
        <div className="col-10 d-flex flex-column">
          <TopBar />
          <div className="flex-grow-1 overflow-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
