import Navbar from '../components/ui/NavBar'
import Footer from '../components/ui/Footer'
import FloatingContactWidget from '../components/ui/FloatingContactWidget'
import { Outlet, useLocation } from 'react-router-dom'

function MainLayout({numCartItems}) {
  const location = useLocation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar numCartItems={numCartItems} transparent={location.pathname === '/'} />
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
      <FloatingContactWidget />
      <Footer/>
    </div>
  )
}

export default MainLayout
