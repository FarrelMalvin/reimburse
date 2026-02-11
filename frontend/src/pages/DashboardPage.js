import { useState, useEffect } from "react";
import { useAuth, api } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt, MessageSquareWarning, CalendarDays, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

const roleDescriptions = {
  pegawai: "Kelola bon, pengaduan, cuti, dan inventaris Anda.",
  atasan: "Pantau dan setujui permintaan dari pegawai.",
  finance: "Kelola persetujuan keuangan dan bon.",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_bon: 0, pengaduan_aktif: 0, total_cuti: 0, total_inventaris: 0 });

  useEffect(() => {
    api.get("/dashboard/stats").then((res) => setStats(res.data)).catch(() => {});
  }, []);

  const statCards = [
    {
      title: user?.role === "pegawai" ? "Total Bon Saya" : user?.role === "atasan" ? "Bon Pending" : "Bon Menunggu",
      value: stats.total_bon,
      icon: Receipt,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      path: "/bon",
    },
    {
      title: user?.role === "pegawai" ? "Pengaduan Aktif" : "Pengaduan Masuk",
      value: stats.pengaduan_aktif,
      icon: MessageSquareWarning,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      path: "/pengaduan",
    },
    {
      title: user?.role === "pegawai" ? "Total Cuti" : "Permohonan Cuti",
      value: stats.total_cuti,
      icon: CalendarDays,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      path: "/cuti",
    },
    {
      title: "Inventaris",
      value: stats.total_inventaris,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      path: "/inventaris",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl" data-testid="dashboard-page">
      {/* Welcome */}
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Selamat Datang, {user?.name}
        </h1>
        <p className="text-slate-500 mt-1 text-sm md:text-base">
          {roleDescriptions[user?.role] || ""}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className={`bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group animate-fade-in stagger-${i + 1}`}
              onClick={() => navigate(card.path)}
              data-testid={`stat-card-${card.path.replace("/", "")}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.title}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {card.value}
                    </p>
                  </div>
                  <div className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Info */}
      <div className="animate-fade-in stagger-4">
        <Card className="bg-white border border-slate-100 rounded-xl shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Panduan Cepat
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {user?.role === "pegawai" && (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">1</span>
                    </div>
                    <p className="text-sm text-slate-600">Buat bon baru melalui menu <strong>Bon</strong> untuk mengajukan reimbursement.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">2</span>
                    </div>
                    <p className="text-sm text-slate-600">Pantau status bon Anda dan terima notifikasi jika ada perubahan.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">3</span>
                    </div>
                    <p className="text-sm text-slate-600">Gunakan menu lainnya untuk pengaduan, cuti, atau inventaris.</p>
                  </div>
                </>
              )}
              {user?.role === "atasan" && (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-amber-600 text-xs font-bold">1</span>
                    </div>
                    <p className="text-sm text-slate-600">Review bon yang diajukan pegawai pada menu <strong>Bon</strong>.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-amber-600 text-xs font-bold">2</span>
                    </div>
                    <p className="text-sm text-slate-600">Setujui atau tolak bon. Bon yang disetujui diteruskan ke Finance.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-amber-600 text-xs font-bold">3</span>
                    </div>
                    <p className="text-sm text-slate-600">Pantau pengaduan dan permohonan cuti pegawai.</p>
                  </div>
                </>
              )}
              {user?.role === "finance" && (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-emerald-600 text-xs font-bold">1</span>
                    </div>
                    <p className="text-sm text-slate-600">Review bon yang sudah disetujui atasan pada menu <strong>Bon</strong>.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-emerald-600 text-xs font-bold">2</span>
                    </div>
                    <p className="text-sm text-slate-600">Setujui bon untuk memproses pembayaran dan mencetak PDF.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-emerald-600 text-xs font-bold">3</span>
                    </div>
                    <p className="text-sm text-slate-600">Download PDF bon yang telah disetujui sebagai bukti pembayaran.</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
