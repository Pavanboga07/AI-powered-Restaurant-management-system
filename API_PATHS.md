# API Endpoint Path Reference

## Routing Inconsistency Found

Some routers use `/api/` prefix, others don't:

### WITHOUT /api/ prefix:
- `/auth/*` - Authentication
- `/menu/*` - Menu items
- `/inventory/*` - Inventory

### WITH /api/ prefix:
- `/api/orders/*` - Orders
- `/api/tables/*` - Tables  
- `/api/billing/*` - Billing
- `/api/reservations/*` - Reservations
- `/api/coupons/*` - Coupons
- `/api/reviews/*` - Reviews
- `/api/analytics/*` - Analytics
- `/api/chef/*` - Chef endpoints
- `/api/staff/*` - Staff endpoints
- `/api/customer/*` - Customer endpoints
- `/api/profile/*` - Customer profile
- `/api/loyalty/*` - Loyalty
- `/api/kds/*` - Kitchen display

## Correct Endpoint Paths

### Authentication
- POST `/auth/login` - Login with form data
- POST `/auth/login/json` - Login with JSON
- POST `/auth/register` - Register new user
- GET `/auth/me` - Get current user

### Menu
- GET `/menu/` - Get all menu items
- GET `/menu/{id}` - Get single menu item
- GET `/menu/categories/list` - Get categories
- POST `/menu/` - Create menu item (auth required)

### Chef  
- GET `/api/chef/orders/active` - Active orders
- GET `/api/chef/orders/stats` - Order statistics (THE FIX!)
- GET `/api/chef/menu/items` - Menu items for chef

### Staff
- GET `/api/staff/orders/stats` - Staff order stats
- GET `/api/staff/orders/today` - Today's orders
- GET `/api/staff/tables` - All tables
- GET `/api/staff/service-requests` - Service requests

### Manager/Analytics
- GET `/api/analytics/revenue` - Revenue analytics
- GET `/api/analytics/dashboard` - Dashboard stats
- GET `/api/analytics/popular-items` - Popular items

### Tables
- GET `/api/tables/` - All tables
- GET `/api/tables/{id}` - Single table
- PUT `/api/tables/{id}` - Update table

### Orders
- GET `/api/orders/` - All orders
- GET `/api/orders/{id}` - Single order
- POST `/api/orders/` - Create order
- PUT `/api/orders/{id}/status` - Update status

### Billing
- GET `/api/billing/` - All bills
- GET `/api/billing/{id}` - Single bill
- POST `/api/billing/` - Create bill

### Reservations
- GET `/api/reservations/` - All reservations
- POST `/api/reservations/` - Create reservation
- PUT `/api/reservations/{id}` - Update reservation

### Customer
- GET `/api/customer/profile` - Customer profile
- GET `/api/customer/favorites` - Customer favorites
- GET `/api/customer/menu` - Browse menu
- POST `/api/customer/favorites` - Add favorite
