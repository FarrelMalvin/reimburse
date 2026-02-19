import requests
import json
from datetime import datetime, timedelta

# Backend URL from frontend/.env
BASE_URL = "https://cost-tracker-ui.preview.emergentagent.com/api"

class TestBonSementara:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.session = requests.Session()
    
    def login(self, email, password):
        """Login and get authentication token"""
        print(f"\n=== Testing Login ===")
        login_data = {
            "email": email,
            "password": password
        }
        
        response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
        print(f"Login Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['token']
            print(f"✅ Login successful for {email}")
            print(f"User: {data['user']['name']} - Role: {data['user']['role']}")
            return True
        else:
            print(f"❌ Login failed: {response.text}")
            return False
    
    def get_auth_headers(self):
        """Get authentication headers"""
        if not self.token:
            raise Exception("No token available. Please login first.")
        return {"Authorization": f"Bearer {self.token}"}
    
    def test_create_bon_sementara(self):
        """Test creating bon sementara with new EstimasiItem structure"""
        print(f"\n=== Testing Bon Sementara Creation with New EstimasiItem Structure ===")
        
        # Calculate dates for the trip
        start_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d")
        checkin_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        checkout_date = (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d")
        
        # Test data with the new EstimasiItem structure containing kategori and quantity
        bon_data = {
            "nik": "12345678",
            "jabatan": "Marketing Manager",
            "wilayah": "Jakarta",
            "tujuan": "Surabaya",
            "periode_mulai": start_date,
            "periode_selesai": end_date,
            "keperluan": "Kunjungan klien dan meeting prospek baru",
            "akomodasi": {
                "kota_tujuan": "Surabaya",
                "nama_hotel": "Hotel Majapahit",
                "check_in": checkin_date,
                "check_out": checkout_date,
                "harga_per_malam": 800000,
                "pembayaran": "Head Office"
            },
            "transportasi_berangkat": {
                "jenis": "Pesawat",
                "dari_kota": "Jakarta",
                "ke_kota": "Surabaya",
                "jam_berangkat": "08:00"
            },
            "transportasi_kembali": {
                "jenis": "Pesawat",
                "dari_kota": "Surabaya",
                "ke_kota": "Jakarta",
                "jam_berangkat": "18:00"
            },
            "estimasi_items": [
                {
                    "kategori": "konsumsi",
                    "uraian": "Makan siang",
                    "quantity": 3,
                    "jumlah": 150000
                },
                {
                    "kategori": "transportasi",
                    "uraian": "Taxi bandara",
                    "quantity": 2,
                    "jumlah": 200000
                },
                {
                    "kategori": "akomodasi",
                    "uraian": "Hotel",
                    "quantity": 2,
                    "jumlah": 500000
                }
            ],
            "jumlah": 850000
        }
        
        print("Request data:")
        print(json.dumps(bon_data, indent=2))
        
        try:
            response = self.session.post(
                f"{self.base_url}/bon-sementara",
                json=bon_data,
                headers=self.get_auth_headers()
            )
            
            print(f"\nResponse Status: {response.status_code}")
            
            if response.status_code == 200:
                response_data = response.json()
                print("✅ Bon sementara created successfully!")
                print(f"Bon ID: {response_data['id']}")
                print(f"No. Bon: {response_data['no_bon']}")
                
                # Verify estimasi_items structure
                estimasi_items = response_data.get('estimasi_items', [])
                print(f"\n=== Verifying EstimasiItems Structure ===")
                print(f"Number of items: {len(estimasi_items)}")
                
                for i, item in enumerate(estimasi_items):
                    print(f"\nItem {i+1}:")
                    print(f"  Kategori: {item.get('kategori', 'NOT FOUND')}")
                    print(f"  Uraian: {item.get('uraian', 'NOT FOUND')}")
                    print(f"  Quantity: {item.get('quantity', 'NOT FOUND')}")
                    print(f"  Jumlah: {item.get('jumlah', 'NOT FOUND')}")
                    
                    # Verify all required fields are present
                    required_fields = ['kategori', 'uraian', 'quantity', 'jumlah']
                    missing_fields = [field for field in required_fields if field not in item]
                    
                    if missing_fields:
                        print(f"  ❌ Missing fields: {missing_fields}")
                    else:
                        print(f"  ✅ All required fields present")
                
                # Store the created bon ID for further testing
                self.created_bon_id = response_data['id']
                return response_data
                
            else:
                print(f"❌ Failed to create bon sementara")
                print(f"Error: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Exception occurred: {str(e)}")
            return None
    
    def test_get_bon_sementara_list(self):
        """Test getting bon sementara list to verify data persistence"""
        print(f"\n=== Testing Bon Sementara List Retrieval ===")
        
        try:
            response = self.session.get(
                f"{self.base_url}/bon-sementara",
                headers=self.get_auth_headers()
            )
            
            print(f"Response Status: {response.status_code}")
            
            if response.status_code == 200:
                bons = response.json()
                print(f"✅ Retrieved {len(bons)} bon sementara records")
                
                # Find our created bon
                created_bon = None
                if hasattr(self, 'created_bon_id'):
                    created_bon = next((bon for bon in bons if bon['id'] == self.created_bon_id), None)
                
                if created_bon:
                    print(f"\n=== Verifying Saved Data ===")
                    print(f"Found created bon: {created_bon['no_bon']}")
                    
                    # Verify estimasi_items are saved correctly
                    estimasi_items = created_bon.get('estimasi_items', [])
                    print(f"Saved items count: {len(estimasi_items)}")
                    
                    expected_items = [
                        {"kategori": "konsumsi", "uraian": "Makan siang", "quantity": 3, "jumlah": 150000},
                        {"kategori": "transportasi", "uraian": "Taxi bandara", "quantity": 2, "jumlah": 200000},
                        {"kategori": "akomodasi", "uraian": "Hotel", "quantity": 2, "jumlah": 500000}
                    ]
                    
                    all_match = True
                    for i, expected_item in enumerate(expected_items):
                        if i < len(estimasi_items):
                            saved_item = estimasi_items[i]
                            for field, expected_value in expected_item.items():
                                saved_value = saved_item.get(field)
                                if saved_value != expected_value:
                                    print(f"❌ Mismatch in item {i+1}, field '{field}': expected {expected_value}, got {saved_value}")
                                    all_match = False
                        else:
                            print(f"❌ Missing item {i+1}")
                            all_match = False
                    
                    if all_match:
                        print("✅ All estimasi items saved correctly with proper structure")
                    else:
                        print("❌ Some data mismatch found")
                    
                    return True
                else:
                    print("⚠️ Could not find the created bon in the list")
                    return False
                    
            else:
                print(f"❌ Failed to retrieve bon list: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Exception occurred: {str(e)}")
            return False
    
    def run_tests(self):
        """Run all tests"""
        print("🧪 Starting Bon Sementara API Tests with New EstimasiItem Structure")
        print("="*70)
        
        # Test 1: Login as pegawai
        if not self.login("pegawai@kantor.com", "password123"):
            print("❌ Login failed, cannot continue tests")
            return False
        
        # Test 2: Create bon sementara with new struktur
        created_bon = self.test_create_bon_sementara()
        if not created_bon:
            print("❌ Bon creation failed, cannot continue tests")
            return False
        
        # Test 3: Verify data persistence
        if not self.test_get_bon_sementara_list():
            print("❌ Data verification failed")
            return False
        
        print("\n" + "="*70)
        print("🎉 All tests completed successfully!")
        return True

if __name__ == "__main__":
    tester = TestBonSementara()
    tester.run_tests()