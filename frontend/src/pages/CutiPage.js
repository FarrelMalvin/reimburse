import { useState, useEffect, useCallback } from "react";
import { useAuth, api } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, CalendarDays } from "lucide-react";

const statusConfig = {
  pending: { label: "Menunggu", className: "border-amber-200 bg-amber-50 text-amber-700" },
  approved: { label: "Disetujui", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  rejected: { label: "Ditolak", className: "border-red-200 bg-red-50 text-red-700" },
};

export default function CutiPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ tanggal_mulai: "", tanggal_selesai: "", jenis: "", alasan: "" });
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get("/cuti");
      setItems(res.data);
    } catch {
      toast.error("Gagal memuat data cuti");
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCreate = async () => {
    if (!form.tanggal_mulai || !form.tanggal_selesai || !form.jenis || !form.alasan) {
      toast.error("Semua field wajib diisi");
      return;
    }
    setLoading(true);
    try {
      await api.post("/cuti", form);
      toast.success("Permohonan cuti berhasil dibuat");
      setShowCreate(false);
      setForm({ tanggal_mulai: "", tanggal_selesai: "", jenis: "", alasan: "" });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal membuat permohonan cuti");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl" data-testid="cuti-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Cuti
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {user?.role === "pegawai" ? "Ajukan dan pantau permohonan cuti Anda" : "Daftar permohonan cuti pegawai"}
          </p>
        </div>
        {user?.role === "pegawai" && (
          <Button onClick={() => setShowCreate(true)} className="bg-slate-900 hover:bg-slate-800 gap-2" data-testid="create-cuti-btn">
            <Plus className="h-4 w-4" /> Ajukan Cuti
          </Button>
        )}
      </div>

      <Card className="border-slate-100 shadow-sm rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100">
                {user?.role !== "pegawai" && <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pegawai</TableHead>}
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Jenis</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tanggal Mulai</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tanggal Selesai</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Alasan</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={user?.role !== "pegawai" ? 6 : 5} className="text-center py-12 text-slate-400">
                    <CalendarDays className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p>Belum ada permohonan cuti</p>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="border-slate-50" data-testid={`cuti-row-${item.id}`}>
                    {user?.role !== "pegawai" && <TableCell className="text-sm text-slate-900">{item.user_name}</TableCell>}
                    <TableCell>
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">{item.jenis}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">{item.tanggal_mulai}</TableCell>
                    <TableCell className="text-sm text-slate-700">{item.tanggal_selesai}</TableCell>
                    <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">{item.alasan}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusConfig[item.status]?.className || statusConfig.pending.className}>
                        {statusConfig[item.status]?.label || item.status}
                      </Badge>
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
        <DialogContent className="sm:max-w-lg" data-testid="create-cuti-dialog">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Ajukan Cuti</DialogTitle>
            <DialogDescription>Isi form untuk mengajukan permohonan cuti</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Jenis Cuti</Label>
              <Select value={form.jenis} onValueChange={(val) => setForm({ ...form, jenis: val })}>
                <SelectTrigger data-testid="cuti-jenis-select">
                  <SelectValue placeholder="Pilih jenis cuti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tahunan">Cuti Tahunan</SelectItem>
                  <SelectItem value="Sakit">Cuti Sakit</SelectItem>
                  <SelectItem value="Penting">Keperluan Penting</SelectItem>
                  <SelectItem value="Melahirkan">Cuti Melahirkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input type="date" value={form.tanggal_mulai} onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })} data-testid="cuti-mulai-input" />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Selesai</Label>
                <Input type="date" value={form.tanggal_selesai} onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })} data-testid="cuti-selesai-input" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alasan</Label>
              <Textarea placeholder="Jelaskan alasan cuti..." value={form.alasan} onChange={(e) => setForm({ ...form, alasan: e.target.value })} rows={3} data-testid="cuti-alasan-input" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={loading} className="bg-slate-900 hover:bg-slate-800" data-testid="submit-cuti-btn">
              {loading ? "Mengajukan..." : "Ajukan Cuti"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
