"""
Test the complete 4-level approval workflow for Bon Sementara and Realisasi
BON SEMENTARA: pending -> approved_atasan -> approved_hrga -> approved_direktur -> approved_finance
REALISASI: pending -> approved_hrga -> approved_direktur -> approved_finance (no Atasan)
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials for 5 roles
CREDENTIALS = {
    "pegawai": {"email": "pegawai@kantor.com", "password": "password123"},
    "atasan": {"email": "atasan@kantor.com", "password": "password123"},
    "hrga": {"email": "hrga@kantor.com", "password": "password123"},
    "direktur": {"email": "direktur@kantor.com", "password": "password123"},
    "finance": {"email": "finance@kantor.com", "password": "password123"},
}

@pytest.fixture(scope="module")
def tokens():
    """Get auth tokens for all 5 roles"""
    tokens = {}
    for role, creds in CREDENTIALS.items():
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        if response.status_code == 200:
            tokens[role] = response.json()["token"]
        else:
            pytest.fail(f"Failed to login as {role}: {response.text}")
    return tokens

def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


class TestLoginAllRoles:
    """Test login for all 5 roles"""
    
    def test_login_pegawai(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["pegawai"])
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "pegawai"
        assert "token" in data
        print("✓ Pegawai login successful")

    def test_login_atasan(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["atasan"])
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "atasan"
        print("✓ Atasan login successful")

    def test_login_hrga(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["hrga"])
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "hrga"
        print("✓ HRGA login successful")

    def test_login_direktur(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["direktur"])
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "direktur"
        print("✓ Direktur login successful")

    def test_login_finance(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["finance"])
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "finance"
        print("✓ Finance login successful")


class TestBonSementaraApprovalWorkflow:
    """Test 4-level approval: pegawai -> atasan -> hrga -> direktur -> finance"""
    
    @pytest.fixture(autouse=True)
    def setup(self, tokens):
        self.tokens = tokens
        self.bon_id = None
    
    def test_01_pegawai_create_bon(self, tokens):
        """Pegawai creates a bon sementara"""
        payload = {
            "tujuan": "TEST_Jakarta",
            "periode_mulai": "2026-01-20",
            "periode_selesai": "2026-01-22",
            "keperluan": "TEST_Meeting with client",
            "jumlah": 1500000,
            "nik": "12345",
            "jabatan": "Staff",
            "wilayah": "HO",
            "estimasi_biaya": {
                "biaya_konsumsi": 500000,
                "biaya_transportasi": 500000,
                "biaya_entertainment": 300000,
                "biaya_lainnya": 200000
            }
        }
        response = requests.post(
            f"{BASE_URL}/api/bon-sementara",
            json=payload,
            headers=auth_header(tokens["pegawai"])
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "pending"
        assert "no_bon" in data
        # Store bon_id for subsequent tests
        pytest.bon_id = data["id"]
        print(f"✓ Created bon: {data['no_bon']} with status 'pending'")

    def test_02_atasan_approve(self, tokens):
        """Atasan approves bon: pending -> approved_atasan"""
        bon_id = pytest.bon_id
        response = requests.put(
            f"{BASE_URL}/api/bon-sementara/{bon_id}/approve",
            headers=auth_header(tokens["atasan"])
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "approved_atasan"
        print("✓ Atasan approved: pending -> approved_atasan")

    def test_03_hrga_approve(self, tokens):
        """HRGA approves bon: approved_atasan -> approved_hrga"""
        bon_id = pytest.bon_id
        response = requests.put(
            f"{BASE_URL}/api/bon-sementara/{bon_id}/approve",
            headers=auth_header(tokens["hrga"])
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "approved_hrga"
        print("✓ HRGA approved: approved_atasan -> approved_hrga")

    def test_04_direktur_approve(self, tokens):
        """Direktur approves bon: approved_hrga -> approved_direktur"""
        bon_id = pytest.bon_id
        response = requests.put(
            f"{BASE_URL}/api/bon-sementara/{bon_id}/approve",
            headers=auth_header(tokens["direktur"])
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "approved_direktur"
        print("✓ Direktur approved: approved_hrga -> approved_direktur")

    def test_05_finance_approve(self, tokens):
        """Finance approves bon: approved_direktur -> approved_finance"""
        bon_id = pytest.bon_id
        response = requests.put(
            f"{BASE_URL}/api/bon-sementara/{bon_id}/approve",
            headers=auth_header(tokens["finance"])
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "approved_finance"
        print("✓ Finance approved: approved_direktur -> approved_finance (FINAL)")

    def test_06_download_pdf(self, tokens):
        """Download PDF after full approval"""
        bon_id = pytest.bon_id
        response = requests.get(
            f"{BASE_URL}/api/bon-sementara/{bon_id}/pdf",
            headers=auth_header(tokens["pegawai"])
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert len(response.content) > 0
        print("✓ PDF download successful after full approval")


class TestDeclineAndResubmit:
    """Test decline flow by atasan and resubmit by pegawai"""
    
    def test_01_create_and_decline(self, tokens):
        """Create bon and have atasan decline it"""
        # Create bon
        payload = {
            "tujuan": "TEST_Bandung_Decline",
            "periode_mulai": "2026-02-01",
            "periode_selesai": "2026-02-03",
            "keperluan": "TEST_Training",
            "jumlah": 800000
        }
        response = requests.post(
            f"{BASE_URL}/api/bon-sementara",
            json=payload,
            headers=auth_header(tokens["pegawai"])
        )
        assert response.status_code == 200
        bon_id = response.json()["id"]
        pytest.decline_bon_id = bon_id
        print(f"✓ Created bon for decline test: {bon_id}")
        
        # Atasan declines
        response = requests.put(
            f"{BASE_URL}/api/bon-sementara/{bon_id}/decline",
            json={"reason": "Budget tidak cukup"},
            headers=auth_header(tokens["atasan"])
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "declined"
        print("✓ Atasan declined bon with reason")

    def test_02_pegawai_resubmit(self, tokens):
        """Pegawai resubmits declined bon"""
        bon_id = pytest.decline_bon_id
        response = requests.put(
            f"{BASE_URL}/api/bon-sementara/{bon_id}/resubmit",
            headers=auth_header(tokens["pegawai"])
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Diajukan ulang"
        print("✓ Pegawai resubmitted bon - status back to pending")


class TestRealisasiWorkflow:
    """Test realisasi 3-level approval: hrga -> direktur -> finance (no atasan)"""
    
    def test_01_pegawai_create_realisasi(self, tokens):
        """Pegawai creates realisasi from approved bon"""
        # First get approved bons
        response = requests.get(
            f"{BASE_URL}/api/bon-sementara-approved",
            headers=auth_header(tokens["pegawai"])
        )
        assert response.status_code == 200
        approved_bons = response.json()
        
        if not approved_bons:
            pytest.skip("No approved bon available for realisasi test")
        
        bon_id = approved_bons[0]["id"]
        
        # Create realisasi
        payload = {
            "bon_sementara_id": bon_id,
            "periode": "2026-01-22",
            "items": [
                {"tanggal": "2026-01-20", "uraian": "Makan siang", "quantity": 1, "harga_per_unit": 50000, "total": 50000},
                {"tanggal": "2026-01-21", "uraian": "Transport taksi", "quantity": 2, "harga_per_unit": 100000, "total": 200000}
            ]
        }
        response = requests.post(
            f"{BASE_URL}/api/realisasi",
            json=payload,
            headers=auth_header(tokens["pegawai"])
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "pending"
        pytest.realisasi_id = data["id"]
        print(f"✓ Created realisasi with status 'pending'")

    def test_02_atasan_cannot_approve_realisasi(self, tokens):
        """Atasan should NOT be able to approve realisasi"""
        real_id = pytest.realisasi_id
        response = requests.put(
            f"{BASE_URL}/api/realisasi/{real_id}/approve",
            headers=auth_header(tokens["atasan"])
        )
        # Should fail - atasan is not in realisasi flow
        assert response.status_code == 400
        print("✓ Atasan correctly blocked from approving realisasi")

    def test_03_hrga_approve_realisasi(self, tokens):
        """HRGA approves realisasi: pending -> approved_hrga"""
        real_id = pytest.realisasi_id
        response = requests.put(
            f"{BASE_URL}/api/realisasi/{real_id}/approve",
            headers=auth_header(tokens["hrga"])
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "approved_hrga"
        print("✓ HRGA approved realisasi: pending -> approved_hrga")

    def test_04_direktur_approve_realisasi(self, tokens):
        """Direktur approves realisasi: approved_hrga -> approved_direktur"""
        real_id = pytest.realisasi_id
        response = requests.put(
            f"{BASE_URL}/api/realisasi/{real_id}/approve",
            headers=auth_header(tokens["direktur"])
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "approved_direktur"
        print("✓ Direktur approved realisasi: approved_hrga -> approved_direktur")

    def test_05_finance_approve_realisasi(self, tokens):
        """Finance approves realisasi: approved_direktur -> approved_finance"""
        real_id = pytest.realisasi_id
        response = requests.put(
            f"{BASE_URL}/api/realisasi/{real_id}/approve",
            headers=auth_header(tokens["finance"])
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "approved_finance"
        print("✓ Finance approved realisasi: approved_direktur -> approved_finance (FINAL)")


class TestApprovalOrderValidation:
    """Test that approvals must follow correct order"""
    
    def test_hrga_cannot_approve_pending_bon(self, tokens):
        """HRGA should not approve bon that's still pending (atasan hasn't approved)"""
        # Create a fresh bon
        payload = {
            "tujuan": "TEST_Order_Validation",
            "periode_mulai": "2026-03-01",
            "periode_selesai": "2026-03-03",
            "keperluan": "TEST_Order test",
            "jumlah": 500000
        }
        response = requests.post(
            f"{BASE_URL}/api/bon-sementara",
            json=payload,
            headers=auth_header(tokens["pegawai"])
        )
        bon_id = response.json()["id"]
        
        # HRGA tries to approve - should fail
        response = requests.put(
            f"{BASE_URL}/api/bon-sementara/{bon_id}/approve",
            headers=auth_header(tokens["hrga"])
        )
        assert response.status_code == 400
        print("✓ HRGA correctly blocked from approving pending bon")

    def test_finance_cannot_approve_early(self, tokens):
        """Finance cannot approve bon that hasn't been approved by direktur"""
        # Get a pending bon
        response = requests.get(
            f"{BASE_URL}/api/bon-sementara",
            headers=auth_header(tokens["pegawai"])
        )
        bons = [b for b in response.json() if b["status"] == "pending"]
        
        if not bons:
            pytest.skip("No pending bons available")
        
        bon_id = bons[0]["id"]
        
        # Finance tries to approve - should fail
        response = requests.put(
            f"{BASE_URL}/api/bon-sementara/{bon_id}/approve",
            headers=auth_header(tokens["finance"])
        )
        assert response.status_code == 400
        print("✓ Finance correctly blocked from approving bon out of order")


class TestDashboardStats:
    """Test dashboard statistics for all roles"""
    
    def test_pegawai_dashboard(self, tokens):
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers=auth_header(tokens["pegawai"])
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_bon" in data
        assert "total_realisasi" in data
        print(f"✓ Pegawai dashboard - bon: {data['total_bon']}, realisasi: {data['total_realisasi']}")

    def test_atasan_dashboard(self, tokens):
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers=auth_header(tokens["atasan"])
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Atasan dashboard - pending bon: {data['total_bon']}")

    def test_hrga_dashboard(self, tokens):
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers=auth_header(tokens["hrga"])
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✓ HRGA dashboard - bon: {data['total_bon']}, realisasi: {data['total_realisasi']}")

    def test_direktur_dashboard(self, tokens):
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers=auth_header(tokens["direktur"])
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Direktur dashboard - bon: {data['total_bon']}, realisasi: {data['total_realisasi']}")

    def test_finance_dashboard(self, tokens):
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers=auth_header(tokens["finance"])
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Finance dashboard - bon: {data['total_bon']}, realisasi: {data['total_realisasi']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
