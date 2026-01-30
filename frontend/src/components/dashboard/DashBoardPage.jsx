import React from 'react'
import SideBar from './SideBar'
import TopBar from './TopBar'
import MainContent from './MainContent'

function DashBoardPage() {
  return (
    <div className="container-fluid vh-100 p-0">
      <div className="row h-100 g-0">
        <div className='col-2' style={{backgroundColor: '#ffffff'}}>
            <SideBar/>
        </div>
        <div className="col-10 d-flex flex-column">
            <TopBar/>
            <MainContent/>
        </div>
      </div>
    </div>
  )
}

export default DashBoardPage