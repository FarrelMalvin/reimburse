import { useState, useEffect, useCallback } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth, api } from "@/App";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  LayoutGrid,
  Receipt,
  MessageSquareWarning,
  CalendarDays,
  Package,
  Bell,
  LogOut,
  User,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Home,
} from "lucide-react";

const appItems = [
  { path: "/bon", label: "Bon", icon: Receipt, gradient: "from-orange-400 to-amber-500" },
  { path: "/pengaduan", label: "Pengaduan", icon: MessageSquareWarning, gradient: "from-teal-400 to-emerald-500" },
  { path: "/cuti", label: "Cuti", icon: CalendarDays, gradient: "from-blue-400 to-indigo-500" },
  { path: "/inventaris", label: "Inventaris", icon: Package, gradient: "from-purple-400 to-violet-500" },
];

const pageNames = {
  "/": "Dashboard",
  "/bon": "Bon / Reimbursement",
  "/pengaduan": "Pengaduan",
  "/cuti": "Cuti",
  "/inventaris": "Inventaris",
};

const roleLabels = { pegawai: "Pegawai", atasan: "Atasan", finance: "Finance" };
const roleBadgeColors = {
  pegawai: "bg-blue-50 text-blue-700 border-blue-200",
  atasan: "bg-amber-50 text-amber-700 border-amber-200",
  finance: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch { /* silent */ }
  };

  const currentPage = pageNames[location.pathname] || "Dashboard";
  const isHome = location.pathname === "/";

  return (
    <div className="flex flex-col h-screen bg-slate-50" data-testid="dashboard-layout">
      {/* Top Navbar - Odoo Style */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 lg:px-5 shrink-0 z-50" data-testid="topbar">
        {/* Left Section */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* App Switcher */}
          <Popover open={appSwitcherOpen} onOpenChange={setAppSwitcherOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                data-testid="app-switcher-btn"
              >
                <LayoutGrid className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-4" data-testid="app-switcher-dropdown">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">Fitur</p>
              <div className="grid grid-cols-2 gap-2">
                {appItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setAppSwitcherOpen(false); }}
                      className={`flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all duration-200 ${
                        isActive ? "bg-slate-100 ring-1 ring-slate-200" : "hover:bg-slate-50"
                      }`}
                      data-testid={`app-switch-${item.label.toLowerCase()}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm`}>
                        <Icon className="h-6 w-6 text-white" strokeWidth={1.8} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => { navigate("/"); setAppSwitcherOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  data-testid="app-switch-dashboard"
                >
                  <Home className="h-4 w-4" /> Dashboard
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 mr-1" data-testid="nav-logo">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>K</span>
            </div>
            <span className="text-slate-900 font-bold text-sm hidden sm:block" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              KantorPlus
            </span>
          </NavLink>

          {/* Breadcrumb */}
          {!isHome && (
            <div className="flex items-center gap-1 text-sm ml-1">
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              <span className="text-slate-500 font-medium">{currentPage}</span>
            </div>
          )}

          {/* Role Badge */}
          <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ml-2 hidden sm:inline-block ${roleBadgeColors[user?.role] || ""}`}>
            {roleLabels[user?.role] || user?.role}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 text-slate-500 hover:text-slate-900" data-testid="notification-bell">
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80" data-testid="notification-dropdown">
              <div className="flex items-center justify-between p-3 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Notifikasi</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    Tandai semua dibaca
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">Tidak ada notifikasi</div>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 border-b border-slate-50 last:border-0 ${!notif.is_read ? "bg-blue-50/50" : ""}`}
                      data-testid={`notification-item-${notif.id}`}
                    >
                      <div className="flex items-start gap-2">
                        {notif.type === "approved" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className="text-sm text-slate-700 leading-snug">{notif.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{new Date(notif.created_at).toLocaleDateString("id-ID")}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 hover:bg-slate-100" data-testid="profile-dropdown-trigger">
                <div className="w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[120px] truncate">
                  {user?.name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52" data-testid="profile-dropdown">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
                <div className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border mt-1 ${roleBadgeColors[user?.role] || ""}`}>
                  {roleLabels[user?.role]}
                </div>
              </div>
              <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="profile-menu-item">
                <User className="h-4 w-4" /> Profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-red-600 cursor-pointer" onClick={logout} data-testid="logout-button">
                <LogOut className="h-4 w-4" /> Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Full-width Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
