from fastapi import FastAPI, APIRouter, HTTPException, Header, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt as pyjwt
from fpdf import FPDF

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'kantorplus-secret-2024-production')
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- Pydantic Models ---
class LoginRequest(BaseModel):
    email: str
    password: str

class BonCreate(BaseModel):
    judul: str
    deskripsi: str
    jumlah: float
    foto: Optional[str] = None

class BonAction(BaseModel):
    reason: Optional[str] = None

class PengaduanCreate(BaseModel):
    judul: str
    deskripsi: str
    kategori: str

class CutiCreate(BaseModel):
    tanggal_mulai: str
    tanggal_selesai: str
    jenis: str
    alasan: str

class InventarisCreate(BaseModel):
    nama: str
    kategori: str
    jumlah: int
    kondisi: str
    lokasi: str

# --- Auth Helpers ---
def create_token(user):
    payload = {
        'id': user['id'],
        'email': user['email'],
        'role': user['role'],
        'name': user['name'],
        'exp': datetime.now(timezone.utc) + timedelta(hours=24)
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm='HS256')

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Token diperlukan')
    token = authorization.split(' ')[1]
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token kedaluwarsa')
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Token tidak valid')

# --- Auth Routes ---
@api_router.post("/auth/login")
async def login(data: LoginRequest):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail='Email atau password salah')
    if not pwd_context.verify(data.password, user['password']):
        raise HTTPException(status_code=401, detail='Email atau password salah')
    token = create_token(user)
    return {
        "token": token,
        "user": {"id": user['id'], "name": user['name'], "email": user['email'], "role": user['role']}
    }

