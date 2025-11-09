# QR Code System & Employee Scheduling Features

## Overview
This document describes the two new major features added to the restaurant management system:
1. **QR Code System** - Table-specific QR codes for contactless menu access
2. **Employee Scheduling** - Comprehensive shift management with conflict detection

---

## 🔗 QR Code System

### Backend Implementation

#### Database Schema
No additional tables needed - uses existing `tables` table.

#### API Endpoints

**1. Generate Single QR Code**
```
GET /api/qr/table/{table_id}
```
- Response: Base64-encoded PNG QR code + URL
- QR Code URL format: `http://localhost:5173/qr-menu?table={id}`

**2. Batch Generate QR Codes**
```
POST /api/qr/batch
{
  "table_ids": [1, 2, 3, 4, 5]
}
```
- Response: Array of QR codes for all requested tables

**3. Customer Check-In**
```
POST /api/qr/checkin/{table_id}
{
  "customer_name": "John Doe",
  "guest_count": 4
}
```
- Updates table status to "occupied"
- No authentication required (public endpoint)

#### Files Created
- `backend/app/routers/qr.py` - QR generation and check-in logic
- Backend uses `qrcode[pil]` library for PNG generation

### Frontend Implementation

#### QR Code Generator (Manager View)
**Component:** `frontend/src/components/manager/tabs/QRCodeGenerator.jsx`

**Features:**
- Select tables to generate QR codes for
- Visual preview of all generated QR codes
- Download individual QR codes as PNG images
- Print all QR codes to PDF (3×4 grid layout)
- Responsive grid layout with table information

**Access:** Manager Dashboard → QR Codes

#### QR Menu View (Public Page)
**Component:** `frontend/src/components/customer/QRMenuView.jsx`

**Features:**
- **Check-In Flow:**
  - Customer scans QR code
  - Enters name and guest count
  - Table marked as occupied
  
- **Menu Browsing:**
  - Search menu items
  - Filter by category
  - No authentication required
  
- **Shopping Cart:**
  - Add items to cart
  - Adjust quantities
  - View cart total
  
- **Call Waiter:**
  - Request assistance button
  - Sends notification to staff

**Access:** Public URL `/qr-menu?table={id}`

#### Files Created
- `frontend/src/components/manager/tabs/QRCodeGenerator.jsx`
- `frontend/src/components/customer/QRMenuView.jsx`
- Added `react-qr-code` dependency to `package.json`

---

## 📅 Employee Scheduling

### Backend Implementation

#### Database Schema
**Table:** `shifts`

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| employee_id | INTEGER | FK to users table |
| date | DATE | Shift date |
| shift_type | ENUM | morning/afternoon/evening/night |
| start_time | TIME | Shift start time |
| end_time | TIME | Shift end time |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Indexes:**
- `idx_shifts_employee_id` on `employee_id`
- `idx_shifts_date` on `date`
- `idx_shifts_employee_date` on `employee_id, date` (composite)

**Shift Types:**
- `morning`: 6:00 AM - 2:00 PM
- `afternoon`: 2:00 PM - 10:00 PM
- `evening`: 6:00 PM - 12:00 AM
- `night`: 10:00 PM - 6:00 AM

#### API Endpoints

**1. Create Shift**
```
POST /api/shifts
{
  "employee_id": 1,
  "date": "2024-01-15",
  "shift_type": "morning",
  "start_time": "06:00",
  "end_time": "14:00"
}
```
- Automatically checks for conflicts before creation

**2. Get All Shifts**
```
GET /api/shifts?employee_id=1&date_from=2024-01-01&date_to=2024-01-31
```
- Optional filters: employee_id, date_from, date_to

**3. Get Weekly Schedule**
```
GET /api/shifts/weekly?week_start=2024-01-15
```
- Returns shifts for Mon-Sun week
- Auto-calculates week start if not provided
- Includes employee list

**4. Get Shift by ID**
```
GET /api/shifts/{shift_id}
```

**5. Update Shift**
```
PUT /api/shifts/{shift_id}
{
  "shift_type": "afternoon",
  "start_time": "14:00",
  "end_time": "22:00"
}
```
- Re-checks conflicts on update

**6. Delete Shift**
```
DELETE /api/shifts/{shift_id}
```

**7. Check Conflict**
```
POST /api/shifts/check-conflict
{
  "employee_id": 1,
  "date": "2024-01-15",
  "start_time": "06:00",
  "end_time": "14:00"
}
```
- Returns: `{ "has_conflict": false, "message": "..." }`

#### Conflict Detection Logic
Shifts conflict if:
```
shift.start_time < existing.end_time AND shift.end_time > existing.start_time
```
- Prevents overlapping shifts for same employee on same day
- Checked automatically on create/update

#### Files Created
- `backend/app/routers/shifts.py` - Complete shift CRUD logic
- `backend/app/models.py` - Added Shift model and ShiftType enum
- `backend/app/schemas.py` - Added Shift-related Pydantic schemas

### Frontend Implementation

#### Employee Scheduling Component
**Component:** `frontend/src/components/manager/tabs/EmployeeScheduling.jsx`

**Features:**
- **Weekly Calendar Grid:**
  - 7 days (Monday-Sunday) × N employees
  - Color-coded shifts by type:
    - Morning: Yellow
    - Afternoon: Orange
    - Evening: Purple
    - Night: Blue
  
