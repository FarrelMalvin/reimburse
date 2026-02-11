import { useState, useEffect, useCallback } from "react";
import { api } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Package } from "lucide-react";

const kondisiConfig = {
  Baik: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Rusak: "border-red-200 bg-red-50 text-red-700",
  "Perlu Perbaikan": "border-amber-200 bg-amber-50 text-amber-700",
};

export default function InventarisPage() {
  const [items, setItems] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ nama: "", kategori: "", jumlah: "", kondisi: "", lokasi: "" });
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get("/inventaris");
      setItems(res.data);
    } catch {
      toast.error("Gagal memuat data inventaris");
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCreate = async () => {
    if (!form.nama || !form.kategori || !form.jumlah || !form.kondisi || !form.lokasi) {
      toast.error("Semua field wajib diisi");
      return;
    }
    setLoading(true);
    try {
      await api.post("/inventaris", { ...form, jumlah: parseInt(form.jumlah) });
      toast.success("Inventaris berhasil ditambahkan");
      setShowCreate(false);
      setForm({ nama: "", kategori: "", jumlah: "", kondisi: "", lokasi: "" });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menambahkan inventaris");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl" data-testid="inventaris-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Inventaris
          </h2>
          <p className="text-sm text-slate-500 mt-1">Kelola data inventaris kantor</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-slate-900 hover:bg-slate-800 gap-2" data-testid="create-inventaris-btn">
          <Plus className="h-4 w-4" /> Tambah Item
        </Button>
      </div>

      <Card className="border-slate-100 shadow-sm rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nama</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kategori</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Jumlah</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kondisi</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lokasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                    <Package className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p>Belum ada data inventaris</p>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="border-slate-50" data-testid={`inventaris-row-${item.id}`}>
                    <TableCell className="text-sm font-medium text-slate-900">{item.nama}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">{item.kategori}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-900">{item.jumlah}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={kondisiConfig[item.kondisi] || kondisiConfig.Baik}>
                        {item.kondisi}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{item.lokasi}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg" data-testid="create-inventaris-dialog">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tambah Inventaris</DialogTitle>
            <DialogDescription>Tambahkan item inventaris baru</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Item</Label>
              <Input placeholder="Nama item" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} data-testid="inventaris-nama-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={form.kategori} onValueChange={(val) => setForm({ ...form, kategori: val })}>
                  <SelectTrigger data-testid="inventaris-kategori-select">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Elektronik">Elektronik</SelectItem>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="ATK">ATK</SelectItem>
                    <SelectItem value="Kendaraan">Kendaraan</SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jumlah</Label>
                <Input type="number" placeholder="0" value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value })} data-testid="inventaris-jumlah-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kondisi</Label>
                <Select value={form.kondisi} onValueChange={(val) => setForm({ ...form, kondisi: val })}>
                  <SelectTrigger data-testid="inventaris-kondisi-select">
                    <SelectValue placeholder="Pilih kondisi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baik">Baik</SelectItem>
                    <SelectItem value="Perlu Perbaikan">Perlu Perbaikan</SelectItem>
                    <SelectItem value="Rusak">Rusak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lokasi</Label>
                <Input placeholder="Contoh: Lantai 2" value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} data-testid="inventaris-lokasi-input" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={loading} className="bg-slate-900 hover:bg-slate-800" data-testid="submit-inventaris-btn">
              {loading ? "Menambahkan..." : "Tambah Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
