import { useState, useEffect, useCallback } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth, api } from "@/App";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Receipt,
  MessageSquareWarning,
  CalendarDays,
  Package,
  Bell,
  LogOut,
  User,
  Menu,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/bon", label: "Bon", icon: Receipt },
  { path: "/pengaduan", label: "Pengaduan", icon: MessageSquareWarning },
  { path: "/cuti", label: "Cuti", icon: CalendarDays },
  { path: "/inventaris", label: "Inventaris", icon: Package },
];

const roleLabels = {
  pegawai: "Pegawai",
  atasan: "Atasan",
  finance: "Finance",
};

const roleBadgeColors = {
  pegawai: "bg-blue-50 text-blue-700 border-blue-200",
  atasan: "bg-amber-50 text-amber-700 border-amber-200",
  finance: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function SidebarContent({ onNavigate }) {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>K</span>
          </div>
          <div>
            <span className="text-slate-900 font-bold text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>KantorPlus</span>
            <div className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md border inline-block ml-2 ${roleBadgeColors[user?.role] || ""}`}>
              {roleLabels[user?.role] || user?.role}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1" data-testid="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              data-testid={`nav-${item.label.toLowerCase()}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-[18px] w-[18px] ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} />
              {item.label}
              {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <p className="text-[11px] text-slate-400 text-center">KantorPlus v1.0</p>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch {
      // silent
    }
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
    } catch {
      // silent
    }
  };

  return (
    <div className="flex h-screen bg-slate-50" data-testid="dashboard-layout">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 flex-col bg-white border-r border-slate-100 shrink-0">
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-8 shrink-0" data-testid="topbar">
          {/* Mobile menu */}
          <div className="lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" data-testid="mobile-menu-btn">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden lg:block" />

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9" data-testid="notification-bell">
                  <Bell className="h-[18px] w-[18px] text-slate-500" />
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

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-9 px-2" data-testid="profile-dropdown-trigger">
                  <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-slate-900 leading-none">{user?.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{roleLabels[user?.role]}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" data-testid="profile-dropdown">
                <DropdownMenuItem className="gap-2" data-testid="profile-menu-item">
                  <User className="h-4 w-4" /> Profil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-red-600" onClick={logout} data-testid="logout-button">
                  <LogOut className="h-4 w-4" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
