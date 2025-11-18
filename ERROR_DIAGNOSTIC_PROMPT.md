# Comprehensive Error Diagnostic & Fix Prompt

## System Analysis Request

Please perform a complete system audit to identify and fix ALL errors in the restaurant management system. This includes connection errors, API mismatches, database schema inconsistencies, routing problems, and logical errors.

---

## 1. DATABASE SCHEMA VERIFICATION

### Task: Check Database vs Model Field Mismatches

**Check the following models against actual database columns:**

```
For each model in backend/app/models.py:
- User
- MenuItem
- Table
- Order
- OrderItem
- Bill
- Coupon
- Reservation
- Review
- Customer
- InventoryItem
- Supplier
- Shift
```

**Common Mismatches to Find:**
- Field names that don't match (e.g., `tax_amount` in code vs `tax` in DB)
- Missing required fields
- Wrong data types
- Foreign key mismatches
- Enum value mismatches

**Action Items:**
1. Read each model class definition
2. Compare with database table columns
3. Check seed scripts for field usage
4. Verify API endpoints use correct field names
5. Fix ALL mismatches found

---

## 2. API ENDPOINT VERIFICATION

### Task: Verify All API Routes Work Correctly

**Check these endpoint categories:**

#### A. Authentication Endpoints
```
POST /auth/login/json
POST /auth/register
GET  /auth/me
POST /auth/logout
```

#### B. Orders API
```
GET  /api/orders
GET  /api/orders/{id}
POST /api/orders
PUT  /api/orders/{id}
DELETE /api/orders/{id}
PUT  /api/orders/{id}/status
```

#### C. Tables API
```
GET  /api/tables
GET  /api/tables/{id}
PUT  /api/tables/{id}
POST /api/tables
```

#### D. Menu API
```
GET  /menu
GET  /menu/{id}
POST /menu
PUT  /menu/{id}
DELETE /menu/{id}
```

#### E. Bills/Billing API
```
GET  /api/billing
GET  /api/billing/{id}
POST /api/billing
PUT  /api/billing/{id}
```

#### F. Reservations API
```
GET  /api/reservations
POST /api/reservations
PUT  /api/reservations/{id}
```

#### G. Reviews API
```
GET  /api/reviews
POST /api/reviews
```

#### H. Staff API
```
GET  /api/staff/orders/stats
GET  /api/staff/orders/today
```

#### I. Chef API
```
GET  /api/chef/orders/active
GET  /api/chef/orders/stats
PUT  /api/chef/orders/{id}/status
```

#### J. Manager/Analytics API
```
GET  /api/analytics/dashboard
GET  /api/analytics/revenue-trend
GET  /api/analytics/popular-items
```

**For Each Endpoint:**
1. Verify route exists in backend
2. Check request body matches model fields
3. Verify response schema matches frontend expectations
4. Test with actual API calls
5. Fix any 404, 422, or 500 errors

---

## 3. FRONTEND-BACKEND API INTEGRATION

### Task: Check All Frontend API Calls

**Files to Check:**
- `frontend/src/services/api.js` - All API function definitions
- All component files that call APIs

**Common Issues:**
- Wrong endpoint URLs
- Missing or incorrect parameters
- Response field mismatches
- Error handling issues
- Authentication token problems

**Action Items:**
1. List all API functions in api.js
2. Verify each matches a backend endpoint
3. Check request payload structure
4. Verify response handling
5. Fix any mismatches

---

## 4. WEBSOCKET CONNECTION ERRORS

### Task: Fix WebSocket Connection Issues

**Current Issue:**
```
INFO: ('127.0.0.1', xxxxx) - "WebSocket /socket.io/?EIO=4&transport=websocket" 403
INFO: connection rejected (403 Forbidden)
```

**Check:**
1. WebSocket authentication in backend
2. CORS configuration for WebSocket
3. Socket.io version compatibility
4. Room joining logic
5. Event emission/reception

**Files to Check:**
- `backend/app/websocket.py`
- `backend/app/main.py` (Socket.io setup)
- `frontend/src/hooks/useWebSocket.js`
- `frontend/src/contexts/WebSocketContext.jsx`

