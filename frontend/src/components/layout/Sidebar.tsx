import { Link, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Activity,
  Shield,
  Building2,
  Gauge,
  Users,
  ShieldCheck,
  Zap,
  Clock,
  Home,
  MessageSquare,
  ShieldAlert,
  MapPin,
  UserCircle2,
  Sliders,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
  vendor_type?: string;
}

interface VendorProfile {
  logo_url?: string | null;
  business_name?: string;
  dashboard_settings?: { show_logo_in_sidebar?: boolean };
}

interface SidebarProps {
  user: UserProfile;
  vendorProfile?: VendorProfile | null;
  sidebarOpen: boolean;
  isMobile: boolean;
  onLogout: () => void;
  onCloseMobile: () => void;
  onToggleSidebar?: () => void;
}

type MenuItem = {
  name: string;
  icon: LucideIcon;
  path: string;
};

type MenuSection = {
  title?: string;
  items: MenuItem[];
};

const Sidebar = ({
  user,
  sidebarOpen,
  isMobile,
  onLogout,
  onCloseMobile,
  onToggleSidebar,
}: SidebarProps) => {
  const location = useLocation();
  const [hovered, setHovered] = useState(false);

  const isVendor = user.role === 'vendor' || user.roles?.includes('vendor');
  const isLandlord = user.role === 'landlord' || user.roles?.includes('landlord');
  const isAdmin =
    user.role === 'admin' ||
    user.role === 'system_admin' ||
    user.roles?.includes('admin');

  const collapsed = !sidebarOpen;
  const isExpanded = isMobile ? sidebarOpen : !collapsed || hovered;

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('tokenpap_sidebar_collapsed', String(collapsed));
    }
  }, [collapsed, isMobile]);

  const getDashboardPath = () => {
    if (user.role === 'customer') return '/dashboard/customer';
    if (user.role === 'landlord') return '/dashboard/landlord';
    if (isVendor) {
      if (user.vendor_type === 'Company') return '/dashboard/company';
      if (user.vendor_type === 'Individual') return '/dashboard/individual';
    }
    return '/dashboard';
  };

  const getRoleLabel = () => {
    if (isAdmin) return 'Administrator';
    if (isVendor) return 'Vendor';
    if (user.role === 'customer') return 'Customer';
    if (isLandlord) return 'Landlord';
    return user.role?.replace('_', ' ') || 'User';
  };

  const allNavLinks: MenuItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, path: getDashboardPath() },
    { name: 'Vending Control', icon: Activity, path: '/dashboard/vending-control' },
    { name: 'Roles & Permissions', icon: Shield, path: '/dashboard/roles-management' },
    { name: 'Vendor Management', icon: Building2, path: '/dashboard/vendors' },
    { name: 'Account Approvals', icon: ShieldAlert, path: '/dashboard/approvals' },
    { name: 'Landlord Management', icon: Home, path: '/dashboard/landlords' },
    { name: 'My Properties', icon: Home, path: '/dashboard/properties' },
    { name: 'Location Hierarchy', icon: MapPin, path: '/dashboard/location-hierarchy' },
    { name: 'Assigned Meters', icon: Users, path: '/dashboard/vendor-overview' },
    { name: 'Meter Management', icon: Gauge, path: '/dashboard/meters' },
    { name: 'Customer Overview', icon: Users, path: '/dashboard/customer-management' },
    { name: 'Token Management', icon: Zap, path: '/dashboard/token-management' },
    { name: 'System Logs', icon: Activity, path: '/dashboard/auditlogs' },
    { name: 'System Configuration', icon: Sliders, path: '/dashboard/system-config' },
    { name: 'Callback Settings', icon: ShieldCheck, path: '/dashboard/callback-settings' },
    { name: 'Public Enquiries', icon: MessageSquare, path: '/dashboard/inqueries' },
    { name: 'Lipa Tokens na Mpesa', icon: Zap, path: '/dashboard/lipa-mpesa' },
    { name: 'Purchase History', icon: Clock, path: '/dashboard/purchase-history' },
    { name: 'Branding', icon: Building2, path: '/dashboard/branding' },
    { name: 'Account Settings', icon: UserCircle2, path: '/dashboard/account' },
  ];

  const linkDisplayName = (link: MenuItem) => {
    if (link.path === '/dashboard/meters' && isVendor) return 'My Meters';
    return link.name;
  };

  const isLinkVisible = (link: MenuItem) => {
    if (['Branding', 'Customer Overview'].includes(link.name) && !isVendor) {
      return false;
    }

    if (link.name === 'Callback Settings') {
      return isAdmin;
    }
    if (link.name === 'System Configuration') {
      return isAdmin || isVendor;
    }

    if (isAdmin) {
      return !['Lipa Tokens na Mpesa', 'Purchase History', 'My Properties'].includes(link.name);
    }

    if (isVendor) {
      return [
        'Dashboard',
        'Meter Management',
        'Customer Overview',
        'Token Management',
        'System Configuration',
        'Account Settings',
        'Branding',
      ].includes(link.name);
    }

    if (user.role === 'customer') {
      return ['Dashboard', 'Account Settings', 'Lipa Tokens na Mpesa', 'Purchase History'].includes(
        link.name
      );
    }

    if (isLandlord) {
      return [
        'Dashboard',
        'My Properties',
        'Location Hierarchy',
        'Meter Management',
        'Token Management',
        'Account Settings',
      ].includes(link.name);
    }

    return ['Dashboard', 'Account Settings'].includes(link.name);
  };

  const visibleLinks = allNavLinks.filter(isLinkVisible);

  const menuSections = useMemo((): MenuSection[] => {
    const dashboard = visibleLinks.filter((l) => l.name === 'Dashboard');
    const account = visibleLinks.filter((l) => l.name === 'Account Settings');
    const managementNames = [
      'Vending Control',
      'Vendor Management',
      'Account Approvals',
      'Landlord Management',
      'My Properties',
      'Location Hierarchy',
      'Assigned Meters',
      'Meter Management',
      'Customer Overview',
      'Token Management',
      'Lipa Tokens na Mpesa',
      'Purchase History',
      'Branding',
    ];
    const systemNames = [
      'Roles & Permissions',
      'System Logs',
      'System Configuration',
      'Callback Settings',
      'Public Enquiries',
    ];

    const management = visibleLinks.filter((l) => managementNames.includes(l.name));
    const system = visibleLinks.filter((l) => systemNames.includes(l.name));

    const sections: MenuSection[] = [];
    if (dashboard.length) sections.push({ items: dashboard });
    if (management.length) sections.push({ title: 'Management', items: management });
    if (system.length) sections.push({ title: 'System', items: system });
    if (account.length) sections.push({ title: 'Account', items: account });

    return sections;
  }, [visibleLinks]);

  const isActive = (path: string) => {
    if (path === getDashboardPath()) {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    const isDarkMode = document.documentElement.classList.contains('dark');

    const result = await Swal.fire({
      title: 'Logout from Dashboard?',
      text: 'You will need to log in again to continue.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: isDarkMode ? '#334155' : '#94a3b8',
      confirmButtonText: 'Logout',
      cancelButtonText: 'Stay',
      background: isDarkMode ? '#020617' : '#ffffff',
      color: isDarkMode ? '#f1f5f9' : '#1e293b',
      customClass: {
        popup: `rounded-3xl border ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`,
        confirmButton: 'rounded-xl px-6',
        cancelButton: 'rounded-xl px-6',
      },
    });

    if (result.isConfirmed) {
      onLogout();
      Swal.fire({
        icon: 'success',
        title: 'Logged out successfully',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  const brandTitle = isVendor && user.vendor_type ? 'SmatraPay Vendor' : 'SmatraPay Admin';
  const brandShort = 'SP';

  return (
    <>
      {isMobile && sidebarOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        onMouseEnter={() => !isMobile && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`h-full bg-gray-950 text-gray-100 flex flex-col border-r border-gray-800 transition-all duration-300 select-none
          ${isMobile ? `fixed z-50 left-0 w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}` : collapsed ? 'w-20' : 'w-64'}
          ${!isMobile && collapsed && hovered ? 'w-64 shadow-2xl z-50 absolute' : ''}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800 shrink-0">
          {isExpanded ? (
            <span className="text-sm font-extrabold tracking-wider uppercase text-white truncate">
              {brandTitle}
            </span>
          ) : (
            <span className="text-base font-black text-indigo-400">{brandShort}</span>
          )}

          {!isMobile && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition duration-200"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-4 overflow-y-auto space-y-4 px-2 custom-scrollbar">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {isExpanded && section.title && (
                <p className="px-3 mb-1 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                  {section.title}
                </p>
              )}

              {section.items.map((link) => {
                const active = isActive(link.path);
                const Icon = link.icon;
                const label = linkDisplayName(link);

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={isMobile ? onCloseMobile : undefined}
                    title={!isExpanded ? label : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group ${
                      active
                        ? 'bg-gray-800 text-white font-semibold shadow-sm'
                        : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                    } ${!isExpanded ? 'justify-center' : ''}`}
                  >
                    <Icon
                      size={18}
                      className={`shrink-0 transition-colors duration-200 ${
                        active ? 'text-indigo-400' : 'text-gray-400 group-hover:text-gray-200'
                      }`}
                    />

                    {isExpanded && <span className="text-sm whitespace-nowrap">{label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Profile & Logout Footer */}
        <div className="p-3 border-t border-gray-800 flex flex-col gap-2 bg-gray-900 shrink-0">
          <div className={`flex items-center gap-3 ${!isExpanded ? 'justify-center' : ''}`}>
            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-red-600 text-white font-extrabold text-sm shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {isExpanded && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate leading-none">{user.name}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">
                  {getRoleLabel()}
                </p>
              </div>
            )}
          </div>

          {isExpanded ? (
            <button
              onClick={handleLogout}
              className="mt-1 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition duration-200"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              title="Logout"
              className="mt-1 w-full flex items-center justify-center p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition duration-200"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
