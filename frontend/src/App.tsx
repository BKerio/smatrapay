// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { ThemeProvider } from '@/components/theme-provider';
import RequireAuth from '@/components/requireAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Login from '@/pages/login';
import Dashboard from '@/pages/admin_dashboard';
import Vendors from '@/pages/admin/Vendors';
import Landlords from '@/pages/admin/Landlords';
import Meters from '@/pages/admin/Meters';
import Account from '@/pages/admin/Account';
import SystemConfigPage from '@/pages/system-config';
import AdminMeter from '@/pages/admin/admin_meter';
import Branding from '@/pages/vendor/Branding';
import CustomerManagement from '@/pages/vendor/CustomerManagement';
import CompanyDashboard from '@/pages/vendor/CompanyDashboard';
import IndividualDashboard from '@/pages/vendor/IndividualDashboard';
import LipaTokenNaMpesa from '@/pages/customer/LipaTokenNaMpesa';
import VendingSettingsPage from '@/pages/admin/vending';
import Inquery from '@/pages/admin/Inquery';
import CustomerDashboard from '@/pages/customer/CustomerDashboard';
import PurchaseHistory from '@/pages/customer/PurchaseHistory';
import LandlordDashboard from '@/pages/landlord/LandlordDashboard';
import MyProperties from '@/pages/landlord/MyProperties';
import LocationHierarchy from '@/pages/landlord/LocationHierarchy';
import ForgotPassword from '@/pages/forgotpassword';
import Register from '@/pages/register';
import VendorApprovals from '@/pages/admin/VendorApprovals';
import GlobalCallback from '@/pages/admin/GlobalCallback';
import TrackToken from '@/pages/customer/TrackToken';
import TokenManagement from '@/pages/TokenManagement';

// Support Pages
import ApiDocs from '@/pages/support/ApiDocs';
import PrivacyPolicy from '@/pages/support/PrivacyPolicy';
import TermsOfService from '@/pages/support/TermsOfService';
import HelpCenter from '@/pages/support/HelpCenter';

import { AccessibilityProvider } from '@/components/ui/AccessibilityContext';
import { AccessibilityMenu } from '@/components/ui/AccessibilityMenu';
import ScrollToTop from '@/components/ScrollToTop';

function App() {
  return (
    <AccessibilityProvider>
      <ThemeProvider defaultTheme="light">
        <Router future={{ v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <div className='min-h-screen bg-white dark:bg-gray-900'>
            <AccessibilityMenu />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <DashboardLayout />
                  </RequireAuth>
                }
              >
                <Route path="account" element={<Account />} />
                <Route path="vendors" element={<Vendors />} />
                <Route path="approvals" element={<VendorApprovals />} />
                <Route path="landlords" element={<Landlords />} />
                <Route path="landlord" element={<LandlordDashboard />} />
                <Route path="properties" element={<MyProperties />} />
                <Route path="location-hierarchy" element={<LocationHierarchy />} />
                <Route path="vendor-overview" element={<AdminMeter />} />
                <Route path="meters" element={<Meters />} />
                <Route path="customer-management" element={<CustomerManagement />} />
                <Route path="token-management" element={<TokenManagement />} />
                <Route path="vending-control" element={<VendingSettingsPage />} />
                <Route path="system-config" element={<SystemConfigPage />} />
                <Route path="callback-settings" element={<GlobalCallback />} />
                <Route path="inqueries" element={<Inquery />} />
                <Route path="lipa-mpesa" element={<LipaTokenNaMpesa />} />
                <Route path="branding" element={<Branding />} />
                <Route path="company" element={<CompanyDashboard />} />
                <Route path="individual" element={<IndividualDashboard />} />
                <Route path="customer" element={<CustomerDashboard />} />
                <Route path="purchase-history" element={<PurchaseHistory />} />
                <Route index element={<Dashboard />} />
              </Route>
              <Route path="/" element={<Login />} />
              <Route path="/track-token" element={<TrackToken />} />
              
              {/* Support & Legal */}
              <Route path="/api-docs" element={<ApiDocs />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/help" element={<HelpCenter />} />

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </AccessibilityProvider>
  );
}

export default App;