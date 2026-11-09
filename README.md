# ApexStore – Full Stack E-Commerce Platform

A production-ready e-commerce web application built using Django REST Framework and React.js.

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?style=flat-square&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=white)

- **Live Demo:** https://ecommerce-fullstack-jet.vercel.app
- **Repository:** https://github.com/hitesh-coder01/ecommerce-fullstack

---

## 📸 Screenshots
*<img width="1521" height="883" alt="image" src="https://github.com/user-attachments/assets/9c44aa8d-98e3-42af-b2f9-10b5643f258e" />
<img width="1457" height="848" alt="image" src="https://github.com/user-attachments/assets/4e3aa1c9-664b-4a40-8311-e7f4c3d61cf5" />
<img width="1710" height="865" alt="image" src="https://github.com/user-attachments/assets/6b96ad8c-106e-45dd-b0b7-f5f892509c69" />


*

---

## 🛠 Tech Stack
- **Backend:** Python, Django, Django REST Framework, PostgreSQL
- **Frontend:** React.js (Vite), Tailwind CSS
- **Deployment:** Render (Backend), Vercel (Frontend)

---
## 🌟 Key Features
- **Dynamic Routing:** URL-based dynamic product routing (`/product/:id`) with real-time stock availability checks.
- **Atomic Transactions:** Checkout pipeline wrapped in `@transaction.atomic` for automated inventory deductions and snapshot price integrity.
- **Cart & State Management:** Centralized React Context for live cart updates, quantity modifiers (`+` / `-`), and real-time subtotal calculations.
- **Catalog Navigation:** Dynamic `Q`-object multi-field filtering (title, category) combined with ascending/descending price sorting.
- **Security & Route Guarding:** Token-based authentication with `ProtectedRoute` wrappers ensuring isolated user sessions and order histories.
---

## 🔌 Key API Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/products/` | List all products with search & category filters | No |
| `GET` | `/api/products/<id>/` | Fetch single product details | No |
| `POST` | `/api/login/` | Authenticate user and receive Auth Token | No |
| `GET` / `POST` | `/api/cart/` | Fetch and update authenticated user's cart | Yes |
| `POST` | `/api/checkout/` | Process atomic order creation & stock reduction | Yes |

---

## 💻 Local Setup Instructions

### 1. Backend Setup
```bash
# Clone the repository
git clone [https://github.com/hitesh-coder01/ecommerce-fullstack.git](https://github.com/hitesh-coder01/ecommerce-fullstack.git)
cd ecommerce-fullstack

# Install dependencies
pip install -r requirements.txt

# Run migrations and start server
python manage.py migrate
python manage.py runserver
