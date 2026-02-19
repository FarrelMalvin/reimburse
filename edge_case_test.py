import requests
import json
from datetime import datetime, timedelta

# Backend URL from frontend/.env
BASE_URL = "https://cost-tracker-ui.preview.emergentagent.com/api"

class TestBonSementaraEdgeCases:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.session = requests.Session()
    
    def login(self, email, password):
        """Login and get authentication token"""
        login_data = {"email": email, "password": password}
        response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['token']
            return True
        return False
    
    def get_auth_headers(self):
        """Get authentication headers"""
        if not self.token:
            raise Exception("No token available. Please login first.")
        return {"Authorization": f"Bearer {self.token}"}
    
    def test_empty_estimasi_items(self):
        """Test creating bon with empty estimasi_items"""
        print(f"\n=== Testing Empty Estimasi Items ===")
        
        start_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d")
        
        bon_data = {
            "nik": "12345678",
            "jabatan": "Test",
            "wilayah": "Jakarta",
            "tujuan": "Bandung",
            "periode_mulai": start_date,
            "periode_selesai": end_date,
            "keperluan": "Test trip",
            "estimasi_items": [],  # Empty array
            "jumlah": 0
        }
        
        response = self.session.post(
            f"{self.base_url}/bon-sementara",
            json=bon_data,
            headers=self.get_auth_headers()
        )
        
        print(f"Response Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Empty estimasi_items handled correctly")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False
    
    def test_missing_estimasi_items(self):
        """Test creating bon without estimasi_items field"""
        print(f"\n=== Testing Missing Estimasi Items Field ===")
        
        start_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d")
        
        bon_data = {
            "nik": "12345678",
            "jabatan": "Test",
            "wilayah": "Jakarta",
            "tujuan": "Bandung",
            "periode_mulai": start_date,
            "periode_selesai": end_date,
            "keperluan": "Test trip",
            # No estimasi_items field
            "jumlah": 100000
        }
        
        response = self.session.post(
            f"{self.base_url}/bon-sementara",
            json=bon_data,
            headers=self.get_auth_headers()
        )
        
        print(f"Response Status: {response.status_code}")
        if response.status_code == 200:
            response_data = response.json()
            estimasi_items = response_data.get('estimasi_items', [])
            print(f"✅ Missing estimasi_items handled correctly - got {len(estimasi_items)} items")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False
    
    def test_partial_estimasi_item_fields(self):
        """Test creating bon with estimasi items having some missing fields"""
        print(f"\n=== Testing Partial EstimasiItem Fields ===")
        
        start_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d")
        
        bon_data = {
            "nik": "12345678",
            "jabatan": "Test",
            "wilayah": "Jakarta",
            "tujuan": "Bandung",
            "periode_mulai": start_date,
            "periode_selesai": end_date,
            "keperluan": "Test trip",
            "estimasi_items": [
                {
                    "kategori": "konsumsi",
                    "uraian": "Makan siang"
                    # Missing quantity and jumlah - should use defaults
                },
                {
                    "uraian": "Transport",
                    "quantity": 2,
                    "jumlah": 100000
                    # Missing kategori - should use default empty string
                }
            ],
            "jumlah": 100000
        }
        
        response = self.session.post(
            f"{self.base_url}/bon-sementara",
            json=bon_data,
            headers=self.get_auth_headers()
        )
        
        print(f"Response Status: {response.status_code}")
        if response.status_code == 200:
            response_data = response.json()
            items = response_data.get('estimasi_items', [])
            
            print(f"Item 1 defaults: kategori='{items[0].get('kategori')}', quantity={items[0].get('quantity')}, jumlah={items[0].get('jumlah')}")
            print(f"Item 2 defaults: kategori='{items[1].get('kategori')}', uraian='{items[1].get('uraian')}'")
            
            # Check if defaults are applied correctly
            if (items[0].get('quantity') == 1 and items[0].get('jumlah') == 0 and
                items[1].get('kategori') == ""):
                print("✅ Default values applied correctly")
                return True
            else:
                print("❌ Default values not applied correctly")
                return False
        else:
            print(f"❌ Failed: {response.text}")
            return False
    
    def run_edge_case_tests(self):
        """Run all edge case tests"""
        print("🧪 Starting Bon Sementara Edge Case Tests")
        print("="*50)
        
        if not self.login("pegawai@kantor.com", "password123"):
            print("❌ Login failed")
            return False
        
        test_results = []
        test_results.append(self.test_empty_estimasi_items())
        test_results.append(self.test_missing_estimasi_items())
        test_results.append(self.test_partial_estimasi_item_fields())
        
        success_count = sum(test_results)
        total_tests = len(test_results)
        
        print(f"\n" + "="*50)
        print(f"Edge Case Tests: {success_count}/{total_tests} passed")
        
        if success_count == total_tests:
            print("🎉 All edge case tests passed!")
            return True
        else:
            print("⚠️ Some edge case tests failed")
            return False

if __name__ == "__main__":
    tester = TestBonSementaraEdgeCases()
    tester.run_edge_case_tests()