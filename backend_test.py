#!/usr/bin/env python3
"""
Backend API Testing for KantorPlus System
Tests the complete bon/reimbursement approval workflow and all API endpoints
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, List, Optional

class KantorPlusAPITester:
    def __init__(self, base_url: str = "https://request-tracker-54.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tokens = {}  # Store tokens for each user role
        self.users = {}   # Store user data
        self.test_data = {}  # Store created test data
        self.tests_run = 0
        self.tests_passed = 0
        
        # Test users
        self.test_users = {
            "pegawai": {"email": "pegawai@kantor.com", "password": "password123"},
            "atasan": {"email": "atasan@kantor.com", "password": "password123"},
            "finance": {"email": "finance@kantor.com", "password": "password123"}
        }

    def log(self, message: str, level: str = "INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None) -> tuple:
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}", "ERROR")
                if response.text:
                    self.log(f"   Response: {response.text}", "ERROR")

            try:
                response_data = response.json()
            except:
                response_data = {"raw": response.text}

            return success, response_data, response.status_code

        except Exception as e:
            self.log(f"❌ {name} - Exception: {str(e)}", "ERROR")
            return False, {"error": str(e)}, 0

    def test_authentication(self) -> bool:
        """Test authentication for all user roles"""
        self.log("\n🔐 Testing Authentication...")
        auth_success = True
        
        for role, credentials in self.test_users.items():
            success, response, status = self.run_test(
                f"Login {role}",
                "POST",
                "auth/login",
                200,
                data=credentials
            )
            
            if success and 'token' in response:
                self.tokens[role] = response['token']
                self.users[role] = response['user']
                self.log(f"✅ {role} login successful - User: {response['user']['name']}")
            else:
                auth_success = False
                self.log(f"❌ {role} login failed", "ERROR")
        
        return auth_success

    def test_dashboard_stats(self):
        """Test dashboard statistics for all roles"""
        self.log("\n📊 Testing Dashboard Stats...")
        
        for role in self.test_users.keys():
            if role in self.tokens:
                headers = {"Authorization": f"Bearer {self.tokens[role]}"}
                success, response, status = self.run_test(
                    f"Dashboard stats for {role}",
                    "GET",
                    "dashboard/stats",
                    200,
                    headers=headers
                )
                
                if success:
                    required_fields = ['total_bon', 'pengaduan_aktif', 'total_cuti', 'total_inventaris']
                    missing_fields = [field for field in required_fields if field not in response]
                    if missing_fields:
                        self.log(f"❌ Missing fields in {role} stats: {missing_fields}", "ERROR")
                    else:
                        self.log(f"✅ {role} dashboard stats complete: {response}")

    def test_dashboard_preview(self):
        """Test new dashboard preview endpoint for all roles"""
        self.log("\n🔍 Testing Dashboard Preview...")
        
        for role in self.test_users.keys():
            if role in self.tokens:
                headers = {"Authorization": f"Bearer {self.tokens[role]}"}
                success, response, status = self.run_test(
                    f"Dashboard preview for {role}",
                    "GET",
                    "dashboard/preview",
                    200,
                    headers=headers
                )
                
                if success:
                    required_fields = ['bons', 'pengaduan', 'cuti', 'inventaris', 'bon_stats']
                    missing_fields = [field for field in required_fields if field not in response]
                    if missing_fields:
                        self.log(f"❌ Missing fields in {role} preview: {missing_fields}", "ERROR")
                    else:
                        # Check bon_stats structure
                        bon_stats = response.get('bon_stats', {})
                        required_stats = ['pending', 'approved', 'declined']
                        missing_stats = [stat for stat in required_stats if stat not in bon_stats]
                        if missing_stats:
                            self.log(f"❌ Missing bon_stats in {role} preview: {missing_stats}", "ERROR")
                        else:
                            self.log(f"✅ {role} dashboard preview complete - Bons: {len(response['bons'])}, Pengaduan: {len(response['pengaduan'])}, Cuti: {len(response['cuti'])}, Inventaris: {len(response['inventaris'])}")
                            self.log(f"   Bon stats: Pending: {bon_stats['pending']}, Approved: {bon_stats['approved']}, Declined: {bon_stats['declined']}")

    def test_bon_workflow(self) -> bool:
        """Test complete bon approval workflow"""
        self.log("\n💰 Testing Bon Approval Workflow...")
        
        # Step 1: Pegawai creates bon
        if 'pegawai' not in self.tokens:
            self.log("❌ Pegawai token not available", "ERROR")
            return False
            
        headers = {"Authorization": f"Bearer {self.tokens['pegawai']}"}
        bon_data = {
            "judul": "Test Transport Reimbursement",
            "deskripsi": "Transport costs for client meeting at Jakarta office",
            "jumlah": 250000.0,
            "foto": None
        }
        
        success, response, status = self.run_test(
            "Create bon (pegawai)",
            "POST",
            "bon",
            200,
            data=bon_data,
            headers=headers
        )
        
        if not success:
            return False
            
        bon_id = response.get('id')
        if not bon_id:
            self.log("❌ No bon ID returned", "ERROR")
            return False
            
        self.test_data['bon_id'] = bon_id
        self.log(f"✅ Bon created with ID: {bon_id}")
        
        # Step 2: Atasan approves bon
        if 'atasan' not in self.tokens:
            self.log("❌ Atasan token not available", "ERROR")
            return False
            
        headers = {"Authorization": f"Bearer {self.tokens['atasan']}"}
        success, response, status = self.run_test(
            "Approve bon (atasan)",
            "PUT",
            f"bon/{bon_id}/approve",
            200,
            headers=headers
        )
        
        if not success:
            return False
            
        # Step 3: Finance approves bon
        if 'finance' not in self.tokens:
            self.log("❌ Finance token not available", "ERROR")
            return False
            
        headers = {"Authorization": f"Bearer {self.tokens['finance']}"}
        success, response, status = self.run_test(
            "Final approve bon (finance)",
            "PUT",
            f"bon/{bon_id}/approve",
            200,
            headers=headers
        )
        
        if not success:
            return False
        
        # Step 4: Test PDF generation
        success, response, status = self.run_test(
            "Generate PDF",
            "GET",
            f"bon/{bon_id}/pdf",
            200,
            headers=headers
        )
        
        if success:
            self.log("✅ Complete bon approval workflow successful!")
            return True
        else:
            self.log("❌ PDF generation failed", "ERROR")
            return False

    def test_bon_decline_workflow(self) -> bool:
        """Test bon decline and resubmit workflow"""
        self.log("\n❌ Testing Bon Decline Workflow...")
        
        # Create another bon
        headers = {"Authorization": f"Bearer {self.tokens['pegawai']}"}
        bon_data = {
            "judul": "Test Meal Allowance",
            "deskripsi": "Meal allowance for overtime work",
            "jumlah": 150000.0
        }
        
        success, response, status = self.run_test(
            "Create bon for decline test",
            "POST",
            "bon",
            200,
            data=bon_data,
            headers=headers
        )
        
        if not success:
            return False
            
        decline_bon_id = response.get('id')
        
        # Atasan declines the bon
        headers = {"Authorization": f"Bearer {self.tokens['atasan']}"}
        decline_data = {"reason": "Insufficient documentation provided"}
        
        success, response, status = self.run_test(
            "Decline bon (atasan)",
            "PUT",
            f"bon/{decline_bon_id}/decline",
            200,
            data=decline_data,
            headers=headers
        )
        
        if not success:
            return False
        
        # Pegawai resubmits the bon
        headers = {"Authorization": f"Bearer {self.tokens['pegawai']}"}
        success, response, status = self.run_test(
            "Resubmit declined bon",
            "PUT",
            f"bon/{decline_bon_id}/resubmit",
            200,
            headers=headers
        )
        
        return success

    def test_pengaduan_crud(self) -> bool:
        """Test pengaduan (complaints) CRUD operations"""
        self.log("\n📝 Testing Pengaduan Operations...")
        
        # Create pengaduan
        headers = {"Authorization": f"Bearer {self.tokens['pegawai']}"}
        pengaduan_data = {
            "judul": "AC Not Working in Office",
            "deskripsi": "The air conditioning unit in the main office has been malfunctioning for 3 days",
            "kategori": "Fasilitas"
        }
        
        success, response, status = self.run_test(
            "Create pengaduan",
            "POST",
            "pengaduan",
            200,
            data=pengaduan_data,
            headers=headers
        )
        
        if not success:
            return False
        
        # Get pengaduan list
        success, response, status = self.run_test(
            "Get pengaduan list",
            "GET",
            "pengaduan",
            200,
            headers=headers
        )
        
        return success

    def test_cuti_crud(self) -> bool:
        """Test cuti (leave) CRUD operations"""
        self.log("\n🏖️ Testing Cuti Operations...")
        
        # Create cuti request
        headers = {"Authorization": f"Bearer {self.tokens['pegawai']}"}
        cuti_data = {
            "tanggal_mulai": "2024-03-15",
            "tanggal_selesai": "2024-03-17",
            "jenis": "Tahunan",
            "alasan": "Family vacation - annual leave"
        }
        
        success, response, status = self.run_test(
            "Create cuti request",
            "POST",
            "cuti",
            200,
            data=cuti_data,
            headers=headers
        )
        
        if not success:
            return False
        
        # Get cuti list
        success, response, status = self.run_test(
            "Get cuti list",
            "GET",
            "cuti",
            200,
            headers=headers
        )
        
        return success

    def test_inventaris_crud(self) -> bool:
        """Test inventaris (inventory) CRUD operations"""
        self.log("\n📦 Testing Inventaris Operations...")
        
        # Create inventaris item
        headers = {"Authorization": f"Bearer {self.tokens['pegawai']}"}
        inventaris_data = {
            "nama": "Dell Laptop OptiPlex 3090",
            "kategori": "Elektronik",
            "jumlah": 2,
            "kondisi": "Baik",
            "lokasi": "IT Department - Floor 2"
        }
        
        success, response, status = self.run_test(
            "Create inventaris item",
            "POST",
            "inventaris",
            200,
            data=inventaris_data,
            headers=headers
        )
        
        if not success:
            return False
        
        # Get inventaris list
        success, response, status = self.run_test(
            "Get inventaris list",
            "GET",
            "inventaris",
            200,
            headers=headers
        )
        
        return success

    def test_notifications(self) -> bool:
        """Test notification system"""
        self.log("\n🔔 Testing Notifications...")
        
        # Get notifications for pegawai (should have notifications from bon workflow)
        headers = {"Authorization": f"Bearer {self.tokens['pegawai']}"}
        success, response, status = self.run_test(
            "Get notifications",
            "GET",
            "notifications",
            200,
            headers=headers
        )
        
        if success and isinstance(response, list):
            self.log(f"✅ Found {len(response)} notifications")
            if response:
                # Mark all notifications as read
                success, _, _ = self.run_test(
                    "Mark all notifications as read",
                    "PUT",
                    "notifications/read-all",
                    200,
                    headers=headers
                )
                return success
        
        return success

    def test_error_handling(self):
        """Test various error scenarios"""
        self.log("\n🚫 Testing Error Handling...")
        
        # Test unauthorized access
        self.run_test(
            "Unauthorized access test",
            "GET",
            "dashboard/stats",
            401
        )
        
        # Test invalid login
        self.run_test(
            "Invalid login test",
            "POST",
            "auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrongpass"}
        )
        
        # Test creating bon without required fields
        headers = {"Authorization": f"Bearer {self.tokens['pegawai']}"}
        self.run_test(
            "Create bon with missing fields",
            "POST",
            "bon",
            422,  # Pydantic validation error
            data={"judul": "Incomplete"},
            headers=headers
        )

    def run_all_tests(self) -> bool:
        """Run the complete test suite"""
        self.log("🚀 Starting KantorPlus Backend API Tests")
        self.log(f"Base URL: {self.base_url}")
        
        start_time = datetime.now()
        
        # Core authentication test
        if not self.test_authentication():
            self.log("❌ Authentication failed - stopping tests", "ERROR")
            return False
        
        # Run all test modules
        test_results = [
            self.test_dashboard_stats(),
            self.test_bon_workflow(),
            self.test_bon_decline_workflow(),
            self.test_pengaduan_crud(),
            self.test_cuti_crud(),
            self.test_inventaris_crud(),
            self.test_notifications(),
        ]
        
        # Error handling tests (always run)
        self.test_error_handling()
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Final report
        self.log(f"\n📊 Test Results Summary:")
        self.log(f"   Tests Run: {self.tests_run}")
        self.log(f"   Tests Passed: {self.tests_passed}")
        self.log(f"   Tests Failed: {self.tests_run - self.tests_passed}")
        self.log(f"   Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        self.log(f"   Duration: {duration:.2f} seconds")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 All tests passed!")
            return True
        else:
            self.log("⚠️  Some tests failed - check logs above", "ERROR")
            return False

def main():
    """Main test runner"""
    tester = KantorPlusAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n\n🛑 Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n💥 Test suite crashed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())