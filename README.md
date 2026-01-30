#  ShuttleX - Ecommerce Website

ShuttleX is a full-stack e-commerce platform for badminton accessories, featuring product management, order handling, shopping cart, and secure user authentication using Django and React.

![Python](https://img.shields.io/badge/Python-3.13-blue?style=flat-square&logo=python)
![Django](https://img.shields.io/badge/Django-4.2+-darkgreen?style=flat-square&logo=django)
![React](https://img.shields.io/badge/React-19.2-61dafb?style=flat-square&logo=react)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?style=flat-square&logo=mysql)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

## 📋 Yêu cầu hệ thống

- **Python**: 3.8 hoặc cao hơn
- **Node.js**: 16.x hoặc cao hơn
- **npm**: 8.x hoặc cao hơn
- **pip**: Phiên bản mới nhất
- **MySQL**: 8.0 hoặc cao hơn

---

## 🔧 Hướng dẫn cài đặt

### 1️⃣ Clone Repository

```bash
git clone https://github.com/bnguien/shuttlex-ecommerce-website.git
cd shuttlex-ecommerce-website
```

---

## 📦 Cài đặt Backend (Django)

### Bước 1: Tạo Virtual Environment

```bash
cd backend
python -m venv venv
```

Kích hoạt virtual environment:

**Trên Windows:**
```bash
venv\Scripts\activate
```

**Trên macOS/Linux:**
```bash
source venv/bin/activate
```

### Bước 2: Cài đặt Dependencies

```bash
pip install -r requirements.txt
```

Các packages sẽ được cài đặt:
- **Django** - Web framework
- **djangorestframework** - API development
- **djangorestframework-simplejwt** - JWT authentication
- **django-cors-headers** - CORS support
- **dj-rest-auth** - Authentication API
- **python-dotenv** - Environment variables
- **django-allauth** - User authentication & registration
- **mysqlclient** - MySQL database driver

### Bước 3: Tạo file `.env`

Tạo file `.env` trong thư mục `backend/`:

```bash
cd backend
type nul > .env  # Windows
# hoặc
touch .env  # macOS/Linux
```

Mở file `.env` và thêm các biến sau:

```env
# Django Settings
DEBUG=True
SECRET_KEY=your_secret_key_here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=shuttlex_db
DB_USER=root
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=3306

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

# JWT Token
JWT_SECRET_KEY=your_jwt_secret_key_here
JWT_ALGORITHM=HS256
```

### 📧 Hướng dẫn lấy Email & App Password (Gmail)

#### **Bước 1: Bật 2-Factor Authentication**

1. Truy cập [Google Account](https://myaccount.google.com/)
2. Bấm vào **"Security"** (bảo mật) ở sidebar trái
3. Kéo xuống tìm **"2-Step Verification"** (Xác thực 2 bước)
4. Bấm **"Get Started"** và làm theo hướng dẫn
5. Xác minh số điện thoại và hoàn tất thiết lập

#### **Bước 2: Tạo App Password**

1. Quay lại [Google Account Security](https://myaccount.google.com/security)
2. Kéo xuống tìm **"App passwords"** (Mật khẩu ứng dụng)
   - *Chú ý: Chỉ xuất hiện nếu đã bật 2-Factor Authentication*
3. Chọn:
   - **Select app**: `Mail`
   - **Select device**: `Windows/Mac/Linux`
4. Google sẽ tạo mật khẩu 16 ký tự
5. Sao chép mật khẩu này (không có khoảng trắng)

#### **Bước 3: Điền vào .env**

```env
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=mật_khẩu_16_ký_tự_mà_google_cung_cấp
```

**Ví dụ:**
```env
EMAIL_HOST_USER=shuttlex@gmail.com
EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop  # (Sao chép chính xác, không thêm khoảng trắng)
```

### Bước 4: Cấu hình Database

Đảm bảo MySQL (hoặc database khác) đang chạy, rồi chạy migrations:

```bash
python manage.py migrate
```

### Bước 5: Tạo Superuser

```bash
python manage.py createsuperuser
```

Nhập thông tin yêu cầu (username, email, password)

### Bước 6: Chạy Development Server

```bash
python manage.py runserver
```

Backend sẽ chạy tại: **http://localhost:8000**

Admin panel: **http://localhost:8000/admin**

---

## 🎨 Cài đặt Frontend (React)

### Bước 1: Vào thư mục Frontend

```bash
cd ../frontend  # Từ thư mục backend, quay lại root
cd frontend
```

### Bước 2: Cài đặt Dependencies

```bash
npm install
```

Các packages sẽ được cài đặt:
- **React** - UI library
- **Vite** - Build tool & dev server
- **React Router DOM** - Client-side routing
- **Bootstrap** - CSS framework
- **Recharts** - Data visualization library
- **React Icons** - Icon library (Feather icons)
- **Axios** - HTTP client for API calls

### Bước 3: Tạo file `.env`

```bash
type nul > .env  # Windows
# hoặc
touch .env  # macOS/Linux
```

Mở file `.env` và thêm:

```env
VITE_API_URL=http://localhost:8000/api
```

### Bước 4: Chạy Development Server

```bash
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:5173**

---

## 🚀 Chạy cả Backend và Frontend cùng lúc

### Option 1: Sử dụng 2 Terminal

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # hoặc venv\Scripts\activate trên Windows
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 2: Sử dụng Concurrently (trong root folder)

```bash
npm install --save-dev concurrently
```

Thêm vào `package.json` ở root:

```json
"scripts": {
  "dev": "concurrently \"cd backend && python manage.py runserver\" \"cd frontend && npm run dev\""
}
```

Rồi chạy:
```bash
npm run dev
```

---

## 📁 Cấu trúc dự án

```
shuttlex-ecommerce-website/
├── backend/                    # Django Backend
│   ├── config/                 # Settings chính
│   ├── apps/                   # Các ứng dụng Django
│   │   ├── accounts/          # Quản lý tài khoản người dùng
│   │   ├── catalog/           # Sản phẩm & danh mục
│   │   ├── cart/              # Giỏ hàng
│   │   └── orders/            # Đơn hàng
│   ├── manage.py
│   ├── requirements.txt
│   └── .env                    # Biến môi trường (không commit)
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── dashboard/     # Admin dashboard
│   │   │   ├── home/          # Trang chủ
│   │   │   ├── product/       # Chi tiết sản phẩm
│   │   │   ├── cart/          # Giỏ hàng
│   │   │   ├── user/          # Hồ sơ người dùng
│   │   │   └── ...
│   │   ├── api.js             # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── .env                    # Biến môi trường (không commit)
│   └── vite.config.js
│
└── README.md
```

---

##  Công nghệ sử dụng

### Backend
- **Django 4.x** - Web framework
- **Django REST Framework** - API development
- **JWT (PyJWT)** - Authentication
- **Django CORS** - Cross-Origin Resource Sharing
- **MySQL** - Database

### Frontend
- **React 18+** - UI library
- **Vite** - Build tool
- **React Router DOM** - Routing
- **Bootstrap 5** - CSS framework
- **Recharts** - Data visualization
- **React Icons** - Icon library
- **Axios** - HTTP client

---
## 📄 Giấy phép

Dự án này được sử dụng cho mục đích giáo dục.

---

