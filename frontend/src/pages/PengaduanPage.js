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
import { Plus, MessageSquareWarning } from "lucide-react";

const statusConfig = {
  pending: { label: "Pending", className: "border-amber-200 bg-amber-50 text-amber-700" },
  proses: { label: "Proses", className: "border-blue-200 bg-blue-50 text-blue-700" },
  selesai: { label: "Selesai", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
};

export default function PengaduanPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ judul: "", deskripsi: "", kategori: "" });
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get("/pengaduan");
      setItems(res.data);
    } catch {
      toast.error("Gagal memuat data pengaduan");
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCreate = async () => {
    if (!form.judul || !form.deskripsi || !form.kategori) {
      toast.error("Semua field wajib diisi");
      return;
    }
    setLoading(true);
    try {
      await api.post("/pengaduan", form);
      toast.success("Pengaduan berhasil dibuat");
      setShowCreate(false);
      setForm({ judul: "", deskripsi: "", kategori: "" });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal membuat pengaduan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl" data-testid="pengaduan-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Pengaduan
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {user?.role === "pegawai" ? "Buat dan pantau pengaduan Anda" : "Daftar pengaduan dari pegawai"}
          </p>
        </div>
        {user?.role === "pegawai" && (
          <Button onClick={() => setShowCreate(true)} className="bg-slate-900 hover:bg-slate-800 gap-2" data-testid="create-pengaduan-btn">
            <Plus className="h-4 w-4" /> Buat Pengaduan
          </Button>
        )}
      </div>

      <Card className="border-slate-100 shadow-sm rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100">
                {user?.role !== "pegawai" && <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pegawai</TableHead>}
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Judul</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kategori</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={user?.role !== "pegawai" ? 5 : 4} className="text-center py-12 text-slate-400">
                    <MessageSquareWarning className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p>Belum ada pengaduan</p>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="border-slate-50" data-testid={`pengaduan-row-${item.id}`}>
                    {user?.role !== "pegawai" && <TableCell className="text-sm text-slate-900">{item.user_name}</TableCell>}
                    <TableCell>
                      <p className="text-sm font-medium text-slate-900">{item.judul}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{item.deskripsi}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">{item.kategori}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusConfig[item.status]?.className || statusConfig.pending.className}>
                        {statusConfig[item.status]?.label || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{new Date(item.created_at).toLocaleDateString("id-ID")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg" data-testid="create-pengaduan-dialog">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Buat Pengaduan Baru</DialogTitle>
            <DialogDescription>Sampaikan pengaduan atau keluhan Anda</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input placeholder="Judul pengaduan" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} data-testid="pengaduan-judul-input" />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={form.kategori} onValueChange={(val) => setForm({ ...form, kategori: val })}>
                <SelectTrigger data-testid="pengaduan-kategori-select">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fasilitas">Fasilitas</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="SDM">SDM</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea placeholder="Jelaskan pengaduan Anda..." value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={4} data-testid="pengaduan-deskripsi-input" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={loading} className="bg-slate-900 hover:bg-slate-800" data-testid="submit-pengaduan-btn">
              {loading ? "Membuat..." : "Kirim Pengaduan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
