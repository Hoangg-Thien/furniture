# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:





# Nếp Living frontend

Mã giao diện người dùng được gom trong `src/user/`:

```text
src/
  main.jsx              # Điểm khởi chạy ứng dụng
  user/
    App.jsx             # Giao diện cửa hàng và điều hướng hiện tại
    App.css             # CSS của cửa hàng, modal và checkout
    index.css           # Font và CSS nền tảng
    components/         # Các component giao diện người dùng
    assets/             # Tài nguyên giao diện
    lib/                # Giỏ hàng, checkout và dữ liệu địa chỉ
  admin/                # Giao diện quản trị
  lib/                  # API và xác thực dùng chung
```

Ảnh sản phẩm được phục vụ từ `public/images/` để giữ các URL `/images/...` đang được sử dụng.

React storefront for the furniture sales project. The product list is loaded from the Spring Boot API at `http://localhost:8080/api/products`; if the backend is unavailable, demo products are shown.

Run `npm install` and `npm run dev` from this directory. The API base URL can be overridden with `VITE_API_BASE_URL` in a local `.env` file. See [`../backend/README.md`](../backend/README.md) for Supabase database and backend setup.

Cart contents and favorites remain in browser memory, and checkout does not create an order yet.
