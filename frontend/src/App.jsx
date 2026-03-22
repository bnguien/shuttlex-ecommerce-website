import { BrowserRouter, Routes, Route } from "react-router-dom"
import MainLayout from './layout/MainLayout'
import HomePage from './components/home/HomePage'
import ProductDetailPage from './components/product/ProductDetailPage'
import ProductPage from './components/product/ProductPage'
import CartPage from "./components/cart/CartPage"
import CheckoutPage from "./components/cart/CheckoutPage"
import LoginPage from "./components/user/LoginPage"
import RegisterPage from "./components/user/RegisterPage"
import UserInfoPage from "./components/user/UserInfoPage"
import ChangePasswordPage from "./components/user/ChangePasswordPage"
import VerifyEmailPage from "./components/user/VerifyEmailPage"
import ForgotPasswordPage from "./components/user/ForgotPasswordPage"
import ResetPasswordPage from "./components/user/ResetPasswordPage"
import DashBoardPage from "./components/dashboard/DashBoardPage"
import ProductsPage from "./components/admin/products/ProductsPage"
import CategoriesPage from "./components/admin/categories/CategoriesPage"
import BrandsPage from "./components/admin/brands/BrandsPage"
import SizesPage from "./components/admin/sizes/SizesPage"
import UsersPage from "./components/admin/users/UsersPage"
import AdminProfilePage from "./components/admin/AdminProfilePage"
import AdminLayout from "./components/dashboard/AdminLayout"
import { AuthProvider } from "./components/context/AuthContext"
import { ToastProvider } from "./components/ui/Toast"
import "bootstrap/dist/css/bootstrap.min.css"
import NotFoundPage from "./components/ui/NotFoundPage"
import AboutPage from './components/about/AboutPage'
import ContactPage from "./components/contact/ContactPage"
import PaymentQrPage from "./components/order/PaymentQrPage"
import OrderHistoryPage from "./components/order/OrderHistoryPage"
import OrderDetailPage from "./components/order/OrderDetailPage"
import { useEffect, useState } from "react"
import api from "./api"
import ProtectedRoute from "./components/ui/ProtectedRoute"
import AdminRoute from "./components/ui/AdminRoute"

const CART_CODE_KEY = "cart_code"

const App = () => {
  const [numCartItems, setNumCartItems] = useState(0)

  const refreshCartStat = () => {
    const token = localStorage.getItem("access")
    if (!token) {
      setNumCartItems(0)
      return
    }

    const cartCode = localStorage.getItem(CART_CODE_KEY)
    if (!cartCode) {
      setNumCartItems(0)
      return
    }

    api.get(`get_cart_stat?cart_code=${cartCode}`)
      .then((res) => setNumCartItems(res.data.num_of_items ?? 0))
      .catch(() => setNumCartItems(0))
  }

  useEffect(() => {
    refreshCartStat()
  }, [])

  useEffect(() => {
    const handleCartReset = () => setNumCartItems(0)
    const handleCartRefresh = () => refreshCartStat()
    window.addEventListener("cart:reset", handleCartReset)
    window.addEventListener("cart:refresh", handleCartRefresh)
    return () => {
      window.removeEventListener("cart:reset", handleCartReset)
      window.removeEventListener("cart:refresh", handleCartRefresh)
    }
  }, [])

  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout numCartItems={numCartItems} />}>
            <Route index element={<HomePage />} />
            <Route path="/products" element={<ProductPage />} />
            <Route path="/product/:slug" element={<ProductDetailPage setNumCartItems={setNumCartItems} />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/cart" element={<ProtectedRoute><CartPage setNumCartItems={setNumCartItems} /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage setNumCartItems={setNumCartItems} /></ProtectedRoute>} />
            <Route path="/payment/qr/:code" element={<ProtectedRoute><PaymentQrPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
            <Route path="/orders/:code" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
            <Route path="/order-success/:code" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<UserInfoPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/verify-email/:key" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
          </Route>
          <Route
            path="/admin"
            element={<AdminRoute><AdminLayout /></AdminRoute>}
          >
            <Route path="dashboard" element={<DashBoardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="brands" element={<BrandsPage />} />
            <Route path="sizes" element={<SizesPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="change-password" element={<ChangePasswordPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
