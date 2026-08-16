import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/navbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Menu, X } from 'lucide-react';
import DashboardLoader from '@/lib/loader';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  profile_image: string | null;
  bio: string | null;
  roles?: string[];
  permissions?: string[];
}

const SIDEBAR_WIDTH = 256; // w-64 when expanded
const SIDEBAR_COLLAPSED_WIDTH = 80; // w-20 when collapsed
const NAVBAR_HEIGHT = 64; // dashboard navbar height
const HEADER_HEIGHT = 56; // additional mobile header height

interface VendorProfile {
  logo_url?: string | null;
  business_name?: string;
  dashboard_settings?: { show_logo_in_sidebar?: boolean; tagline?: string };
}

const DashboardLayout = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (window.innerWidth < 768) return false;
    return localStorage.getItem('tokenpap_sidebar_collapsed') !== 'true';
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post(`${import.meta.env.VITE_API_URL}/admin/logout`, null, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      navigate('/login');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    axios.get(`${import.meta.env.VITE_API_URL}/admin/account`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        const userData = res.data;
        // Ensure roles/permissions are arrays for backward compatibility
        userData.roles = userData.roles || (userData.role ? [userData.role] : []);
        userData.permissions = userData.permissions || [];
        setUser(userData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch user:', err);
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, [navigate]);

  useEffect(() => {
    if (!user || user.role !== 'vendor') {
      setVendorProfile(null);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get(`${import.meta.env.VITE_API_URL}/vendor/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.data?.status === 200 && res.data?.vendor) {
          setVendorProfile({
            logo_url: res.data.vendor.logo_url,
            business_name: res.data.vendor.business_name,
            dashboard_settings: res.data.vendor.dashboard_settings,
          });
        }
      })
      .catch(() => setVendorProfile(null));
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(localStorage.getItem('tokenpap_sidebar_collapsed') !== 'true');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('tokenpap_sidebar_collapsed', String(!sidebarOpen));
    }
  }, [sidebarOpen, isMobile]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardLoader
          title="Authenticating..."
          subtitle="Please wait while we verify your credentials"
        />
      </div>
    );
  }

  const topPadding = isMobile ? HEADER_HEIGHT : 0;

  return (
    <>
      {/* Navbar stays fixed at top */}
      <Navbar
        user={user}
        vendorProfile={vendorProfile}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        showSidebarToggle={!isMobile}
        sidebarOpen={sidebarOpen}
        onLogout={handleLogout}
        hideTopBar={true}
      />

      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">

        {/* Fixed Sidebar with top offset */}
        <div
          className="fixed left-0 z-20 transition-all duration-300 ease-in-out"
          style={{
            width: isMobile ? `${SIDEBAR_WIDTH}px` : (sidebarOpen ? `${SIDEBAR_WIDTH}px` : `${SIDEBAR_COLLAPSED_WIDTH}px`),
            top: `${NAVBAR_HEIGHT}px`,
            height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
          }}
        >
          <Sidebar
            user={user}
            vendorProfile={vendorProfile}
            sidebarOpen={sidebarOpen}
            isMobile={isMobile}
            onLogout={handleLogout}
            onCloseMobile={() => setSidebarOpen(false)}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          />
        </div>

        {/* Mobile Greeting Header */}
        {isMobile && (
          <header
            className="fixed left-0 right-0 z-10 flex items-center justify-between p-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 ease-in-out"
            style={{
              top: `${NAVBAR_HEIGHT}px`,
              marginLeft: 0,
              height: `${HEADER_HEIGHT}px`,
            }}
          >
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-700"
            >
              {sidebarOpen ? <X /> : <Menu />}
            </button>

            <div className="w-10"></div>
          </header>
        )}

        {/* Content area below fixed header */}
        <div
          className="flex flex-col flex-1 min-h-screen transition-all duration-300 ease-in-out"
          style={{
            marginLeft: isMobile ? 0 : (sidebarOpen ? `${SIDEBAR_WIDTH}px` : `${SIDEBAR_COLLAPSED_WIDTH}px`),
            paddingTop: `${topPadding}px`
          }}
        >
          <main className="flex-1 overflow-y-auto">
            <Outlet context={{ user, setUser, vendorProfile, setVendorProfile }} />
          </main>

          <Footer />
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;
