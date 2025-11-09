# 🍽️ Restaurant Management System

A full-stack restaurant management system with **four role-specific dashboards** built with FastAPI (backend) and React + Vite (frontend).

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-green.svg)](https://fastapi.tiangolo.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.1-38bdf8.svg)](https://tailwindcss.com/)

## ✨ Features

### 🎭 Four Role-Specific Dashboards

#### 👨‍💼 Manager Dashboard
- 📊 Analytics with real-time stats and charts
- 🍔 Complete menu management (12 navigation tabs)
- 📋 Order tracking and management
- 🪑 Table status monitoring
- 📅 Reservation system
- 👥 Staff management
- 📦 Inventory control
- 🎨 Glassmorphism design with orange accents

#### 👨‍🍳 Chef Dashboard (Kitchen Display System)
- 🔥 3-column order workflow (Pending → Preparing → Ready)
- ⏱️ Real-time order timer with auto-urgency alerts
- 🚨 Inventory low-stock warnings
- 📝 Shift handover notes
- 🎨 Dark theme optimized for kitchen environment

#### 👔 Staff Dashboard
- 🏠 Home with stats and activity feed
- 📋 Order search & filtering (5-page navigation)
- 🪑 Visual table status grid
- 📦 Inventory monitoring
- 📅 Reservation management
- 🎨 Clean blue/slate professional interface

#### 🍽️ Customer Dashboard (Public)
- 🍔 Public menu browsing with search & filters
- 🛒 Shopping cart with live total
- 📦 Order tracking with progress steps
- 👤 Profile & order history
- 🎨 Bright appetizing orange/red theme
- ✨ No authentication required for browsing

### Backend (FastAPI)
- **Authentication**: JWT-based authentication with access and refresh tokens
- **User Management**: Role-based access control (Admin, Manager, Chef, Staff)
- **Menu Management**: CRUD operations for menu items with categories
- **Order Management**: Complete order lifecycle from creation to completion
- **Table Management**: Track table status and availability
- **Reservation System**: Manage customer reservations
- **35+ API Endpoints**: Fully documented with Swagger UI

### Frontend (React + Vite)
- **Modern UI**: Built with TailwindCSS and Framer Motion
- **Authentication**: Secure login/register with token management
- **Protected Routes**: Role-based route protection
- **Responsive Design**: Mobile-first approach, works on all devices
- **Animations**: Smooth page transitions and interactive elements
- **API Integration**: Full integration with backend API + auto token refresh

## Tech Stack

### Backend
- FastAPI
- PostgreSQL
- SQLAlchemy
- JWT (python-jose)
- Passlib (bcrypt)

### Frontend
- React 18
- Vite
- React Router v6
- Axios
- TailwindCSS
- Framer Motion

## Project Structure

```
zbc/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app initialization
│   │   ├── database.py          # Database configuration
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── crud/
│   │   │   └── crud.py          # CRUD operations
│   │   ├── routers/
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── menu.py          # Menu endpoints
│   │   │   ├── orders.py        # Order endpoints
│   │   │   ├── tables.py        # Table endpoints
│   │   │   └── reservations.py  # Reservation endpoints
│   │   └── utils/
│   │       └── security.py      # Security utilities
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── manager/
│   │   │   │   ├── Dashboard.jsx        # Manager main dashboard
│   │   │   │   └── tabs/
│   │   │   │       ├── Analytics.jsx    # Analytics tab
│   │   │   │       ├── MenuTab.jsx      # Menu management tab
│   │   │   │       └── TabPlaceholder.jsx
│   │   │   ├── chef/
│   │   │   │   └── ChefDashboard.jsx    # Kitchen Display System (KDS)
│   │   │   ├── staff/
│   │   │   │   └── StaffDashboard.jsx   # Staff 5-page dashboard
│   │   │   ├── customer/
│   │   │   │   └── CustomerDashboard.jsx # Public menu & ordering
│   │   │   ├── shared/
│   │   │   │   └── Sidebar.jsx          # Reusable sidebar
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx       # Role-based route guard
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx          # Global auth state
│   │   ├── services/
│   │   │   └── api.js                   # Axios API service
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── Documentation/
    ├── ROLE_DASHBOARDS.md           # Dashboard feature details
    ├── TESTING_GUIDE.md             # Quick testing guide
    ├── SYSTEM_OVERVIEW.md           # Complete architecture
    ├── COMPONENT_ARCHITECTURE.md    # Component hierarchy
    ├── VISUAL_DESIGN.md             # UI/UX mockups
    └── IMPLEMENTATION_SUMMARY.md    # What was built
```

## 🚀 Quick Start

### Dashboard Access URLs

Once running, access dashboards at:

| Dashboard | URL | Required Role |
|-----------|-----|---------------|
| **Manager** | `http://localhost:5173/manager` | admin, manager |
| **Chef** | `http://localhost:5173/chef` | admin, chef |
| **Staff** | `http://localhost:5173/staff` | admin, staff |
| **Customer** | `http://localhost:5173/customer` | No auth required (public) |

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Setup PostgreSQL Database**
   - Install PostgreSQL if not already installed
   - Create a database:
     ```sql
     CREATE DATABASE restaurant_db;
     ```

6. **Configure environment variables**
   - Update `.env` file with your database credentials:
     ```env
     DATABASE_URL=postgresql://postgres:your_password@localhost:5432/restaurant_db
     SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars
     ```

7. **Run the backend server**
   ```bash
   uvicorn app.main:app --reload
   ```
   
   The API will be available at `http://localhost:8000`
   - API Documentation: `http://localhost:8000/docs`
   - Alternative docs: `http://localhost:8000/redoc`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

## 📚 Documentation

Comprehensive documentation is available in the project:

1. **[ROLE_DASHBOARDS.md](./ROLE_DASHBOARDS.md)** - Detailed features for each dashboard
2. **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Step-by-step testing instructions
3. **[SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md)** - Complete system architecture
4. **[COMPONENT_ARCHITECTURE.md](./COMPONENT_ARCHITECTURE.md)** - Component hierarchy & data flow
5. **[VISUAL_DESIGN.md](./VISUAL_DESIGN.md)** - UI mockups and design tokens
6. **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Quick reference guide

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login (OAuth2 form)
- `POST /auth/login/json` - Login (JSON body)
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user

### Menu Items
- `GET /menu` - Get all menu items
- `GET /menu/{id}` - Get menu item by ID
- `POST /menu` - Create menu item (Admin/Manager)
- `PUT /menu/{id}` - Update menu item (Admin/Manager)
- `DELETE /menu/{id}` - Delete menu item (Admin/Manager)

### Orders
- `GET /orders` - Get all orders
- `GET /orders/{id}` - Get order by ID
- `POST /orders` - Create order
- `PUT /orders/{id}` - Update order
- `DELETE /orders/{id}` - Delete order

### Tables
- `GET /tables` - Get all tables
- `GET /tables/{id}` - Get table by ID
- `POST /tables` - Create table (Admin/Manager)
- `PUT /tables/{id}` - Update table
- `DELETE /tables/{id}` - Delete table (Admin/Manager)

### Reservations
- `GET /reservations` - Get all reservations
- `GET /reservations/{id}` - Get reservation by ID
- `POST /reservations` - Create reservation
- `PUT /reservations/{id}` - Update reservation
- `DELETE /reservations/{id}` - Delete reservation

## User Roles

- **Admin**: Full system access
- **Manager**: Manage menu, tables, orders, and reservations
- **Chef**: View and update orders
- **Staff**: Basic order and reservation management

## Database Models

### User
- Username, email, password (hashed)
- Role (admin, manager, chef, staff)
- Active status

### MenuItem
- Name, description, price
- Category, image URL
- Availability status
- Preparation time

### Table
- Table number, capacity
- Status (available, occupied, reserved)
- Location

### Order
- Table reference, creator
- Status (pending, preparing, ready, served, cancelled)
- Total amount, notes
- Order items (with quantity and price)

### Reservation
- Guest information (name, email, phone)
- Party size, reservation date
- Table assignment
- Status (pending, confirmed, cancelled, completed)

## Development

### Backend Development
```bash
# Run with auto-reload
uvicorn app.main:app --reload

# Run on different port
uvicorn app.main:app --reload --port 8001
```

### Frontend Development
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Security Features

- JWT authentication with access and refresh tokens
- Password hashing with bcrypt
- Role-based access control
- CORS configuration
- Token auto-refresh on frontend
- Protected API endpoints

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/restaurant_db
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## 📊 Project Stats

- **Total Components:** 15+ React components
- **Lines of Code:** ~3,000+ (frontend)
- **API Endpoints:** 35+
- **Database Models:** 6 (User, MenuItem, Order, OrderItem, Table, Reservation)
- **Routes:** 20+ defined routes
- **Documentation:** 6 comprehensive MD files
- **Dashboards:** 4 role-specific interfaces

## Support

For questions or issues:
1. Check **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** for common solutions
2. Review **[SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md)** for architecture details
3. Open an issue on GitHub

---

<div align="center">

**Made with ❤️ for efficient restaurant management**

[⬆ Back to Top](#-restaurant-management-system)

</div>
