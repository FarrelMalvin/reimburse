import { useState, useEffect, useCallback } from "react";
import { useAuth, api } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus,
  UploadCloud,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Download,
  Eye,
  Receipt,
  Image as ImageIcon,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const statusConfig = {
  pending: { label: "Menunggu", className: "border-amber-200 bg-amber-50 text-amber-700" },
  approved_atasan: { label: "Disetujui Atasan", className: "border-blue-200 bg-blue-50 text-blue-700" },
  approved_finance: { label: "Disetujui Finance", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  declined: { label: "Ditolak", className: "border-red-200 bg-red-50 text-red-700" },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig.pending;
  return (
    <Badge variant="outline" className={cfg.className} data-testid={`status-badge-${status}`}>
      {cfg.label}
    </Badge>
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

// --- Pegawai View ---
function PegawaiBonView() {
  const [bons, setBons] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showResubmit, setShowResubmit] = useState(null);
  const [showPhoto, setShowPhoto] = useState(null);
  const [form, setForm] = useState({ judul: "", deskripsi: "", jumlah: "", foto: null });
  const [fotoPreview, setFotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBons = useCallback(async () => {
    try {
      const res = await api.get("/bon");
      setBons(res.data);
    } catch {
      toast.error("Gagal memuat data bon");
    }
  }, []);

  useEffect(() => { fetchBons(); }, [fetchBons]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, foto: reader.result }));
      setFotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!form.judul || !form.deskripsi || !form.jumlah) {
      toast.error("Semua field wajib diisi");
      return;
    }
    setLoading(true);
    try {
      await api.post("/bon", {
        judul: form.judul,
        deskripsi: form.deskripsi,
        jumlah: parseFloat(form.jumlah),
        foto: form.foto,
      });
      toast.success("Bon berhasil dibuat");
      setShowCreate(false);
      setForm({ judul: "", deskripsi: "", jumlah: "", foto: null });
      setFotoPreview(null);
      fetchBons();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal membuat bon");
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async (bonId) => {
    try {
      await api.put(`/bon/${bonId}/resubmit`);
      toast.success("Bon berhasil diajukan ulang");
      setShowResubmit(null);
      fetchBons();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal mengajukan ulang");
    }
  };

  const handleDownloadPdf = async (bonId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/bon/${bonId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bon-${bonId.slice(0, 8)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh PDF");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Bon Saya
          </h2>
          <p className="text-sm text-slate-500 mt-1">Ajukan dan pantau bon reimbursement Anda</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-slate-900 hover:bg-slate-800 gap-2" data-testid="create-bon-btn">
          <Plus className="h-4 w-4" /> Buat Bon
        </Button>
      </div>

      {/* Bon Table */}
      <Card className="border-slate-100 shadow-sm rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Judul</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Jumlah</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tanggal</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                    <Receipt className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p>Belum ada bon. Buat bon pertama Anda!</p>
                  </TableCell>
                </TableRow>
              ) : (
                bons.map((bon) => (
                  <TableRow key={bon.id} className="border-slate-50" data-testid={`bon-row-${bon.id}`}>
                    <TableCell>
                      <p className="font-medium text-slate-900 text-sm">{bon.judul}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{bon.deskripsi}</p>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-900">{formatCurrency(bon.jumlah)}</TableCell>
                    <TableCell>
                      <StatusBadge status={bon.status} />
                      {bon.status === "declined" && bon.decline_reason && (
                        <p className="text-xs text-red-500 mt-1">Alasan: {bon.decline_reason}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{new Date(bon.created_at).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {bon.foto && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPhoto(bon.foto)} data-testid={`view-photo-${bon.id}`}>
                            <Eye className="h-4 w-4 text-slate-500" />
                          </Button>
                        )}
                        {bon.status === "declined" && (
                          <Button variant="ghost" size="sm" className="h-8 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setShowResubmit(bon)} data-testid={`resubmit-btn-${bon.id}`}>
                            <RotateCcw className="h-3.5 w-3.5" /> Ajukan Ulang
                          </Button>
                        )}
                        {bon.status === "approved_finance" && (
                          <Button variant="ghost" size="sm" className="h-8 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleDownloadPdf(bon.id)} data-testid={`download-pdf-${bon.id}`}>
                            <Download className="h-3.5 w-3.5" /> PDF
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg" data-testid="create-bon-dialog">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Buat Bon Baru</DialogTitle>
            <DialogDescription>Isi detail bon reimbursement Anda</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input placeholder="Contoh: Biaya Transport Meeting" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} data-testid="bon-judul-input" />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea placeholder="Jelaskan detail bon..." value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={3} data-testid="bon-deskripsi-input" />
            </div>
            <div className="space-y-2">
              <Label>Jumlah (Rp)</Label>
              <Input type="number" placeholder="0" value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value })} data-testid="bon-jumlah-input" />
            </div>
            <div className="space-y-2">
              <Label>Foto Bukti (Opsional)</Label>
              <label className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2" data-testid="bon-foto-upload">
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Preview" className="max-h-32 rounded-lg object-contain" />
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-slate-400" />
                    <p className="text-sm text-slate-500">Klik untuk upload foto</p>
                    <p className="text-xs text-slate-400">PNG, JPG hingga 5MB</p>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} data-testid="cancel-create-bon">Batal</Button>
            <Button onClick={handleCreate} disabled={loading} className="bg-slate-900 hover:bg-slate-800" data-testid="submit-bon-btn">
              {loading ? "Membuat..." : "Buat Bon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resubmit Dialog */}
      <Dialog open={!!showResubmit} onOpenChange={() => setShowResubmit(null)}>
        <DialogContent data-testid="resubmit-dialog">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Ajukan Ulang Bon?</DialogTitle>
            <DialogDescription>
              Bon <strong>{showResubmit?.judul}</strong> telah ditolak dengan alasan: <em>{showResubmit?.decline_reason}</em>
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-slate-600">Apakah Anda ingin mengajukan ulang bon ini? Status akan kembali menjadi &quot;Menunggu&quot;.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResubmit(null)} data-testid="cancel-resubmit">Tidak</Button>
            <Button onClick={() => handleResubmit(showResubmit?.id)} className="bg-blue-600 hover:bg-blue-700" data-testid="confirm-resubmit">
              Ya, Ajukan Ulang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Preview Dialog */}
      <Dialog open={!!showPhoto} onOpenChange={() => setShowPhoto(null)}>
        <DialogContent className="sm:max-w-md" data-testid="photo-preview-dialog">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Foto Bukti</DialogTitle>
          </DialogHeader>
          {showPhoto && <img src={showPhoto} alt="Bukti" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Atasan View ---
function AtasanBonView() {
  const [bons, setBons] = useState([]);
  const [showDecline, setShowDecline] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [showPhoto, setShowPhoto] = useState(null);

  const fetchBons = useCallback(async () => {
    try {
      const res = await api.get("/bon");
      setBons(res.data);
    } catch {
      toast.error("Gagal memuat data bon");
    }
  }, []);

  useEffect(() => { fetchBons(); }, [fetchBons]);

  const pendingBons = bons.filter((b) => b.status === "pending");
  const otherBons = bons.filter((b) => b.status !== "pending");

  const handleApprove = async (bonId) => {
    try {
      await api.put(`/bon/${bonId}/approve`);
      toast.success("Bon disetujui dan diteruskan ke Finance");
      fetchBons();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menyetujui bon");
    }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }
    try {
      await api.put(`/bon/${showDecline.id}/decline`, { reason: declineReason });
      toast.success("Bon ditolak");
      setShowDecline(null);
      setDeclineReason("");
      fetchBons();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menolak bon");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Persetujuan Bon
        </h2>
        <p className="text-sm text-slate-500 mt-1">Review dan setujui bon dari pegawai</p>
      </div>

      {/* Pending */}
      <Card className="border-slate-100 shadow-sm rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Menunggu Persetujuan
            {pendingBons.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">{pendingBons.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pemohon</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Judul</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Jumlah</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tanggal</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingBons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                    Tidak ada bon yang menunggu persetujuan
                  </TableCell>
                </TableRow>
              ) : (
                pendingBons.map((bon) => (
                  <TableRow key={bon.id} className="border-slate-50" data-testid={`approval-row-${bon.id}`}>
                    <TableCell className="text-sm font-medium text-slate-900">{bon.user_name}</TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-900">{bon.judul}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{bon.deskripsi}</p>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-900">{formatCurrency(bon.jumlah)}</TableCell>
                    <TableCell className="text-sm text-slate-500">{new Date(bon.created_at).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {bon.foto && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPhoto(bon.foto)} data-testid={`view-photo-atasan-${bon.id}`}>
                            <ImageIcon className="h-4 w-4 text-slate-400" />
                          </Button>
                        )}
                        <Button size="sm" className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApprove(bon.id)} data-testid={`approve-btn-${bon.id}`}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Setujui
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 gap-1 text-red-600 hover:bg-red-50" onClick={() => setShowDecline(bon)} data-testid={`decline-btn-${bon.id}`}>
                          <XCircle className="h-3.5 w-3.5" /> Tolak
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* History */}
      {otherBons.length > 0 && (
        <Card className="border-slate-100 shadow-sm rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Riwayat</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pemohon</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Judul</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Jumlah</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherBons.map((bon) => (
                  <TableRow key={bon.id} className="border-slate-50">
                    <TableCell className="text-sm text-slate-900">{bon.user_name}</TableCell>
                    <TableCell className="text-sm text-slate-900">{bon.judul}</TableCell>
                    <TableCell className="text-sm font-medium text-slate-900">{formatCurrency(bon.jumlah)}</TableCell>
                    <TableCell><StatusBadge status={bon.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Decline Dialog */}
      <Dialog open={!!showDecline} onOpenChange={() => { setShowDecline(null); setDeclineReason(""); }}>
        <DialogContent data-testid="decline-dialog">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tolak Bon</DialogTitle>
            <DialogDescription>Berikan alasan penolakan untuk bon <strong>{showDecline?.judul}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Alasan Penolakan</Label>
            <Textarea placeholder="Masukkan alasan penolakan..." value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} data-testid="decline-reason-input" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDecline(null); setDeclineReason(""); }} data-testid="cancel-decline">Batal</Button>
            <Button onClick={handleDecline} className="bg-red-600 hover:bg-red-700 text-white" data-testid="confirm-decline">Tolak Bon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Dialog */}
      <Dialog open={!!showPhoto} onOpenChange={() => setShowPhoto(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Foto Bukti</DialogTitle>
          </DialogHeader>
          {showPhoto && <img src={showPhoto} alt="Bukti" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Finance View ---
function FinanceBonView() {
  const [bons, setBons] = useState([]);
  const [showDecline, setShowDecline] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [showPhoto, setShowPhoto] = useState(null);

  const fetchBons = useCallback(async () => {
    try {
      const res = await api.get("/bon");
      setBons(res.data);
    } catch {
      toast.error("Gagal memuat data bon");
    }
  }, []);

  useEffect(() => { fetchBons(); }, [fetchBons]);

  const waitingBons = bons.filter((b) => b.status === "approved_atasan");
  const otherBons = bons.filter((b) => b.status !== "approved_atasan");

  const handleApprove = async (bonId) => {
    try {
      await api.put(`/bon/${bonId}/approve`);
      toast.success("Bon disetujui! PDF siap diunduh.");
      fetchBons();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menyetujui bon");
    }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }
    try {
      await api.put(`/bon/${showDecline.id}/decline`, { reason: declineReason });
      toast.success("Bon ditolak");
      setShowDecline(null);
      setDeclineReason("");
      fetchBons();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menolak bon");
    }
  };

  const handleDownloadPdf = async (bonId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/bon/${bonId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bon-${bonId.slice(0, 8)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh PDF");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Finalisasi Bon
        </h2>
        <p className="text-sm text-slate-500 mt-1">Review bon yang sudah disetujui atasan</p>
      </div>

      {/* Waiting */}
      <Card className="border-slate-100 shadow-sm rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Menunggu Finalisasi
            {waitingBons.length > 0 && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">{waitingBons.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pemohon</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Judul</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Jumlah</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tanggal</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {waitingBons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                    Tidak ada bon yang menunggu finalisasi
                  </TableCell>
                </TableRow>
              ) : (
                waitingBons.map((bon) => (
                  <TableRow key={bon.id} className="border-slate-50" data-testid={`finance-row-${bon.id}`}>
                    <TableCell className="text-sm font-medium text-slate-900">{bon.user_name}</TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-900">{bon.judul}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{bon.deskripsi}</p>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-900">{formatCurrency(bon.jumlah)}</TableCell>
                    <TableCell className="text-sm text-slate-500">{new Date(bon.created_at).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {bon.foto && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPhoto(bon.foto)} data-testid={`view-photo-finance-${bon.id}`}>
                            <ImageIcon className="h-4 w-4 text-slate-400" />
                          </Button>
                        )}
                        <Button size="sm" className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApprove(bon.id)} data-testid={`finance-approve-btn-${bon.id}`}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Setujui
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 gap-1 text-red-600 hover:bg-red-50" onClick={() => setShowDecline(bon)} data-testid={`finance-decline-btn-${bon.id}`}>
                          <XCircle className="h-3.5 w-3.5" /> Tolak
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* History */}
      {otherBons.length > 0 && (
        <Card className="border-slate-100 shadow-sm rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Riwayat</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pemohon</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Judul</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Jumlah</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherBons.map((bon) => (
                  <TableRow key={bon.id} className="border-slate-50">
                    <TableCell className="text-sm text-slate-900">{bon.user_name}</TableCell>
                    <TableCell className="text-sm text-slate-900">{bon.judul}</TableCell>
                    <TableCell className="text-sm font-medium text-slate-900">{formatCurrency(bon.jumlah)}</TableCell>
                    <TableCell><StatusBadge status={bon.status} /></TableCell>
                    <TableCell>
                      {bon.status === "approved_finance" && (
                        <Button size="sm" variant="ghost" className="h-8 gap-1 text-emerald-600 hover:bg-emerald-50" onClick={() => handleDownloadPdf(bon.id)} data-testid={`finance-download-pdf-${bon.id}`}>
                          <Download className="h-3.5 w-3.5" /> PDF
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Decline Dialog */}
      <Dialog open={!!showDecline} onOpenChange={() => { setShowDecline(null); setDeclineReason(""); }}>
        <DialogContent data-testid="finance-decline-dialog">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tolak Bon</DialogTitle>
            <DialogDescription>Berikan alasan penolakan untuk bon <strong>{showDecline?.judul}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Alasan Penolakan</Label>
            <Textarea placeholder="Masukkan alasan penolakan..." value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} data-testid="finance-decline-reason-input" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDecline(null); setDeclineReason(""); }}>Batal</Button>
            <Button onClick={handleDecline} className="bg-red-600 hover:bg-red-700 text-white" data-testid="finance-confirm-decline">Tolak Bon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Dialog */}
      <Dialog open={!!showPhoto} onOpenChange={() => setShowPhoto(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Foto Bukti</DialogTitle>
          </DialogHeader>
          {showPhoto && <img src={showPhoto} alt="Bukti" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Main Bon Page ---
export default function BonPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl" data-testid="bon-page">
      {user?.role === "pegawai" && <PegawaiBonView />}
      {user?.role === "atasan" && <AtasanBonView />}
      {user?.role === "finance" && <FinanceBonView />}
    </div>
  );
}