**Fix:**
1. Verify authentication middleware
2. Update CORS to allow WebSocket
3. Fix room joining logic
4. Test connection with proper auth

---

## 5. ROUTING ERRORS

### Task: Verify All Routes Are Defined

**Frontend Routes (App.jsx):**
- `/login`
- `/staff/*` → StaffDashboard with sub-routes
- `/staff/orders` → OrdersPage
- `/staff/tables` → TablesPage
- `/chef/*` → ChefDashboard
- `/manager/*` → ManagerDashboard
- `/customer/*` → CustomerDashboard
- etc.

**Backend Routes:**
Check all routers are registered in main.py:
- auth_router
- orders_router
- menu_router
- tables_router
- billing_router
- reservations_router
- staff_router
- chef_router
- manager_router
- analytics_router

**Action Items:**
1. List all frontend routes
2. List all backend routes
3. Check for missing routes
4. Verify path parameters work
5. Test navigation

---

## 6. RESPONSE VALIDATION ERRORS

### Task: Fix Pydantic Validation Errors

**Current Error Example:**
```
ResponseValidationError: 10 validation errors:
{'type': 'missing', 'loc': ('response', 'total_orders'), 'msg': 'Field required'}
{'type': 'missing', 'loc': ('response', 'pending_orders'), 'msg': 'Field required'}
...
```

**Check:**
1. Response models match actual returned data
2. All required fields are returned
3. Optional fields marked as Optional[Type]
4. Default values provided

**Files to Check:**
- `backend/app/schemas.py` or schema definitions
- All route handlers that return data
- Response model declarations

**Fix:**
1. Add missing fields to responses
2. Mark optional fields as Optional
3. Provide default values
4. Update response models

---

## 7. COMPONENT-LEVEL ERRORS

### Task: Fix React Component Errors

**Common Issues:**
- Undefined hook usage
- Missing imports
- Wrong prop names
- State management errors
- useEffect dependency issues

**Check These Components:**
- `StaffDashboard.jsx` → OrdersPage (just fixed)
- `ChefDashboard.jsx`
- `ManagerDashboard.jsx`
- `CustomerDashboard.jsx`
- All page components

**Look For:**
1. Console errors in browser
2. Undefined variables
3. Hook usage outside components
4. Missing dependencies in useEffect
5. API call errors

---

## 8. DATABASE RELATIONSHIP ERRORS

### Task: Verify All Relationships Work

**Check:**
1. Foreign key constraints
2. back_populates matches
3. Cascade delete settings
4. Lazy loading configuration

**Common Issues:**
```python
# Wrong:
user = relationship("User", back_populates="customer_profile")
# But User has:
customer_profile_extended = relationship("CustomerProfile", ...)

# Should be:
user = relationship("User", back_populates="customer_profile_extended")
```

**Action Items:**
1. List all relationships
2. Verify both sides match
3. Test cascade deletes
4. Fix any mismatches

---

## 9. AUTHENTICATION & AUTHORIZATION

### Task: Verify Auth System Works

**Check:**
1. Login returns correct token
2. Token is stored in localStorage
3. Token is sent with API requests
4. Protected routes check auth
5. Role-based access works

**Files:**
- `backend/app/auth.py`
- `frontend/src/contexts/AuthContext.jsx`
- `frontend/src/components/ProtectedRoute.jsx`

**Test:**
1. Login with each role
2. Access role-specific pages
3. Verify API calls include token
4. Test logout clears token

---

## 10. DATA FLOW VERIFICATION

### Task: Test Complete User Flows

**Test Scenarios:**

#### A. Staff Creating Order
1. Login as staff
2. Navigate to create order
3. Select table
4. Add menu items
5. Submit order
6. Verify order appears in orders list
7. Check chef receives notification

#### B. Chef Processing Order
1. Login as chef
2. See pending orders
3. Change status to preparing
4. Mark as ready
5. Verify staff receives notification

