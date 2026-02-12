import { useAuth } from "@/App";
import { useNavigate } from "react-router-dom";
import { Receipt, MessageSquareWarning, CalendarDays, Package } from "lucide-react";

const appItems = [
  { path: "/bon", label: "Bon", icon: Receipt, gradient: "from-orange-400 to-amber-500" },
  { path: "/pengaduan", label: "Pengaduan", icon: MessageSquareWarning, gradient: "from-teal-400 to-emerald-500" },
  { path: "/cuti", label: "Cuti", icon: CalendarDays, gradient: "from-blue-400 to-indigo-500" },
  { path: "/inventaris", label: "Inventaris", icon: Package, gradient: "from-purple-400 to-violet-500" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]" data-testid="dashboard-page">
      {/* Welcome */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Selamat Datang, {user?.name}
        </h1>
        <p className="text-slate-400 mt-2 text-sm">Pilih fitur untuk memulai</p>
      </div>

      {/* App Grid - Odoo Style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8 animate-fade-in stagger-1">
        {appItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-3 group outline-none"
              data-testid={`app-icon-${item.label.toLowerCase()}`}
            >
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:scale-105 group-active:scale-95 transition-all duration-200`}>
                <Icon className="h-9 w-9 md:h-11 md:w-11 text-white" strokeWidth={1.6} />
              </div>
              <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
