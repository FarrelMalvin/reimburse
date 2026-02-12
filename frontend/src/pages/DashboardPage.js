import { useState, useEffect } from "react";
import { useAuth, api } from "@/App";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Receipt, MessageSquareWarning, CalendarDays, Package, ArrowRight, Clock, CheckCircle2, XCircle } from "lucide-react";

const statusBadge = {
  pending: { label: "Menunggu", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  approved_atasan: { label: "Disetujui Atasan", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  approved_finance: { label: "Disetujui Finance", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  declined: { label: "Ditolak", cls: "bg-red-50 text-red-700 border-red-200" },
  proses: { label: "Proses", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  selesai: { label: "Selesai", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  approved: { label: "Disetujui", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Ditolak", cls: "bg-red-50 text-red-700 border-red-200" },
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

function StatusDot({ status }) {
  const s = statusBadge[status] || statusBadge.pending;
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${s.cls}`}>
      {s.label}
    </Badge>
  );
}

function FeatureCard({ icon: Icon, title, subtitle, gradient, count, items, renderItem, emptyText, path, navigate, testId }) {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden cursor-pointer group"
      onClick={() => navigate(path)}
      data-testid={testId}
    >
      {/* Header */}
      <div className="p-5 pb-3 flex items-start gap-4">
        <div className={`w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300`}>
          <Icon className="h-7 w-7 text-white" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {title}
            </h3>
            {count > 0 && (
              <span className="text-xs font-bold bg-slate-900 text-white rounded-full w-6 h-6 flex items-center justify-center">
                {count}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-slate-100" />

      {/* Preview Content */}
      <div className="flex-1 p-5 pt-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Icon className="h-8 w-8 text-slate-200 mb-2" />
            <p className="text-sm text-slate-400">{emptyText}</p>
          </div>
        ) : (
          <div className="space-y-0">
            {items.slice(0, 4).map((item, idx) => (
              <div key={idx} className={`py-2.5 ${idx < Math.min(items.length, 4) - 1 ? "border-b border-slate-50" : ""}`}>
                {renderItem(item)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
        <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-900 transition-colors flex items-center gap-1">
          Lihat Semua <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  );
}

const roleSubtitles = {
  bon: { pegawai: "Bon reimbursement Anda", atasan: "Bon menunggu persetujuan", finance: "Bon menunggu finalisasi" },
  pengaduan: { pegawai: "Pengaduan & keluhan Anda", atasan: "Pengaduan dari pegawai", finance: "Semua pengaduan" },
  cuti: { pegawai: "Permohonan cuti Anda", atasan: "Permohonan cuti pegawai", finance: "Semua permohonan cuti" },
  inventaris: { pegawai: "Data inventaris kantor", atasan: "Data inventaris kantor", finance: "Data inventaris kantor" },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_bon: 0, pengaduan_aktif: 0, total_cuti: 0, total_inventaris: 0 });
  const [preview, setPreview] = useState({ bons: [], pengaduan: [], cuti: [], inventaris: [], bon_stats: { pending: 0, approved: 0, declined: 0 } });

  useEffect(() => {
    api.get("/dashboard/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/dashboard/preview").then((r) => setPreview(r.data)).catch(() => {});
  }, []);

  const role = user?.role || "pegawai";

  return (
    <div className="max-w-6xl mx-auto" data-testid="dashboard-page">
      {/* Welcome Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Selamat Datang, {user?.name}
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          {role === "pegawai" ? "Kelola bon, pengaduan, cuti, dan inventaris Anda." :
           role === "atasan" ? "Pantau dan setujui permintaan dari pegawai." :
           "Kelola persetujuan keuangan dan dokumen."}
        </p>
      </div>

      {/* Stat Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 animate-fade-in stagger-1">
        {[
          { label: "Pending", val: preview.bon_stats?.pending || 0, icon: Clock, color: "text-amber-600" },
          { label: "Disetujui", val: preview.bon_stats?.approved || 0, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Ditolak", val: preview.bon_stats?.declined || 0, icon: XCircle, color: "text-red-500" },
          { label: "Inventaris", val: stats.total_inventaris, icon: Package, color: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3">
            <s.icon className={`h-4 w-4 ${s.color}`} />
            <div>
              <p className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.val}</p>
              <p className="text-[11px] text-slate-400 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Cards Grid - Odoo Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in stagger-2">
        {/* Bon Card */}
        <FeatureCard
          icon={Receipt}
          title="Bon / Reimbursement"
          subtitle={roleSubtitles.bon[role]}
          gradient="bg-gradient-to-br from-orange-400 to-amber-500"
          count={stats.total_bon}
          items={preview.bons}
          emptyText="Belum ada data bon"
          path="/bon"
          navigate={navigate}
          testId="feature-card-bon"
          renderItem={(bon) => (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{bon.judul}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">{bon.user_name}</span>
                  <span className="text-xs text-slate-300">-</span>
                  <span className="text-xs font-medium text-slate-600">{formatCurrency(bon.jumlah)}</span>
                </div>
              </div>
              <StatusDot status={bon.status} />
            </div>
          )}
        />

        {/* Pengaduan Card */}
        <FeatureCard
          icon={MessageSquareWarning}
          title="Pengaduan"
          subtitle={roleSubtitles.pengaduan[role]}
          gradient="bg-gradient-to-br from-teal-400 to-emerald-500"
          count={stats.pengaduan_aktif}
          items={preview.pengaduan}
          emptyText="Belum ada pengaduan"
          path="/pengaduan"
          navigate={navigate}
          testId="feature-card-pengaduan"
          renderItem={(item) => (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{item.judul}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.user_name && <span className="text-xs text-slate-400">{item.user_name}</span>}
                  <span className="text-xs text-slate-300">-</span>
                  <span className="text-xs text-slate-500">{item.kategori}</span>
                </div>
              </div>
              <StatusDot status={item.status} />
            </div>
          )}
        />

        {/* Cuti Card */}
        <FeatureCard
          icon={CalendarDays}
          title="Cuti"
          subtitle={roleSubtitles.cuti[role]}
          gradient="bg-gradient-to-br from-blue-400 to-indigo-500"
          count={stats.total_cuti}
          items={preview.cuti}
          emptyText="Belum ada permohonan cuti"
          path="/cuti"
          navigate={navigate}
          testId="feature-card-cuti"
          renderItem={(item) => (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{item.jenis} - {item.alasan}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.user_name && <span className="text-xs text-slate-400">{item.user_name}</span>}
                  <span className="text-xs text-slate-300">-</span>
                  <span className="text-xs text-slate-500">{item.tanggal_mulai} s/d {item.tanggal_selesai}</span>
                </div>
              </div>
              <StatusDot status={item.status} />
            </div>
          )}
        />

        {/* Inventaris Card */}
        <FeatureCard
          icon={Package}
          title="Inventaris"
          subtitle={roleSubtitles.inventaris[role]}
          gradient="bg-gradient-to-br from-purple-400 to-violet-500"
          count={stats.total_inventaris}
          items={preview.inventaris}
          emptyText="Belum ada data inventaris"
          path="/inventaris"
          navigate={navigate}
          testId="feature-card-inventaris"
          renderItem={(item) => (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{item.nama}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500">{item.kategori}</span>
                  <span className="text-xs text-slate-300">-</span>
                  <span className="text-xs text-slate-500">Qty: {item.jumlah}</span>
                </div>
              </div>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                item.kondisi === "Baik" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                item.kondisi === "Rusak" ? "bg-red-50 text-red-700 border-red-200" :
                "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {item.kondisi}
              </Badge>
            </div>
          )}
        />
      </div>
    </div>
  );
}
