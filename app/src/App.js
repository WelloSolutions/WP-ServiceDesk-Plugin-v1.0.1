import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Login from './components/Login';
import ForgetPassword from './components/ForgetPassword';
import ProtectedRoute from './ProtectedRoute';
import DashboardSidebar from './components/DashboardSidebar';
import ViewHome from './components/ViewHome';
import About from './components/About';
import CreateTicket from './components/CreateTicket';
import ViewTicketList from './components/ViewTicketList';
import ViewTicket from './components/ViewTicket';
import ViewWorkOrder from './components/ViewWorkOrder';
import ViewWorkOrderList from './components/ViewWorkOrderList';
import ViewUserList from './components/ViewUserList';
import ViewEquipmentsList from './components/ViewEquipmentsList';
import ViewEquipment from './components/ViewEquipment';
import ViewDocuments from './components/ViewDocuments';
import ViewCalendars from './components/ViewCalendar';
import ViewBillingInvoice from './components/ViewBillingInvoice';
import PasswordUpdate from './components/PasswordUpdate';
import NotFound from './components/NotFound';

import './App.css';
import './i18n';

function AppContent() {
  const location = useLocation();

  const shouldRenderNavigation = () => {
    const pathsWithoutNav = ['/login', '/forgot-password', '/login/', '/forgot-password/'];
    return !pathsWithoutNav.includes(location.pathname);
  };

  
  return (
    <div className="flex items-start min-h-screen">
      {shouldRenderNavigation() && <DashboardSidebar />}
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgetPassword />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ViewHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <About />
            </ProtectedRoute>
          }
        />
        <Route
          path="/createticket"
          element={
            <ProtectedRoute>
              <CreateTicket />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tickets"
          element={
            <ProtectedRoute>
              <ViewTicketList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ticket/:ticketId"
          element={
            <ProtectedRoute>
              <ViewTicket />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workorders"
          element={
            <ProtectedRoute>
              <ViewWorkOrderList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workorder/:workOrderId"
          element={
            <ProtectedRoute>
              <ViewWorkOrder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipments"
          element={
            <ProtectedRoute>
              <ViewEquipmentsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipment/:InstallationId"
          element={
            <ProtectedRoute>
              <ViewEquipment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <ViewDocuments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <ViewUserList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <ViewCalendars />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing-invoice"
          element={
            <ProtectedRoute>
              <ViewBillingInvoice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/update-password"
          element={
            <ProtectedRoute>
              <PasswordUpdate />
            </ProtectedRoute>
          }
        />
        <Route path="/*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router basename="/service-desk">
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;