- **Week Navigation:**
  - Previous/Next week arrows
  - "This Week" quick jump
  - Week date range display

- **Shift Management:**
  - Click "+" to add shift to any day/employee
  - Hover over shift to see Edit/Delete buttons
  - Modal form for add/edit with conflict detection
  - Shift type selector with preset times
  
- **Conflict Detection:**
  - Real-time validation before saving
  - Error messages for overlapping shifts
  
- **Export:**
  - Export schedule to PDF
  - Table format with all employees and shifts

**Access:** Manager Dashboard → Scheduling

#### Files Created
- `frontend/src/components/manager/tabs/EmployeeScheduling.jsx`
- Updated Sidebar navigation to include "Scheduling"

---

## 🗄️ Database Migration

Run the SQL migration script to create the shifts table:

```bash
psql -U your_user -d your_database -f backend/migrations/001_add_shifts_table.sql
```

Or execute the SQL directly in your PostgreSQL client.

**File:** `backend/migrations/001_add_shifts_table.sql`

---

## 📦 Dependencies

### Backend
- `qrcode[pil]` (8.2) - QR code generation

### Frontend
- `react-qr-code` (2.0.12) - QR code display component

---

## 🚀 Getting Started

### 1. Install Dependencies

**Backend:**
```bash
cd backend
pip install qrcode[pil]
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Run Database Migration
```bash
psql -U your_user -d your_database -f backend/migrations/001_add_shifts_table.sql
```

### 3. Start Services

**Backend:**
```bash
cd backend
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Access Features

- **QR Code Generator:** Login as manager → Navigate to "QR Codes"
- **Employee Scheduling:** Login as manager → Navigate to "Scheduling"
- **QR Menu (Public):** Scan generated QR code or visit `/qr-menu?table={id}`

---

## 🔍 Usage Examples

### Generate QR Codes
1. Login as manager/admin
2. Go to "QR Codes" tab
3. Select tables you want QR codes for
4. Click "Generate QR Codes"
5. Download individual PNGs or print all to PDF
6. Place printed QR codes on tables

### Customer Flow
1. Customer scans QR code on table
2. Enters name and guest count
3. Browses menu, adds items to cart
4. Clicks "Call Waiter" when ready to order
5. Waiter receives notification

### Schedule Employees
1. Login as manager/admin
2. Go to "Scheduling" tab
3. Navigate to desired week
4. Click "+" on employee row for specific day
5. Select shift type (auto-fills times)
6. Adjust times if needed
7. Save (conflict check runs automatically)
8. Export schedule to PDF for distribution

---

## 🎨 UI/UX Highlights

### QR Code Generator
- Clean grid layout with table selection
- Live QR code previews
- One-click downloads
- Batch PDF printing with proper layout
- Instructions panel for staff

### QR Menu View
- Mobile-first responsive design
- Gradient header with table info
- Category filters and search
- Smooth cart drawer animation
- "Call Waiter" always accessible
- No login required (frictionless experience)

### Employee Scheduling
- Professional calendar grid
- Color-coded visual indicators
- Hover interactions for actions
- Modal forms with validation
- Week navigation controls
- Sticky headers for scrolling
- Export functionality

---

## 🔐 Security Notes

- **QR Check-In:** Public endpoint (no auth) - validates table exists
- **QR Generation:** Manager/Admin only
- **Shift Management:** Manager/Admin only
- **QR Menu View:** Public access (read-only menu)

---

## 🐛 Known Limitations

1. **QR Menu:** Cart is client-side only (not persisted to backend)
   - Workaround: "Call Waiter" button notifies staff
   
2. **Scheduling:** Drag-and-drop not implemented
   - Workaround: Click-to-add interface with modal

3. **Real-time Updates:** Schedule changes don't auto-refresh
   - Workaround: Manual refresh button provided

---

## 🔮 Future Enhancements

### QR Code System
- [ ] Multi-language QR menu (integrate with i18n)
- [ ] Direct order placement from QR menu
- [ ] Table service requests (refill, check, etc.)
- [ ] Customer order history
- [ ] Payment integration

### Employee Scheduling
- [ ] Drag-and-drop shift assignment
- [ ] Shift swap requests
- [ ] Employee availability preferences
- [ ] Auto-scheduling based on rules
- [ ] Shift templates/patterns
- [ ] Mobile app for employees
- [ ] Push notifications for schedule changes

---

## 📝 Testing Checklist

### QR Code System
- [x] Generate single QR code
- [x] Batch generate multiple QR codes
- [x] Download QR as PNG
- [x] Print all QRs to PDF
- [x] Scan QR code (test URL)
- [x] Customer check-in flow
- [x] Menu browsing
- [x] Add items to cart
- [x] Call waiter button

### Employee Scheduling
- [x] Create shift
- [x] View weekly schedule
- [x] Edit shift
- [x] Delete shift
- [x] Conflict detection
- [x] Week navigation
- [x] Export to PDF
- [x] Mobile responsive

---

## 📚 API Documentation

Full API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

New endpoints documented:
- `/api/qr/*` - QR code operations
- `/api/shifts/*` - Shift management

---

## 🤝 Support

For issues or questions:
1. Check console logs (browser + backend)
2. Verify database migrations ran successfully
3. Confirm all dependencies installed
4. Check API endpoint responses in Network tab

---

**Created:** PROMPT 6B Implementation
**Features:** QR Code System + Employee Scheduling
**Status:** ✅ Complete - All 12 tasks finished