#### C. Staff Serving Order
1. See ready orders
2. Mark as served
3. Verify bill is created
4. Process payment

#### D. Customer Reservation
1. View menu as customer
2. Make reservation
3. Verify reservation appears in system

**Document:**
- Where each flow breaks
- What error occurs
- What's expected vs actual

---

## 11. ERROR HANDLING IMPROVEMENTS

### Task: Add Proper Error Handling

**Backend:**
```python
# Add try-catch in all endpoints
try:
    # operation
except Exception as e:
    logger.error(f"Error in endpoint: {str(e)}")
    raise HTTPException(status_code=500, detail=str(e))
```

**Frontend:**
```javascript
// Add error boundaries
// Add loading states
// Show user-friendly error messages
```

---

## 12. ENVIRONMENT & CONFIGURATION

### Task: Verify Environment Setup

**Check:**
1. `.env` file exists with correct values
2. Database connection string
3. CORS origins configured
4. Port numbers match
5. API base URL in frontend

**Files:**
- `backend/.env`
- `frontend/src/services/api.js` (base URL)

---

## EXECUTION PLAN

### Phase 1: Database & Models (Priority: CRITICAL)
1. Check all model fields vs DB columns
2. Fix field name mismatches
3. Update seed scripts
4. Test database operations

### Phase 2: API Endpoints (Priority: HIGH)
1. Test each endpoint individually
2. Fix 404 errors (missing routes)
3. Fix 422 errors (validation)
4. Fix 500 errors (server errors)

### Phase 3: Frontend Integration (Priority: HIGH)
1. Fix API call mismatches
2. Update response handling
3. Fix component errors
4. Test user flows

### Phase 4: WebSocket (Priority: MEDIUM)
1. Fix 403 connection errors
2. Test real-time updates
3. Verify room logic

### Phase 5: Polish (Priority: LOW)
1. Add error messages
2. Improve loading states
3. Add validation
4. Test edge cases

---

## SYSTEMATIC APPROACH

For each error found:
1. **Document** - Write down the error
2. **Locate** - Find the exact file and line
3. **Root Cause** - Understand why it's happening
4. **Fix** - Make the minimal change to fix it
5. **Test** - Verify the fix works
6. **Related** - Check if similar errors exist elsewhere

---

## OUTPUT FORMAT

For each error fixed, document:

```markdown
### Error #N: [Brief Description]

**Type:** [Connection/API/Database/Routing/Logic/Other]

**Location:** 
- File: path/to/file.py:line
- Component: ComponentName

**Error Message:**
```
[Paste actual error]
```

**Root Cause:**
[Explain what was wrong]

**Fix Applied:**
```diff
- old code
+ new code
```

**Verification:**
[How to test the fix works]

**Related Issues:**
[List any related problems found]
```

---

## START HERE

Begin with:
1. Check database schema vs models (most critical)
2. Test all API endpoints
3. Fix frontend API calls
4. Resolve WebSocket issues
5. Test complete user flows

**Priority Order:**
1. Database field mismatches (breaks everything)
2. Critical API endpoints (orders, tables, menu)
3. Authentication issues
4. Component crashes
5. WebSocket connections
6. Minor bugs and polish

---

## TOOLS TO USE

- `grep_search` - Find patterns across files
- `read_file` - Read model definitions
- `semantic_search` - Find related code
- `list_code_usages` - Find where functions/fields are used
- `get_errors` - Check for linting/compile errors
- Browser DevTools - Check console errors
- Backend logs - Check API errors

---

## SUCCESS CRITERIA

The system is fully working when:
- ✅ All user roles can login
- ✅ Staff can create orders without errors
- ✅ Orders appear in chef dashboard
- ✅ Chef can update order status
- ✅ Staff receives real-time notifications
- ✅ Bills are generated correctly
- ✅ Payments can be processed
- ✅ All pages load without crashes
- ✅ No console errors in browser
- ✅ No 500 errors in backend
- ✅ WebSocket connects successfully

---

**NOW: Execute this systematic audit and fix ALL errors found!**
