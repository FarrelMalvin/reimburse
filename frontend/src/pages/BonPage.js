import { useState, useEffect, useCallback } from "react";
import { useAuth, api } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, CheckCircle2, XCircle, RotateCcw, Download, Trash2, UploadCloud, FileText } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const statusCfg = {
  pending: { label: "Menunggu Atasan", cls: "border-amber-200 bg-amber-50 text-amber-700" },
  approved_atasan: { label: "Disetujui Atasan", cls: "border-blue-200 bg-blue-50 text-blue-700" },
  approved_hrga: { label: "Disetujui HRGA", cls: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  approved_direktur: { label: "Disetujui Direktur", cls: "border-purple-200 bg-purple-50 text-purple-700" },
  approved_finance: { label: "Disetujui Finance", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  declined: { label: "Ditolak", cls: "border-red-200 bg-red-50 text-red-700" },
};
function StatusBadge({ status }) {
  const c = statusCfg[status] || statusCfg.pending;
  return <Badge variant="outline" className={c.cls} data-testid={`status-${status}`}>{c.label}</Badge>;
}
function fmt(n) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n); }

// ===================== PEGAWAI VIEW =====================
function PegawaiView() {
  const [tab, setTab] = useState("bon");
  const [bons, setBons] = useState([]);
  const [realisasi, setRealisasi] = useState([]);
  const [approvedBons, setApprovedBons] = useState([]);
  const [showCreateBon, setShowCreateBon] = useState(false);
  const [showCreateReal, setShowCreateReal] = useState(false);
  const [showResubmit, setShowResubmit] = useState(null);
  const [bonForm, setBonForm] = useState({ 
    nik: "", jabatan: "", wilayah: "", tujuan: "", periode_mulai: "", periode_selesai: "", keperluan: "",
    akomodasi_kota: "", akomodasi_hotel: "", akomodasi_checkin: "", akomodasi_checkout: "", akomodasi_harga: "", akomodasi_bayar: "Head Office", 
    trans_berangkat_jenis: "", trans_berangkat_dari: "", trans_berangkat_ke: "", trans_berangkat_jam: "", 
    trans_kembali_jenis: "", trans_kembali_dari: "", trans_kembali_ke: "", trans_kembali_jam: "", 
    foto: null,
    estimasi_items: [{ kategori: "konsumsi", uraian: "", quantity: 1, jumlah: 0 }]
  });
  const [realForm, setRealForm] = useState({ bon_sementara_id: "", periode: "", items: [{ tanggal: "", uraian: "", quantity: 1, harga_per_unit: 0, total: 0 }], bukti_transfer: null });
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [b, r, a] = await Promise.all([api.get("/bon-sementara"), api.get("/realisasi"), api.get("/bon-sementara-approved")]);
      setBons(b.data); setRealisasi(r.data); setApprovedBons(a.data);
    } catch { toast.error("Gagal memuat data"); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFileChange = (e, setter, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(prev => ({ ...prev, [field]: reader.result }));
    reader.readAsDataURL(file);
  };

  // Estimasi biaya custom - calculate total
  const calcEstimasiTotal = () => {
    return bonForm.estimasi_items.reduce((sum, item) => sum + (parseFloat(item.jumlah) || 0), 0);
  };
  
  const addEstimasiItem = () => {
    setBonForm(p => ({ ...p, estimasi_items: [...p.estimasi_items, { kategori: "konsumsi", uraian: "", quantity: 1, jumlah: 0 }] }));
  };
  
  const removeEstimasiItem = (idx) => {
    setBonForm(p => ({ ...p, estimasi_items: p.estimasi_items.filter((_, i) => i !== idx) }));
  };
  
  const updateEstimasiItem = (idx, field, val) => {
    setBonForm(p => {
      const items = [...p.estimasi_items];
      items[idx] = { ...items[idx], [field]: field === 'jumlah' ? (parseFloat(val) || 0) : val };
      return { ...p, estimasi_items: items };
    });
  };

  const submitBon = async () => {
    if (!bonForm.tujuan || !bonForm.periode_mulai || !bonForm.periode_selesai || !bonForm.keperluan) {
      toast.error("Field wajib belum diisi"); return;
    }
    setLoading(true);
    try {
      const total = calcEstimasiTotal();
      await api.post("/bon-sementara", {
        nik: bonForm.nik, jabatan: bonForm.jabatan, wilayah: bonForm.wilayah, tujuan: bonForm.tujuan,
        periode_mulai: bonForm.periode_mulai, periode_selesai: bonForm.periode_selesai, keperluan: bonForm.keperluan,
        jumlah: total,
        akomodasi: { kota_tujuan: bonForm.akomodasi_kota, nama_hotel: bonForm.akomodasi_hotel, check_in: bonForm.akomodasi_checkin, check_out: bonForm.akomodasi_checkout, harga_per_malam: parseFloat(bonForm.akomodasi_harga) || 0, pembayaran: bonForm.akomodasi_bayar },
        transportasi_berangkat: { jenis: bonForm.trans_berangkat_jenis, dari_kota: bonForm.trans_berangkat_dari, ke_kota: bonForm.trans_berangkat_ke, jam_berangkat: bonForm.trans_berangkat_jam },
        transportasi_kembali: { jenis: bonForm.trans_kembali_jenis, dari_kota: bonForm.trans_kembali_dari, ke_kota: bonForm.trans_kembali_ke, jam_berangkat: bonForm.trans_kembali_jam },
        estimasi_items: bonForm.estimasi_items,
        foto: bonForm.foto,
      });
      toast.success("Perjalanan Dinas berhasil diajukan");
      setShowCreateBon(false);
      setBonForm({ 
        nik: "", jabatan: "", wilayah: "", tujuan: "", periode_mulai: "", periode_selesai: "", keperluan: "",
        akomodasi_kota: "", akomodasi_hotel: "", akomodasi_checkin: "", akomodasi_checkout: "", akomodasi_harga: "", akomodasi_bayar: "Head Office", 
        trans_berangkat_jenis: "", trans_berangkat_dari: "", trans_berangkat_ke: "", trans_berangkat_jam: "", 
        trans_kembali_jenis: "", trans_kembali_dari: "", trans_kembali_ke: "", trans_kembali_jam: "", 
        foto: null,
        estimasi_items: [{ uraian: "Biaya Konsumsi", jumlah: 0 }]
      });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || "Gagal"); } finally { setLoading(false); }
  };

  const addRealItem = () => setRealForm(p => ({ ...p, items: [...p.items, { tanggal: "", uraian: "", quantity: 1, harga_per_unit: 0, total: 0 }] }));
  const removeRealItem = (idx) => setRealForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  const updateRealItem = (idx, field, val) => {
    setRealForm(p => {
      const items = [...p.items];
      items[idx] = { ...items[idx], [field]: val };
      if (field === "quantity" || field === "harga_per_unit") {
        items[idx].total = (parseFloat(items[idx].quantity) || 0) * (parseFloat(items[idx].harga_per_unit) || 0);
      }
      return { ...p, items };
    });
  };

  const submitRealisasi = async () => {
    if (!realForm.bon_sementara_id || !realForm.periode || realForm.items.length === 0) {
      toast.error("Lengkapi form realisasi"); return;
    }
    setLoading(true);
    try {
      await api.post("/realisasi", { bon_sementara_id: realForm.bon_sementara_id, periode: realForm.periode, items: realForm.items.map(i => ({ ...i, quantity: parseInt(i.quantity) || 1, harga_per_unit: parseFloat(i.harga_per_unit) || 0, total: parseFloat(i.total) || 0 })), bukti_transfer: realForm.bukti_transfer });
      toast.success("Realisasi berhasil diajukan");
      setShowCreateReal(false);
      setRealForm({ bon_sementara_id: "", periode: "", items: [{ tanggal: "", uraian: "", quantity: 1, harga_per_unit: 0, total: 0 }], bukti_transfer: null });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || "Gagal"); } finally { setLoading(false); }
  };

  const handleResubmit = async (id, type) => {
    try {
      await api.put(`/${type}/${id}/resubmit`);
      toast.success("Diajukan ulang"); setShowResubmit(null); fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || "Gagal"); }
  };

  const downloadPdf = async (id, type, name, endpoint = "/pdf") => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/${type}/${id}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${name}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error("Gagal download PDF"); }
  };

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList data-testid="bon-tabs">
            <TabsTrigger value="bon" data-testid="tab-bon-sementara">Perjalanan Dinas</TabsTrigger>
            <TabsTrigger value="realisasi" data-testid="tab-realisasi">Realisasi Bon</TabsTrigger>
          </TabsList>
          {tab === "bon" && (
            <Button onClick={() => setShowCreateBon(true)} className="bg-slate-900 hover:bg-slate-800 gap-2" data-testid="create-bon-btn"><Plus className="h-4 w-4" /> Ajukan Perjalanan Dinas</Button>
          )}
          {tab === "realisasi" && (
            <Button onClick={() => setShowCreateReal(true)} className="bg-slate-900 hover:bg-slate-800 gap-2" data-testid="create-realisasi-btn"><Plus className="h-4 w-4" /> Buat Realisasi</Button>
          )}
        </div>

        {/* PERJALANAN DINAS TABLE */}
        <TabsContent value="bon">
          <Card className="border-slate-100 shadow-sm rounded-xl"><CardContent className="p-0">
            <Table><TableHeader><TableRow className="border-slate-100">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">No. Dokumen</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tujuan</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Keperluan</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Jumlah</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {bons.length === 0 ? (<TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">Belum ada pengajuan perjalanan dinas</TableCell></TableRow>) :
              bons.map(b => (
                <TableRow key={b.id} className="border-slate-50" data-testid={`bon-row-${b.id}`}>
                  <TableCell className="text-sm font-mono text-slate-700">{b.no_bon}</TableCell>
                  <TableCell className="text-sm text-slate-900">{b.tujuan}</TableCell>
                  <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">{b.keperluan}</TableCell>
                  <TableCell className="text-sm font-medium text-slate-900">{fmt(b.jumlah)}</TableCell>
                  <TableCell><StatusBadge status={b.status} />{b.decline_reason && <p className="text-xs text-red-500 mt-1">{b.decline_reason}</p>}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 flex-wrap">
                      {b.status === "declined" && <Button variant="ghost" size="sm" className="h-7 gap-1 text-blue-600" onClick={() => setShowResubmit({ ...b, type: "bon-sementara" })} data-testid={`resubmit-bon-${b.id}`}><RotateCcw className="h-3 w-3" />Ulang</Button>}
                      {["approved_atasan", "approved_hrga", "approved_direktur", "approved_finance"].includes(b.status) && (
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-blue-600" onClick={() => downloadPdf(b.id, "bon-sementara", `RPD-${b.no_bon}`, "/pdf-perjalanan-dinas")} data-testid={`pdf-rpd-${b.id}`}><FileText className="h-3 w-3" />Form RPD</Button>
                      )}
                      {b.status === "approved_finance" && <Button variant="ghost" size="sm" className="h-7 gap-1 text-emerald-600" onClick={() => downloadPdf(b.id, "bon-sementara", b.no_bon)} data-testid={`pdf-bon-${b.id}`}><Download className="h-3 w-3" />Bon</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
          </CardContent></Card>
        </TabsContent>

        {/* REALISASI TABLE */}
        <TabsContent value="realisasi">
          <Card className="border-slate-100 shadow-sm rounded-xl"><CardContent className="p-0">
            <Table><TableHeader><TableRow className="border-slate-100">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ref. No. Bon</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Periode</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Realisasi</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sisa Bon</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {realisasi.length === 0 ? (<TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">Belum ada realisasi</TableCell></TableRow>) :
              realisasi.map(r => (
                <TableRow key={r.id} className="border-slate-50" data-testid={`real-row-${r.id}`}>
                  <TableCell className="text-sm font-mono text-slate-700">{r.no_bon_ref}</TableCell>
                  <TableCell className="text-sm text-slate-700">{r.periode}</TableCell>
                  <TableCell className="text-sm font-medium text-slate-900">{fmt(r.total_realisasi)}</TableCell>
                  <TableCell className={`text-sm font-medium ${r.sisa_bon >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(r.sisa_bon)}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {r.status === "declined" && <Button variant="ghost" size="sm" className="h-7 gap-1 text-blue-600" onClick={() => setShowResubmit({ ...r, type: "realisasi" })} data-testid={`resubmit-real-${r.id}`}><RotateCcw className="h-3 w-3" />Ulang</Button>}
                      {r.status === "approved_finance" && <Button variant="ghost" size="sm" className="h-7 gap-1 text-emerald-600" onClick={() => downloadPdf(r.id, "realisasi", `realisasi-${r.no_bon_ref}`)} data-testid={`pdf-real-${r.id}`}><Download className="h-3 w-3" />PDF</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* CREATE PERJALANAN DINAS DIALOG */}
      <Dialog open={showCreateBon} onOpenChange={setShowCreateBon}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="create-bon-dialog">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Pengajuan Perjalanan Dinas</DialogTitle>
            <DialogDescription>Isi sesuai Form Perjalanan Dinas Karyawan</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>NIK</Label><Input placeholder="NIK" value={bonForm.nik} onChange={e => setBonForm(p => ({ ...p, nik: e.target.value }))} data-testid="bon-nik" /></div>
              <div><Label>Jabatan</Label><Input placeholder="Jabatan" value={bonForm.jabatan} onChange={e => setBonForm(p => ({ ...p, jabatan: e.target.value }))} data-testid="bon-jabatan" /></div>
              <div><Label>Wilayah</Label><Input placeholder="Wilayah" value={bonForm.wilayah} onChange={e => setBonForm(p => ({ ...p, wilayah: e.target.value }))} data-testid="bon-wilayah" /></div>
              <div><Label>Tujuan *</Label><Input placeholder="Kota tujuan" value={bonForm.tujuan} onChange={e => setBonForm(p => ({ ...p, tujuan: e.target.value }))} data-testid="bon-tujuan" /></div>
              <div><Label>Periode Mulai *</Label><Input type="date" value={bonForm.periode_mulai} onChange={e => setBonForm(p => ({ ...p, periode_mulai: e.target.value }))} data-testid="bon-periode-mulai" /></div>
              <div><Label>Periode Selesai *</Label><Input type="date" value={bonForm.periode_selesai} onChange={e => setBonForm(p => ({ ...p, periode_selesai: e.target.value }))} data-testid="bon-periode-selesai" /></div>
            </div>
            <div><Label>Keperluan *</Label><Textarea placeholder="Tujuan perjalanan dinas" value={bonForm.keperluan} onChange={e => setBonForm(p => ({ ...p, keperluan: e.target.value }))} data-testid="bon-keperluan" /></div>

            <Separator />
            <h4 className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AKOMODASI / HOTEL</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kota Tujuan</Label><Input value={bonForm.akomodasi_kota} onChange={e => setBonForm(p => ({ ...p, akomodasi_kota: e.target.value }))} data-testid="bon-ako-kota" /></div>
              <div><Label>Nama Hotel</Label><Input value={bonForm.akomodasi_hotel} onChange={e => setBonForm(p => ({ ...p, akomodasi_hotel: e.target.value }))} data-testid="bon-ako-hotel" /></div>
              <div><Label>Check In</Label><Input type="date" value={bonForm.akomodasi_checkin} onChange={e => setBonForm(p => ({ ...p, akomodasi_checkin: e.target.value }))} data-testid="bon-ako-checkin" /></div>
              <div><Label>Check Out</Label><Input type="date" value={bonForm.akomodasi_checkout} onChange={e => setBonForm(p => ({ ...p, akomodasi_checkout: e.target.value }))} data-testid="bon-ako-checkout" /></div>
              <div><Label>Harga / Malam (Rp)</Label><Input type="number" value={bonForm.akomodasi_harga} onChange={e => setBonForm(p => ({ ...p, akomodasi_harga: e.target.value }))} data-testid="bon-ako-harga" /></div>
              <div><Label>Pembayaran</Label>
                <Select value={bonForm.akomodasi_bayar} onValueChange={v => setBonForm(p => ({ ...p, akomodasi_bayar: v }))}>
                  <SelectTrigger data-testid="bon-ako-bayar"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Head Office">Head Office</SelectItem><SelectItem value="Personal">Personal / Langsung</SelectItem></SelectContent>
                </Select>
              </div>
            </div>

            <Separator />
            <h4 className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>TRANSPORTASI</h4>
            <p className="text-xs text-slate-500 -mt-2">Keberangkatan</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Jenis</Label>
                <Select value={bonForm.trans_berangkat_jenis} onValueChange={v => setBonForm(p => ({ ...p, trans_berangkat_jenis: v }))}>
                  <SelectTrigger data-testid="bon-tb-jenis"><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent><SelectItem value="Pesawat">Pesawat</SelectItem><SelectItem value="Kereta Api">Kereta Api</SelectItem><SelectItem value="Mobil Dinas">Mobil Dinas</SelectItem><SelectItem value="Lainnya">Lain-lain</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Jam Berangkat</Label><Input type="time" value={bonForm.trans_berangkat_jam} onChange={e => setBonForm(p => ({ ...p, trans_berangkat_jam: e.target.value }))} data-testid="bon-tb-jam" /></div>
              <div><Label>Dari</Label><Input value={bonForm.trans_berangkat_dari} onChange={e => setBonForm(p => ({ ...p, trans_berangkat_dari: e.target.value }))} data-testid="bon-tb-dari" /></div>
              <div><Label>Ke</Label><Input value={bonForm.trans_berangkat_ke} onChange={e => setBonForm(p => ({ ...p, trans_berangkat_ke: e.target.value }))} data-testid="bon-tb-ke" /></div>
            </div>
            <p className="text-xs text-slate-500">Kedatangan / Kembali</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Jenis</Label>
                <Select value={bonForm.trans_kembali_jenis} onValueChange={v => setBonForm(p => ({ ...p, trans_kembali_jenis: v }))}>
                  <SelectTrigger data-testid="bon-tk-jenis"><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent><SelectItem value="Pesawat">Pesawat</SelectItem><SelectItem value="Kereta Api">Kereta Api</SelectItem><SelectItem value="Mobil Dinas">Mobil Dinas</SelectItem><SelectItem value="Lainnya">Lain-lain</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Jam</Label><Input type="time" value={bonForm.trans_kembali_jam} onChange={e => setBonForm(p => ({ ...p, trans_kembali_jam: e.target.value }))} data-testid="bon-tk-jam" /></div>
              <div><Label>Dari</Label><Input value={bonForm.trans_kembali_dari} onChange={e => setBonForm(p => ({ ...p, trans_kembali_dari: e.target.value }))} data-testid="bon-tk-dari" /></div>
              <div><Label>Ke</Label><Input value={bonForm.trans_kembali_ke} onChange={e => setBonForm(p => ({ ...p, trans_kembali_ke: e.target.value }))} data-testid="bon-tk-ke" /></div>
            </div>

            <Separator />
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>ESTIMASI BIAYA PERJALANAN DINAS (KAS BON)</h4>
              <Button variant="outline" size="sm" onClick={addEstimasiItem} className="h-7 gap-1" data-testid="add-estimasi-item"><Plus className="h-3 w-3" />Tambah</Button>
            </div>
            <div className="space-y-2">
              {bonForm.estimasi_items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-1 text-sm font-medium text-slate-600 pb-2">{idx + 1}.</div>
                  <div className="col-span-6">
                    <Label className="text-xs">Uraian Biaya</Label>
                    <Input placeholder="Contoh: Biaya Konsumsi" value={item.uraian} onChange={e => updateEstimasiItem(idx, "uraian", e.target.value)} data-testid={`est-uraian-${idx}`} />
                  </div>
                  <div className="col-span-4">
                    <Label className="text-xs">Jumlah (Rp)</Label>
                    <Input type="number" placeholder="0" value={item.jumlah || ""} onChange={e => updateEstimasiItem(idx, "jumlah", e.target.value)} data-testid={`est-jumlah-${idx}`} />
                  </div>
                  <div className="col-span-1">
                    {bonForm.estimasi_items.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500" onClick={() => removeEstimasiItem(idx)} data-testid={`remove-est-${idx}`}><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 p-3 rounded-lg"><p className="text-sm font-bold text-slate-900">TOTAL: {fmt(calcEstimasiTotal())}</p></div>

            <div><Label>Upload Dokumen Pendukung</Label>
              <label className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition cursor-pointer flex flex-col items-center gap-1" data-testid="bon-foto-upload">
                <UploadCloud className="h-6 w-6 text-slate-400" />
                <p className="text-xs text-slate-500">{bonForm.foto ? "File terpilih" : "Klik untuk upload"}</p>
                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, setBonForm, "foto")} />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateBon(false)}>Batal</Button>
            <Button onClick={submitBon} disabled={loading} className="bg-slate-900 hover:bg-slate-800" data-testid="submit-bon-btn">{loading ? "Mengirim..." : "Ajukan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE REALISASI DIALOG */}
      <Dialog open={showCreateReal} onOpenChange={setShowCreateReal}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto" data-testid="create-realisasi-dialog">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Realisasi Bon Sementara</DialogTitle>
            <DialogDescription>Rekap pengeluaran aktual sesuai bon sementara</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Referensi No. Bon Sementara *</Label>
                <Select value={realForm.bon_sementara_id} onValueChange={v => setRealForm(p => ({ ...p, bon_sementara_id: v }))}>
                  <SelectTrigger data-testid="real-bon-ref"><SelectValue placeholder="Pilih Bon Sementara" /></SelectTrigger>
                  <SelectContent>{approvedBons.map(b => <SelectItem key={b.id} value={b.id}>{b.no_bon} - {b.tujuan} ({fmt(b.jumlah)})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Periode *</Label><Input type="date" value={realForm.periode} onChange={e => setRealForm(p => ({ ...p, periode: e.target.value }))} data-testid="real-periode" /></div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold">Detail Pengeluaran</Label>
                <Button variant="outline" size="sm" onClick={addRealItem} className="h-7 gap-1" data-testid="add-real-item"><Plus className="h-3 w-3" />Tambah</Button>
              </div>
              {realForm.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-2"><Label className="text-xs">Tanggal</Label><Input type="date" value={item.tanggal} onChange={e => updateRealItem(idx, "tanggal", e.target.value)} data-testid={`real-item-tgl-${idx}`} /></div>
                  <div className="col-span-4"><Label className="text-xs">Uraian</Label><Input placeholder="Keterangan" value={item.uraian} onChange={e => updateRealItem(idx, "uraian", e.target.value)} data-testid={`real-item-uraian-${idx}`} /></div>
                  <div className="col-span-1"><Label className="text-xs">Qty</Label><Input type="number" value={item.quantity} onChange={e => updateRealItem(idx, "quantity", e.target.value)} data-testid={`real-item-qty-${idx}`} /></div>
                  <div className="col-span-2"><Label className="text-xs">Harga/Unit</Label><Input type="number" value={item.harga_per_unit} onChange={e => updateRealItem(idx, "harga_per_unit", e.target.value)} data-testid={`real-item-harga-${idx}`} /></div>
                  <div className="col-span-2"><Label className="text-xs">Total</Label><Input disabled value={fmt(item.total || 0)} /></div>
                  <div className="col-span-1"><Button variant="ghost" size="icon" className="h-9 w-9 text-red-500" onClick={() => removeRealItem(idx)} data-testid={`remove-real-item-${idx}`}><Trash2 className="h-4 w-4" /></Button></div>
                </div>
              ))}
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm font-bold">Total Realisasi: {fmt(realForm.items.reduce((s, i) => s + (parseFloat(i.total) || 0), 0))}</p>
              </div>
            </div>

            <div><Label>Upload Bukti Transfer (jika ada kelebihan)</Label>
              <label className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition cursor-pointer flex flex-col items-center gap-1" data-testid="real-bukti-upload">
                <UploadCloud className="h-6 w-6 text-slate-400" />
                <p className="text-xs text-slate-500">{realForm.bukti_transfer ? "File terpilih" : "Klik untuk upload"}</p>
                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, setRealForm, "bukti_transfer")} />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateReal(false)}>Batal</Button>
            <Button onClick={submitRealisasi} disabled={loading} className="bg-slate-900 hover:bg-slate-800" data-testid="submit-realisasi-btn">{loading ? "Mengirim..." : "Ajukan Realisasi"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RESUBMIT DIALOG */}
      <Dialog open={!!showResubmit} onOpenChange={() => setShowResubmit(null)}>
        <DialogContent data-testid="resubmit-dialog">
          <DialogHeader><DialogTitle>Ajukan Ulang?</DialogTitle><DialogDescription>Alasan ditolak: {showResubmit?.decline_reason}</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResubmit(null)}>Tidak</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleResubmit(showResubmit?.id, showResubmit?.type)} data-testid="confirm-resubmit">Ya, Ajukan Ulang</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===================== APPROVAL VIEW (Atasan / HRGA / Direktur / Finance) =====================
function ApprovalView({ role }) {
  const [bons, setBons] = useState([]);
  const [realisasi, setRealisasi] = useState([]);
  const [tab, setTab] = useState("bon");
  const [showDecline, setShowDecline] = useState(null);
  const [declineReason, setDeclineReason] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [b, r] = await Promise.all([api.get("/bon-sementara"), api.get("/realisasi")]);
      setBons(b.data); setRealisasi(r.data);
    } catch { toast.error("Gagal memuat data"); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  // Define which status each role needs to approve
  const bonPendingStatus = {
    atasan: "pending",
    hrga: "approved_atasan",
    direktur: "approved_hrga",
    finance: "approved_direktur"
  };
  
  const realisasiPendingStatus = {
    hrga: "pending",
    direktur: "approved_hrga",
    finance: "approved_direktur"
  };

  const pendingBons = bons.filter(b => b.status === bonPendingStatus[role]);
  const pendingRealisasi = realisasi.filter(r => r.status === realisasiPendingStatus[role]);
  
  // Filters
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  const [showDetail, setShowDetail] = useState(null);
  
  // Role labels for display
  const roleLabels = {
    atasan: "Atasan Departemen",
    hrga: "HRGA",
    direktur: "Direktur",
    finance: "Finance"
  };

  const approve = async (id, type) => {
    try {
      await api.put(`/${type}/${id}/approve`);
      toast.success("Disetujui"); fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || "Gagal"); }
  };

  const decline = async () => {
    if (!declineReason.trim()) { toast.error("Alasan wajib diisi"); return; }
    try {
      await api.put(`/${showDecline.type}/${showDecline.id}/decline`, { reason: declineReason });
      toast.success("Ditolak"); setShowDecline(null); setDeclineReason(""); fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || "Gagal"); }
  };

  const downloadPdf = async (id, type, name, endpoint = "/pdf") => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/${type}/${id}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${name}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error("Gagal"); }
  };

  // Apply filters to history
  const applyFilters = (items) => {
    return items.filter(item => {
      const itemDate = new Date(item.created_at);
      const itemMonth = itemDate.getMonth() + 1;
      const itemYear = itemDate.getFullYear();
      const amount = item.jumlah || item.total_realisasi || 0;
      
      if (filterMonth && itemMonth !== parseInt(filterMonth)) return false;
      if (filterYear && itemYear !== parseInt(filterYear)) return false;
      if (filterMinAmount && amount < parseFloat(filterMinAmount)) return false;
      if (filterMaxAmount && amount > parseFloat(filterMaxAmount)) return false;
      return true;
    });
  };

  const renderApprovalTable = (items, type, label) => (
    <Card className="border-slate-100 shadow-sm rounded-xl">
      <CardHeader className="pb-3"><CardTitle className="text-base font-semibold flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{label}{items.length > 0 && <Badge className="bg-amber-100 text-amber-700 border-amber-200">{items.length}</Badge>}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table><TableHeader><TableRow className="border-slate-100">
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pemohon</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">{type === "bon-sementara" ? "No. Bon / Tujuan" : "Ref. Bon / Periode"}</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Jumlah</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {items.length === 0 ? (<TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">Tidak ada yang menunggu persetujuan {roleLabels[role]}</TableCell></TableRow>) :
          items.map(item => (
            <TableRow key={item.id} className="border-slate-50 cursor-pointer hover:bg-slate-50" data-testid={`approve-row-${item.id}`} onClick={() => setShowDetail({ ...item, type })}>
              <TableCell className="text-sm font-medium text-slate-900">{item.user_name}</TableCell>
              <TableCell><p className="text-sm text-slate-900">{type === "bon-sementara" ? item.no_bon : item.no_bon_ref}</p><p className="text-xs text-slate-500">{type === "bon-sementara" ? item.tujuan : item.periode}</p></TableCell>
              <TableCell className="text-sm font-medium text-slate-900">{fmt(type === "bon-sementara" ? item.jumlah : item.total_realisasi)}</TableCell>
              <TableCell onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <Button size="sm" className="h-7 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => approve(item.id, type)} data-testid={`approve-btn-${item.id}`}><CheckCircle2 className="h-3 w-3" />Setujui</Button>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-red-600 hover:bg-red-50" onClick={() => setShowDecline({ ...item, type })} data-testid={`decline-btn-${item.id}`}><XCircle className="h-3 w-3" />Tolak</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      </CardContent>
    </Card>
  );

  const historyBons = applyFilters(bons.filter(b => !pendingBons.includes(b)));
  const historyRealisasi = applyFilters(realisasi.filter(r => !pendingRealisasi.includes(r)));
  
  // Atasan tidak terlibat dalam realisasi bon
  const showRealisasiTab = role !== 'atasan';
  
  // Generate year options
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 5; y--) years.push(y);
  
  const months = [
    { value: "1", label: "Januari" }, { value: "2", label: "Februari" }, { value: "3", label: "Maret" },
    { value: "4", label: "April" }, { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
    { value: "7", label: "Juli" }, { value: "8", label: "Agustus" }, { value: "9", label: "September" },
    { value: "10", label: "Oktober" }, { value: "11", label: "November" }, { value: "12", label: "Desember" }
  ];

  const clearFilters = () => {
    setFilterMonth(""); setFilterYear(""); setFilterMinAmount(""); setFilterMaxAmount("");
  };
  
  // Calculate totals
  const totalBonsFiltered = historyBons.reduce((sum, b) => sum + (b.jumlah || 0), 0);
  const totalRealisasiFiltered = historyRealisasi.reduce((sum, r) => sum + (r.total_realisasi || 0), 0);

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList data-testid="approval-tabs">
          <TabsTrigger value="bon">Perjalanan Dinas</TabsTrigger>
          {showRealisasiTab && <TabsTrigger value="realisasi">Realisasi Bon</TabsTrigger>}
        </TabsList>
        <TabsContent value="bon" className="space-y-4">
          {renderApprovalTable(pendingBons, "bon-sementara", `Menunggu Persetujuan ${roleLabels[role]}`)}
          
          {/* History with Filters */}
          <Card className="border-slate-100 shadow-sm rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Riwayat</CardTitle>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1">
                    <span className="text-xs text-emerald-600 font-medium">Total: </span>
                    <span className="text-sm text-emerald-700 font-bold">{fmt(totalBonsFiltered)}</span>
                    <span className="text-xs text-emerald-500 ml-1">({historyBons.length} data)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Bulan" /></SelectTrigger>
                    <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue placeholder="Tahun" /></SelectTrigger>
                    <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" placeholder="Min Rp" value={filterMinAmount} onChange={e => setFilterMinAmount(e.target.value)} className="w-[100px] h-8 text-xs" />
                  <Input type="number" placeholder="Max Rp" value={filterMaxAmount} onChange={e => setFilterMaxAmount(e.target.value)} className="w-[100px] h-8 text-xs" />
                  {(filterMonth || filterYear || filterMinAmount || filterMaxAmount) && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>Reset</Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">No. Dokumen</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pemohon</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Jumlah</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {historyBons.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Tidak ada riwayat</TableCell></TableRow>
                ) : historyBons.map(b => (
                  <TableRow key={b.id} className="border-slate-50 cursor-pointer hover:bg-slate-50" onClick={() => setShowDetail({ ...b, type: "bon-sementara" })}>
                    <TableCell className="text-sm font-mono">{b.no_bon}</TableCell>
                    <TableCell className="text-sm">{b.user_name}</TableCell>
                    <TableCell className="text-sm font-medium">{fmt(b.jumlah)}</TableCell>
                    <TableCell><StatusBadge status={b.status} /></TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 flex-wrap">
                        {["approved_atasan", "approved_hrga", "approved_direktur", "approved_finance"].includes(b.status) && (
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-blue-600" onClick={() => downloadPdf(b.id, "bon-sementara", `RPD-${b.no_bon}`, "/pdf-perjalanan-dinas")}><FileText className="h-3 w-3" />RPD</Button>
                        )}
                        {b.status === "approved_finance" && (
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-emerald-600" onClick={() => downloadPdf(b.id, "bon-sementara", b.no_bon)}><Download className="h-3 w-3" />Bon</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>
        {showRealisasiTab && (
          <TabsContent value="realisasi" className="space-y-4">
            {renderApprovalTable(pendingRealisasi, "realisasi", `Menunggu Persetujuan ${roleLabels[role]}`)}
            
            {/* Realisasi History with Filters */}
            <Card className="border-slate-100 shadow-sm rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Riwayat</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={filterMonth} onValueChange={setFilterMonth}>
                      <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Bulan" /></SelectTrigger>
                      <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={filterYear} onValueChange={setFilterYear}>
                      <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue placeholder="Tahun" /></SelectTrigger>
                      <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" placeholder="Min Rp" value={filterMinAmount} onChange={e => setFilterMinAmount(e.target.value)} className="w-[100px] h-8 text-xs" />
                    <Input type="number" placeholder="Max Rp" value={filterMaxAmount} onChange={e => setFilterMaxAmount(e.target.value)} className="w-[100px] h-8 text-xs" />
                    {(filterMonth || filterYear || filterMinAmount || filterMaxAmount) && (
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>Reset</Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table><TableHeader><TableRow>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ref.</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pemohon</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sisa</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {historyRealisasi.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">Tidak ada riwayat</TableCell></TableRow>
                  ) : historyRealisasi.map(r => (
                    <TableRow key={r.id} className="border-slate-50 cursor-pointer hover:bg-slate-50" onClick={() => setShowDetail({ ...r, type: "realisasi" })}>
                      <TableCell className="text-sm font-mono">{r.no_bon_ref}</TableCell>
                      <TableCell className="text-sm">{r.user_name}</TableCell>
                      <TableCell className="text-sm font-medium">{fmt(r.total_realisasi)}</TableCell>
                      <TableCell className={`text-sm font-medium ${r.sisa_bon >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(r.sisa_bon)}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        {r.status === "approved_finance" && (
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-emerald-600" onClick={() => downloadPdf(r.id, "realisasi", `real-${r.no_bon_ref}`)}><Download className="h-3 w-3" />PDF</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody></Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Decline Dialog */}
      <Dialog open={!!showDecline} onOpenChange={() => { setShowDecline(null); setDeclineReason(""); }}>
        <DialogContent data-testid="decline-dialog">
          <DialogHeader><DialogTitle>Tolak</DialogTitle><DialogDescription>Berikan alasan penolakan</DialogDescription></DialogHeader>
          <Textarea placeholder="Alasan..." value={declineReason} onChange={e => setDeclineReason(e.target.value)} data-testid="decline-reason-input" />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDecline(null); setDeclineReason(""); }}>Batal</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={decline} data-testid="confirm-decline">Tolak</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="detail-dialog">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {showDetail?.type === "bon-sementara" ? "Detail Perjalanan Dinas" : "Detail Realisasi"}
            </DialogTitle>
            <DialogDescription>{showDetail?.no_bon || showDetail?.no_bon_ref}</DialogDescription>
          </DialogHeader>
          {showDetail?.type === "bon-sementara" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="font-semibold text-slate-500">Pemohon:</span> <span className="text-slate-900">{showDetail.user_name}</span></div>
                <div><span className="font-semibold text-slate-500">NIK:</span> <span className="text-slate-900">{showDetail.nik || "-"}</span></div>
                <div><span className="font-semibold text-slate-500">Jabatan:</span> <span className="text-slate-900">{showDetail.jabatan || "-"}</span></div>
                <div><span className="font-semibold text-slate-500">Wilayah:</span> <span className="text-slate-900">{showDetail.wilayah || "-"}</span></div>
                <div><span className="font-semibold text-slate-500">Tujuan:</span> <span className="text-slate-900">{showDetail.tujuan}</span></div>
                <div><span className="font-semibold text-slate-500">Periode:</span> <span className="text-slate-900">{showDetail.periode_mulai} s/d {showDetail.periode_selesai}</span></div>
                <div className="col-span-2"><span className="font-semibold text-slate-500">Keperluan:</span> <span className="text-slate-900">{showDetail.keperluan}</span></div>
              </div>
              
              {showDetail.akomodasi && (showDetail.akomodasi.nama_hotel || showDetail.akomodasi.kota_tujuan) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-2">Akomodasi</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-slate-500">Hotel:</span> {showDetail.akomodasi.nama_hotel || "-"}</div>
                      <div><span className="text-slate-500">Kota:</span> {showDetail.akomodasi.kota_tujuan || "-"}</div>
                      <div><span className="text-slate-500">Check In:</span> {showDetail.akomodasi.check_in || "-"}</div>
                      <div><span className="text-slate-500">Check Out:</span> {showDetail.akomodasi.check_out || "-"}</div>
                      <div><span className="text-slate-500">Harga/Malam:</span> {fmt(showDetail.akomodasi.harga_per_malam || 0)}</div>
                      <div><span className="text-slate-500">Pembayaran:</span> {showDetail.akomodasi.pembayaran || "-"}</div>
                    </div>
                  </div>
                </>
              )}
              
              {(showDetail.transportasi_berangkat?.jenis || showDetail.transportasi_kembali?.jenis) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-2">Transportasi</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-slate-600 mb-1">Berangkat:</p>
                        <p><span className="text-slate-500">Jenis:</span> {showDetail.transportasi_berangkat?.jenis || "-"}</p>
                        <p><span className="text-slate-500">Dari:</span> {showDetail.transportasi_berangkat?.dari_kota || "-"}</p>
                        <p><span className="text-slate-500">Ke:</span> {showDetail.transportasi_berangkat?.ke_kota || "-"}</p>
                        <p><span className="text-slate-500">Jam:</span> {showDetail.transportasi_berangkat?.jam_berangkat || "-"}</p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-600 mb-1">Kembali:</p>
                        <p><span className="text-slate-500">Jenis:</span> {showDetail.transportasi_kembali?.jenis || "-"}</p>
                        <p><span className="text-slate-500">Dari:</span> {showDetail.transportasi_kembali?.dari_kota || "-"}</p>
                        <p><span className="text-slate-500">Ke:</span> {showDetail.transportasi_kembali?.ke_kota || "-"}</p>
                        <p><span className="text-slate-500">Jam:</span> {showDetail.transportasi_kembali?.jam_berangkat || "-"}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {showDetail.estimasi_items && showDetail.estimasi_items.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-2">Estimasi Biaya</h4>
                    <div className="space-y-1">
                      {showDetail.estimasi_items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-slate-600">{idx + 1}. {item.uraian}</span>
                          <span className="font-medium">{fmt(item.jumlah || 0)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                        <span>TOTAL</span>
                        <span>{fmt(showDetail.jumlah)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {showDetail.approval_history && showDetail.approval_history.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-2">Riwayat Persetujuan</h4>
                    <div className="space-y-2">
                      {showDetail.approval_history.map((h, idx) => (
                        <div key={idx} className={`flex items-center justify-between text-sm p-2 rounded ${h.action === "approved" ? "bg-emerald-50" : "bg-red-50"}`}>
                          <div>
                            <span className={`font-medium ${h.action === "approved" ? "text-emerald-700" : "text-red-700"}`}>{h.by}</span>
                            <span className="text-slate-500 ml-2">({h.role?.toUpperCase()})</span>
                          </div>
                          <div className="text-right">
                            <span className={h.action === "approved" ? "text-emerald-600" : "text-red-600"}>{h.action === "approved" ? "Disetujui" : "Ditolak"}</span>
                            <p className="text-xs text-slate-400">{h.at?.slice(0, 10)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          {showDetail?.type === "realisasi" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="font-semibold text-slate-500">Ref. Bon:</span> <span className="text-slate-900">{showDetail.no_bon_ref}</span></div>
                <div><span className="font-semibold text-slate-500">Pemohon:</span> <span className="text-slate-900">{showDetail.user_name}</span></div>
                <div><span className="font-semibold text-slate-500">Periode:</span> <span className="text-slate-900">{showDetail.periode}</span></div>
                <div><span className="font-semibold text-slate-500">Status:</span> <StatusBadge status={showDetail.status} /></div>
              </div>
              
              {showDetail.items && showDetail.items.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-2">Rincian Biaya</h4>
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead className="text-xs">Tanggal</TableHead>
                        <TableHead className="text-xs">Uraian</TableHead>
                        <TableHead className="text-xs text-right">Qty</TableHead>
                        <TableHead className="text-xs text-right">Harga</TableHead>
                        <TableHead className="text-xs text-right">Total</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {showDetail.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs">{item.tanggal || "-"}</TableCell>
                            <TableCell className="text-xs">{item.uraian}</TableCell>
                            <TableCell className="text-xs text-right">{item.quantity}</TableCell>
                            <TableCell className="text-xs text-right">{fmt(item.harga_per_unit)}</TableCell>
                            <TableCell className="text-xs text-right font-medium">{fmt(item.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between"><span>Total Realisasi:</span><span className="font-bold">{fmt(showDetail.total_realisasi)}</span></div>
                      <div className="flex justify-between"><span>Uang Muka:</span><span>{fmt(showDetail.uang_muka)}</span></div>
                      <div className={`flex justify-between ${showDetail.sisa_bon >= 0 ? "text-emerald-600" : "text-red-600"}`}><span>Sisa:</span><span className="font-bold">{fmt(showDetail.sisa_bon)}</span></div>
                    </div>
                  </div>
                </>
              )}
              
              {showDetail.approval_history && showDetail.approval_history.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-2">Riwayat Persetujuan</h4>
                    <div className="space-y-2">
                      {showDetail.approval_history.map((h, idx) => (
                        <div key={idx} className={`flex items-center justify-between text-sm p-2 rounded ${h.action === "approved" ? "bg-emerald-50" : "bg-red-50"}`}>
                          <div>
                            <span className={`font-medium ${h.action === "approved" ? "text-emerald-700" : "text-red-700"}`}>{h.by}</span>
                            <span className="text-slate-500 ml-2">({h.role?.toUpperCase()})</span>
                          </div>
                          <div className="text-right">
                            <span className={h.action === "approved" ? "text-emerald-600" : "text-red-600"}>{h.action === "approved" ? "Disetujui" : "Ditolak"}</span>
                            <p className="text-xs text-slate-400">{h.at?.slice(0, 10)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetail(null)}>Tutup</Button>
            {showDetail?.type === "bon-sementara" && ["approved_atasan", "approved_hrga", "approved_direktur", "approved_finance"].includes(showDetail?.status) && (
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-1" onClick={() => { downloadPdf(showDetail.id, "bon-sementara", `RPD-${showDetail.no_bon}`, "/pdf-perjalanan-dinas"); }}><FileText className="h-4 w-4" />Download RPD</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===================== MAIN =====================
export default function BonPage() {
  const { user } = useAuth();
  
  const roleTitles = {
    pegawai: { title: "Perjalanan Dinas & Realisasi", subtitle: "Ajukan perjalanan dinas dan realisasi bon" },
    atasan: { title: "Persetujuan Atasan Departemen", subtitle: "Review dan setujui pengajuan perjalanan dinas dari pegawai" },
    hrga: { title: "Verifikasi HRGA", subtitle: "Verifikasi pengajuan perjalanan dinas dan realisasi bon" },
    direktur: { title: "Otorisasi Direktur", subtitle: "Otorisasi pengajuan perjalanan dinas dan realisasi" },
    finance: { title: "Finalisasi Finance", subtitle: "Finalisasi dan pencairan bon" }
  };
  
  const info = roleTitles[user?.role] || roleTitles.pegawai;
  
  return (
    <div className="max-w-6xl" data-testid="bon-page">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {info.title}
        </h2>
        <p className="text-sm text-slate-500 mt-1">{info.subtitle}</p>
      </div>
      {user?.role === "pegawai" ? <PegawaiView /> : <ApprovalView role={user?.role} />}
    </div>
  );
}
