# KantorPlus - PRD

## Problem Statement
Web responsif dengan 3 role user (Pegawai, Atasan, Finance) dengan fitur utama Bon/Reimbursement yang memiliki workflow approval bertingkat, ditambah fitur Pengaduan, Cuti, dan Inventaris.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: JWT-based authentication

## User Personas
1. **Pegawai**: Submit bon, pengaduan, cuti. Manage inventaris. Track status.
2. **Atasan**: Review & approve/decline bon dari pegawai. Monitor pengaduan & cuti.
3. **Finance**: Final approval bon. Generate PDF. Monitor semua data.

## Core Requirements
- JWT authentication with 3 roles
- Bon approval workflow: Pegawai → Atasan → Finance → PDF
- Decline notification with resubmit option
- CRUD for Pengaduan, Cuti, Inventaris
- Professional corporate design
- Responsive layout

## What's Been Implemented (Feb 11, 2026)
- Login page with split-screen design
- Dashboard with role-based stat cards
- Complete Bon CRUD with approval workflow
- Bon decline with reason + notification + resubmit flow
- PDF generation for approved bons (fpdf2)
- Pengaduan, Cuti, Inventaris CRUD
- Notification system with bell icon
- Profile dropdown with logout
- Responsive sidebar + topbar layout
- Auto-seed 3 demo users
- Professional UI with Plus Jakarta Sans font

## Test Results
- Backend: 95.7% pass rate
- Frontend: 95% pass rate (all critical workflows working)

## Prioritized Backlog
### P0 (Done)
- [x] Auth system (JWT)
- [x] Bon CRUD + approval workflow
- [x] PDF generation
- [x] Dashboard with stats

### P1 (Next)
- [ ] Atasan/Finance can also approve/decline Pengaduan & Cuti
- [ ] Search & filter on all tables
- [ ] Pagination for large datasets

### P2 (Future)
- [ ] Email notifications
- [ ] Admin panel for user management
- [ ] Export data to Excel
- [ ] Audit trail / activity log
- [ ] Dark mode support
