# KantorPlus - PRD

## Problem Statement
Web responsif dengan 5 role user (Pegawai, Atasan Departemen, HRGA, Direktur, Finance) dengan fitur utama Perjalanan Dinas yang memiliki workflow approval 4 tahap bertingkat, ditambah fitur Pengaduan, Cuti, dan Inventaris.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: JWT-based authentication

## User Personas
1. **Pegawai**: Submit perjalanan dinas, realisasi bon. Track status.
2. **Atasan Departemen**: Review & approve/decline perjalanan dinas dari pegawai (tahap 1).
3. **HRGA**: Verifikasi perjalanan dinas dan approve realisasi bon (tahap 2 untuk dinas, tahap 1 untuk realisasi).
4. **Direktur**: Otorisasi perjalanan dinas dan realisasi (tahap 3 untuk dinas, tahap 2 untuk realisasi).
5. **Finance**: Final approval dan pencairan (tahap 4 untuk dinas, tahap 3 untuk realisasi).

## Core Requirements
- JWT authentication with 5 roles
- 4-level approval workflow for Perjalanan Dinas: Pegawai → Atasan → HRGA → Direktur → Finance
- 3-level approval workflow for Realisasi: Pegawai → HRGA → Direktur → Finance
- Custom estimasi biaya (user dapat tambah item sendiri)
- Decline notification with resubmit option
- PDF generation untuk dokumen yang sudah disetujui
- Professional corporate design
- Responsive layout

## What's Been Implemented (Feb 18, 2026)

### Authentication & Users
- JWT authentication with 5 roles
- Auto-seed 5 demo users on startup

### Perjalanan Dinas (Stage 1)
- Form pengajuan dengan data: NIK, Jabatan, Wilayah, Tujuan, Periode, Keperluan
- Akomodasi/Hotel section
- Transportasi (Berangkat & Kembali)
- **Estimasi Biaya Custom** - User dapat menambah/hapus item biaya sendiri
- Upload dokumen pendukung
- 4-level approval workflow
- PDF generation setelah disetujui Finance

### Realisasi Bon (Stage 2)
- Pilih nomor dokumen perjalanan dinas yang sudah approved_finance
- Input detail pengeluaran (tanggal, uraian, qty, harga)
- Hitung selisih uang muka vs biaya aktual
- Upload bukti transfer (jika ada kelebihan)
- 3-level approval workflow (tanpa Atasan)
- PDF generation

### UI/UX
- Login page with split-screen design
- Dashboard Odoo-style dengan icon grid
- Top navigation bar (tanpa sidebar)
- Tab "Perjalanan Dinas" dan "Realisasi Bon"
- Status badges untuk setiap level approval
- Notification system

## Status Workflow

### Bon Sementara (Perjalanan Dinas)
```
pending → approved_atasan → approved_hrga → approved_direktur → approved_finance
```

### Realisasi Bon
```
pending → approved_hrga → approved_direktur → approved_finance
```

## Test Credentials
- **Pegawai**: pegawai@kantor.com / password123
- **Atasan**: atasan@kantor.com / password123
- **HRGA**: hrga@kantor.com / password123
- **Direktur**: direktur@kantor.com / password123
- **Finance**: finance@kantor.com / password123

## Prioritized Backlog

### P0 (Done)
- [x] Auth system (JWT) dengan 5 roles
- [x] 4-level approval workflow untuk Perjalanan Dinas
- [x] 3-level approval workflow untuk Realisasi
- [x] Custom estimasi biaya (dinamis)
- [x] PDF generation
- [x] Dashboard with stats
- [x] Notification system

### P1 (Next)
- [ ] Search & filter on all tables
- [ ] Pagination for large datasets
- [ ] Edit pengajuan sebelum di-approve

### P2 (Future)
- [ ] Email notifications
- [ ] Admin panel for user management
- [ ] Export data to Excel
- [ ] Audit trail / activity log
- [ ] Fitur Pengaduan lengkap
- [ ] Fitur Cuti lengkap
- [ ] Fitur Inventaris lengkap
