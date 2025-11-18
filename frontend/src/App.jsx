import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ManagerDashboard from './components/manager/Dashboard';
import ChefDashboard from './components/chef/ChefDashboard';
import ChefKitchenDisplay from './components/chef/ChefKitchenDisplay';
import ChefMessaging from './components/chef/ChefMessaging';
import ChefShiftHandover from './components/chef/ChefShiftHandover';
import StaffDashboard from './components/staff/StaffDashboard';
import CustomerDashboard from './components/customer/CustomerDashboard';
import PlaceOrderPage from './pages/PlaceOrderPage';
import ChefKDS from './components/chef/ChefKDS';
import CustomerReservation from './pages/CustomerReservation';
import QRMenuView from './components/customer/QRMenuView';
import ConnectionStatus from './components/common/ConnectionStatus';
import Toast from './components/common/Toast';
import NotificationsPanel from './components/common/NotificationsPanel';
// Phase 4 Components
import CustomerProfile from './pages/CustomerProfile';
import LoyaltyDashboard from './pages/LoyaltyDashboard';
import RecurringReservations from './pages/RecurringReservations';
// Phase 5 Components
import KitchenDisplay from './components/kitchen/KitchenDisplay';
// Phase 6 Components
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import './i18n'; // Initialize i18n

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <WebSocketProvider>
            <ConnectionStatus />
            <Toast />
            <NotificationsPanel />
            <Routes>
            {/* Root redirect - redirect to login if not authenticated */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* QR Menu Public Access - No auth required */}
            <Route path="/qr-menu" element={<QRMenuView />} />

          {/* Manager Dashboard Routes - No Navbar (admin, manager only) */}
          <Route
            path="/manager/*"
            element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Chef Dashboard - No Navbar (chef role only) */}
          <Route
            path="/chef/*"
            element={
              <ProtectedRoute roles={['admin', 'chef']}>
                <ChefDashboard />
              </ProtectedRoute>
            }
          />

          {/* Kitchen Display System - No Navbar (chef role only) */}
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute roles={['admin', 'chef']}>
                <ChefKDS />
              </ProtectedRoute>
            }
          />

          {/* Phase 5: Kitchen Display System (New KDS) - No Navbar */}
          <Route
            path="/kds"
            element={
              <ProtectedRoute roles={['admin', 'chef']}>
                <KitchenDisplay />
              </ProtectedRoute>
            }
          />

          {/* Place Order Page - No Navbar (manager, staff) */}
          <Route
            path="/orders/new"
            element={
              <ProtectedRoute roles={['admin', 'manager', 'staff']}>
                <PlaceOrderPage />
              </ProtectedRoute>
            }
          />

          {/* Staff Dashboard - No Navbar (staff role only) */}
          <Route
            path="/staff/*"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />

          {/* Customer Dashboard - No auth required for menu browsing */}
          <Route path="/customer/*" element={<CustomerDashboard />} />

          {/* Public Reservation Page - No auth required */}
          <Route path="/book" element={<CustomerReservation />} />
          <Route path="/reservations/new" element={<CustomerReservation />} />

          {/* Phase 4: Customer Profile & Loyalty Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={['customer']}>
                <CustomerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loyalty"
            element={
              <ProtectedRoute roles={['customer']}>
                <LoyaltyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recurring-reservations"
            element={
              <ProtectedRoute roles={['customer']}>
                <RecurringReservations />
              </ProtectedRoute>
            }
          />

          {/* Phase 6: AI/ML Analytics Dashboard */}
          <Route
            path="/analytics-ai"
            element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <AnalyticsDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes with Navbar */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-slate-50">
                  <Navbar />
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route
                      path="/menu"
                      element={
                        <div className="container mx-auto px-4 py-8">
                          <h1 className="text-3xl font-bold">Menu Management</h1>
                          <p className="text-slate-600 mt-2">
                            Manage your restaurant menu items here.
                          </p>
                        </div>
                      }
                    />
                    <Route
                      path="/orders"
                      element={
                        <div className="container mx-auto px-4 py-8">
                          <h1 className="text-3xl font-bold">Orders</h1>
                          <p className="text-slate-600 mt-2">
                            View and manage customer orders.
                          </p>
                        </div>
                      }
                    />
                    <Route
                      path="/tables"
                      element={
                        <div className="container mx-auto px-4 py-8">
                          <h1 className="text-3xl font-bold">Table Management</h1>
                          <p className="text-slate-600 mt-2">
                            Manage restaurant tables and seating.
                          </p>
                        </div>
                      }
                    />
                    <Route
                      path="/reservations"
                      element={
                        <div className="container mx-auto px-4 py-8">
                          <h1 className="text-3xl font-bold">Reservations</h1>
                          <p className="text-slate-600 mt-2">
                            View and manage customer reservations.
                          </p>
                        </div>
                      }
                    />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
        </WebSocketProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