@api_router.get("/auth/me")
async def get_me(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    return {"id": user['id'], "name": user['name'], "email": user['email'], "role": user['role']}

# --- Seed ---
@api_router.post("/seed")
async def seed_data():
    count = await db.users.count_documents({})
    if count > 0:
        return {"message": "Data sudah ada"}
    users = [
        {'id': str(uuid.uuid4()), 'name': 'Ahmad Pegawai', 'email': 'pegawai@kantor.com', 'password': pwd_context.hash('password123'), 'role': 'pegawai'},
        {'id': str(uuid.uuid4()), 'name': 'Budi Atasan', 'email': 'atasan@kantor.com', 'password': pwd_context.hash('password123'), 'role': 'atasan'},
        {'id': str(uuid.uuid4()), 'name': 'Citra Finance', 'email': 'finance@kantor.com', 'password': pwd_context.hash('password123'), 'role': 'finance'},
    ]
    await db.users.insert_many(users)
    return {"message": "Seed berhasil", "users": [{"email": u['email'], "role": u['role']} for u in users]}

# --- Dashboard Stats ---
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user['role'] == 'pegawai':
        total_bon = await db.bons.count_documents({"user_id": user['id']})
        pengaduan_aktif = await db.pengaduan.count_documents({"user_id": user['id'], "status": {"$ne": "selesai"}})
        total_cuti = await db.cuti.count_documents({"user_id": user['id']})
    elif user['role'] == 'atasan':
        total_bon = await db.bons.count_documents({"status": "pending"})
        pengaduan_aktif = await db.pengaduan.count_documents({"status": "pending"})
        total_cuti = await db.cuti.count_documents({"status": "pending"})
    else:
        total_bon = await db.bons.count_documents({"status": "approved_atasan"})
        pengaduan_aktif = await db.pengaduan.count_documents({})
        total_cuti = await db.cuti.count_documents({})
    total_inventaris = await db.inventaris.count_documents({})
    return {
        "total_bon": total_bon,
        "pengaduan_aktif": pengaduan_aktif,
        "total_cuti": total_cuti,
        "total_inventaris": total_inventaris
    }

@api_router.get("/dashboard/preview")
async def get_dashboard_preview(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user['role'] == 'pegawai':
        recent_bons = await db.bons.find({"user_id": user['id']}, {"_id": 0, "foto": 0}).sort("created_at", -1).to_list(5)
        recent_pengaduan = await db.pengaduan.find({"user_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(5)
        recent_cuti = await db.cuti.find({"user_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(5)
    elif user['role'] == 'atasan':
        recent_bons = await db.bons.find({"status": "pending"}, {"_id": 0, "foto": 0}).sort("created_at", -1).to_list(5)
        recent_pengaduan = await db.pengaduan.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
        recent_cuti = await db.cuti.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    else:
        recent_bons = await db.bons.find({"status": {"$in": ["approved_atasan", "approved_finance"]}}, {"_id": 0, "foto": 0}).sort("created_at", -1).to_list(5)
        recent_pengaduan = await db.pengaduan.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
        recent_cuti = await db.cuti.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    recent_inventaris = await db.inventaris.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    bon_stats = {
        "pending": await db.bons.count_documents({"status": "pending"} if user['role'] != 'pegawai' else {"user_id": user['id'], "status": "pending"}),
        "approved": await db.bons.count_documents({"status": {"$in": ["approved_atasan", "approved_finance"]}}),
        "declined": await db.bons.count_documents({"status": "declined"} if user['role'] != 'pegawai' else {"user_id": user['id'], "status": "declined"}),
    }
    return {
        "bons": recent_bons,
        "pengaduan": recent_pengaduan,
        "cuti": recent_cuti,
        "inventaris": recent_inventaris,
        "bon_stats": bon_stats,
    }

# --- Bon Routes ---
@api_router.get("/bon")
async def get_bons(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user['role'] == 'pegawai':
        bons = await db.bons.find({"user_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)
    elif user['role'] == 'atasan':
        bons = await db.bons.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    else:
        bons = await db.bons.find({"status": {"$in": ["approved_atasan", "approved_finance", "declined"]}}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return bons

@api_router.post("/bon")
async def create_bon(data: BonCreate, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user['role'] != 'pegawai':
        raise HTTPException(status_code=403, detail='Hanya pegawai yang bisa membuat bon')
    bon = {
        "id": str(uuid.uuid4()),
        "user_id": user['id'],
        "user_name": user['name'],
        "judul": data.judul,
        "deskripsi": data.deskripsi,
        "jumlah": data.jumlah,
        "foto": data.foto,
        "status": "pending",
        "declined_by": None,
        "decline_reason": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bons.insert_one(bon)
    bon.pop('_id', None)
    return bon

@api_router.put("/bon/{bon_id}/approve")
async def approve_bon(bon_id: str, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    bon = await db.bons.find_one({"id": bon_id}, {"_id": 0})
    if not bon:
        raise HTTPException(status_code=404, detail='Bon tidak ditemukan')
    if user['role'] == 'atasan':
        if bon['status'] != 'pending':
            raise HTTPException(status_code=400, detail='Bon tidak dalam status pending')
        new_status = 'approved_atasan'
    elif user['role'] == 'finance':
        if bon['status'] != 'approved_atasan':
            raise HTTPException(status_code=400, detail='Bon belum disetujui atasan')
        new_status = 'approved_finance'
    else:
        raise HTTPException(status_code=403, detail='Tidak punya akses')
    await db.bons.update_one(
        {"id": bon_id},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": bon['user_id'],
        "message": f"Bon '{bon['judul']}' telah disetujui oleh {user['role']}",
        "type": "approved",
        "bon_id": bon_id,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    return {"message": f"Bon disetujui oleh {user['role']}", "status": new_status}

@api_router.put("/bon/{bon_id}/decline")
async def decline_bon(bon_id: str, data: BonAction, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    bon = await db.bons.find_one({"id": bon_id}, {"_id": 0})
    if not bon:
        raise HTTPException(status_code=404, detail='Bon tidak ditemukan')
    if user['role'] not in ['atasan', 'finance']:
        raise HTTPException(status_code=403, detail='Tidak punya akses')
    await db.bons.update_one(
        {"id": bon_id},
        {"$set": {
            "status": "declined",
            "declined_by": user['role'],
            "decline_reason": data.reason or "Tidak ada alasan",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": bon['user_id'],
        "message": f"Bon '{bon['judul']}' ditolak oleh {user['role']}: {data.reason or 'Tidak ada alasan'}",
        "type": "declined",
        "bon_id": bon_id,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    return {"message": "Bon ditolak", "status": "declined"}

@api_router.put("/bon/{bon_id}/resubmit")
async def resubmit_bon(bon_id: str, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user['role'] != 'pegawai':
        raise HTTPException(status_code=403, detail='Hanya pegawai yang bisa mengajukan ulang')
    bon = await db.bons.find_one({"id": bon_id, "user_id": user['id']}, {"_id": 0})
    if not bon:
        raise HTTPException(status_code=404, detail='Bon tidak ditemukan')
    if bon['status'] != 'declined':
        raise HTTPException(status_code=400, detail='Bon tidak dalam status ditolak')
    await db.bons.update_one(
        {"id": bon_id},
        {"$set": {
            "status": "pending",
            "declined_by": None,
            "decline_reason": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Bon diajukan ulang", "status": "pending"}

@api_router.get("/bon/{bon_id}/pdf")
async def generate_bon_pdf(bon_id: str, authorization: str = Header(None)):
    await get_current_user(authorization)
    bon = await db.bons.find_one({"id": bon_id}, {"_id": 0})
    if not bon:
        raise HTTPException(status_code=404, detail='Bon tidak ditemukan')
    if bon['status'] != 'approved_finance':
        raise HTTPException(status_code=400, detail='Bon belum disetujui sepenuhnya')
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font('Helvetica', 'B', 20)
    pdf.cell(0, 15, 'BON / REIMBURSEMENT', ln=True, align='C')
    pdf.set_font('Helvetica', '', 10)
    pdf.cell(0, 8, f'Tanggal: {bon["created_at"][:10]}', ln=True, align='C')
    pdf.ln(10)
    pdf.set_font('Helvetica', 'B', 12)
    pdf.cell(0, 8, 'Detail Bon', ln=True)
    pdf.set_draw_color(200, 200, 200)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(5)
    pdf.set_font('Helvetica', '', 11)
    pdf.cell(40, 8, 'Pemohon:')
    pdf.cell(0, 8, bon['user_name'], ln=True)
    pdf.cell(40, 8, 'Judul:')
    pdf.cell(0, 8, bon['judul'], ln=True)
    pdf.cell(40, 8, 'Deskripsi:')
    pdf.multi_cell(0, 8, bon['deskripsi'])
    pdf.cell(40, 8, 'Jumlah:')
    pdf.cell(0, 8, f"Rp {bon['jumlah']:,.0f}", ln=True)
    pdf.cell(40, 8, 'Status:')
    pdf.cell(0, 8, 'DISETUJUI', ln=True)
    pdf.ln(20)
    pdf.set_font('Helvetica', 'B', 11)
    pdf.cell(0, 8, 'Tanda Tangan', ln=True, align='C')
    pdf.ln(25)
    pdf.set_font('Helvetica', '', 10)
    pdf.cell(60, 8, '________________', align='C')
    pdf.cell(60, 8, '________________', align='C')
    pdf.cell(60, 8, '________________', align='C', ln=True)
    pdf.cell(60, 8, 'Pemohon', align='C')
    pdf.cell(60, 8, 'Atasan', align='C')
    pdf.cell(60, 8, 'Finance', align='C')
    pdf_bytes = pdf.output()
    return Response(
        content=bytes(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=bon-{bon_id[:8]}.pdf"}
    )

# --- Notifications ---
@api_router.get("/notifications")
async def get_notifications(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    notifications = await db.notifications.find(
        {"user_id": user['id']}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return notifications

@api_router.put("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    await db.notifications.update_one(
        {"id": notif_id, "user_id": user['id']},
        {"$set": {"is_read": True}}
    )
    return {"message": "Notifikasi telah dibaca"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    await db.notifications.update_many(
        {"user_id": user['id'], "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"message": "Semua notifikasi telah dibaca"}

# --- Pengaduan ---
@api_router.get("/pengaduan")
async def get_pengaduan(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user['role'] == 'pegawai':
        items = await db.pengaduan.find({"user_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)
    else:
        items = await db.pengaduan.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items

@api_router.post("/pengaduan")
async def create_pengaduan(data: PengaduanCreate, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    item = {
        "id": str(uuid.uuid4()),
        "user_id": user['id'],
        "user_name": user['name'],
        "judul": data.judul,
        "deskripsi": data.deskripsi,
        "kategori": data.kategori,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pengaduan.insert_one(item)
    item.pop('_id', None)
    return item

# --- Cuti ---
@api_router.get("/cuti")
async def get_cuti(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user['role'] == 'pegawai':
        items = await db.cuti.find({"user_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)
    else:
        items = await db.cuti.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items

@api_router.post("/cuti")
async def create_cuti(data: CutiCreate, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    item = {
        "id": str(uuid.uuid4()),
        "user_id": user['id'],
        "user_name": user['name'],
        "tanggal_mulai": data.tanggal_mulai,
        "tanggal_selesai": data.tanggal_selesai,
        "jenis": data.jenis,
        "alasan": data.alasan,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.cuti.insert_one(item)
    item.pop('_id', None)
    return item

# --- Inventaris ---
@api_router.get("/inventaris")
async def get_inventaris(authorization: str = Header(None)):
    await get_current_user(authorization)
    items = await db.inventaris.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items

@api_router.post("/inventaris")
async def create_inventaris(data: InventarisCreate, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    item = {
        "id": str(uuid.uuid4()),
        "nama": data.nama,
        "kategori": data.kategori,
        "jumlah": data.jumlah,
        "kondisi": data.kondisi,
        "lokasi": data.lokasi,
        "created_by": user['name'],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.inventaris.insert_one(item)
    item.pop('_id', None)
    return item

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    count = await db.users.count_documents({})
    if count == 0:
        users = [
            {'id': str(uuid.uuid4()), 'name': 'Ahmad Pegawai', 'email': 'pegawai@kantor.com', 'password': pwd_context.hash('password123'), 'role': 'pegawai'},
            {'id': str(uuid.uuid4()), 'name': 'Budi Atasan', 'email': 'atasan@kantor.com', 'password': pwd_context.hash('password123'), 'role': 'atasan'},
            {'id': str(uuid.uuid4()), 'name': 'Citra Finance', 'email': 'finance@kantor.com', 'password': pwd_context.hash('password123'), 'role': 'finance'},
        ]
        await db.users.insert_many(users)
        logger.info("Seed data created successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
