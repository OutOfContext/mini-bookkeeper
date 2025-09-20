#!/usr/bin/env python3

import requests
import json
import sys
import time
from datetime import datetime

class RestaurantAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = self.session.headers.copy()
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}", "PASS")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}", "FAIL")
                try:
                    self.log(f"Response: {response.json()}", "ERROR")
                except:
                    self.log(f"Response: {response.text}", "ERROR")
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}", "FAIL")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "../health",  # Health is not under /api
            200
        )
        return success

    def test_login(self, username, password):
        """Test login and get token"""
        success, response = self.run_test(
            f"Login ({username})",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and isinstance(response, dict) and 'accessToken' in response:
            self.token = response['accessToken']
            self.log(f"✅ Login successful, token received")
            return True
        return False

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        self.log("=== Testing Authentication ===")
        
        # Test login with valid credentials
        if not self.test_login("admin", "password123"):
            self.log("❌ Admin login failed, stopping auth tests")
            return False
            
        # Test refresh token
        success, response = self.run_test(
            "Token Refresh",
            "POST",
            "auth/refresh",
            200,
            data={"refreshToken": "dummy_token"}  # This will fail but we test the endpoint
        )
        
        return True

    def test_user_management(self):
        """Test user management endpoints"""
        self.log("=== Testing User Management ===")
        
        # Get all users
        success, users = self.run_test(
            "Get All Users",
            "GET",
            "users",
            200
        )
        
        if not success:
            return False
            
        # Create a new user
        new_user_data = {
            "username": f"testuser_{datetime.now().strftime('%H%M%S')}",
            "password": "testpass123"
        }
        
        success, created_user = self.run_test(
            "Create User",
            "POST",
            "users",
            201,
            data=new_user_data
        )
        
        if success and isinstance(created_user, dict) and 'id' in created_user:
            user_id = created_user['id']
            
            # Get specific user
            success, _ = self.run_test(
                "Get User by ID",
                "GET",
                f"users/{user_id}",
                200
            )
            
            # Update user
            update_data = {"username": f"updated_{new_user_data['username']}"}
            success, _ = self.run_test(
                "Update User",
                "PUT",
                f"users/{user_id}",
                200,
                data=update_data
            )
            
            # Delete user
            success, _ = self.run_test(
                "Delete User",
                "DELETE",
                f"users/{user_id}",
                200
            )
            
        return True

    def test_menu_management(self):
        """Test menu management endpoints"""
        self.log("=== Testing Menu Management ===")
        
        # Get categories
        success, categories = self.run_test(
            "Get Menu Categories",
            "GET",
            "menu/categories",
            200
        )
        
        if not success:
            return False
            
        # Get menu items
        success, items = self.run_test(
            "Get Menu Items",
            "GET",
            "menu/items",
            200
        )
        
        # Create a new category
        new_category = {
            "name": f"Test Category {datetime.now().strftime('%H%M%S')}",
            "description": "Test category description"
        }
        
        success, created_category = self.run_test(
            "Create Menu Category",
            "POST",
            "menu/categories",
            201,
            data=new_category
        )
        
        if success and isinstance(created_category, dict) and 'id' in created_category:
            category_id = created_category['id']
            
            # Create a menu item
            new_item = {
                "name": f"Test Item {datetime.now().strftime('%H%M%S')}",
                "description": "Test item description",
                "price": 12.99,
                "categoryId": category_id
            }
            
            success, created_item = self.run_test(
                "Create Menu Item",
                "POST",
                "menu/items",
                201,
                data=new_item
            )
            
            if success and isinstance(created_item, dict) and 'id' in created_item:
                item_id = created_item['id']
                
                # Update menu item
                update_data = {"price": 15.99}
                success, _ = self.run_test(
                    "Update Menu Item",
                    "PUT",
                    f"menu/items/{item_id}",
                    200,
                    data=update_data
                )
                
                # Delete menu item
                success, _ = self.run_test(
                    "Delete Menu Item",
                    "DELETE",
                    f"menu/items/{item_id}",
                    200
                )
            
            # Delete category
            success, _ = self.run_test(
                "Delete Menu Category",
                "DELETE",
                f"menu/categories/{category_id}",
                200
            )
        
        return True

    def test_session_management(self):
        """Test session management"""
        self.log("=== Testing Session Management ===")
        
        # Get current session
        success, session = self.run_test(
            "Get Current Session",
            "GET",
            "sessions/current",
            200
        )
        
        # Start a new session
        session_data = {
            "startingCash": 500.00
        }
        
        success, _ = self.run_test(
            "Start Session",
            "POST",
            "sessions/start",
            201,
            data=session_data
        )
        
        return success

    def test_sales_endpoints(self):
        """Test sales endpoints"""
        self.log("=== Testing Sales ===")
        
        # Get sales
        success, sales = self.run_test(
            "Get Sales",
            "GET",
            "sales",
            200
        )
        
        # Create a sale (need menu items first)
        success, items = self.run_test(
            "Get Menu Items for Sale",
            "GET",
            "menu/items",
            200
        )
        
        if success and isinstance(items, list) and len(items) > 0:
            item_id = items[0]['id']
            
            sale_data = {
                "items": [{"itemId": item_id, "quantity": 2}],
                "paymentType": "cash",
                "total": 25.98
            }
            
            success, _ = self.run_test(
                "Create Sale",
                "POST",
                "sales",
                201,
                data=sale_data
            )
        
        return success

    def test_employee_management(self):
        """Test employee management"""
        self.log("=== Testing Employee Management ===")
        
        # Get employees
        success, employees = self.run_test(
            "Get Employees",
            "GET",
            "employees",
            200
        )
        
        if success and isinstance(employees, list) and len(employees) > 0:
            employee_id = employees[0]['id']
            
            # Check in employee
            success, _ = self.run_test(
                "Employee Check In",
                "POST",
                f"employees/{employee_id}/checkin",
                200
            )
            
            # Check out employee
            success, _ = self.run_test(
                "Employee Check Out",
                "POST",
                f"employees/{employee_id}/checkout",
                200
            )
        
        return success

    def test_inventory_management(self):
        """Test inventory management"""
        self.log("=== Testing Inventory Management ===")
        
        # Get inventory
        success, inventory = self.run_test(
            "Get Inventory",
            "GET",
            "inventory",
            200
        )
        
        if success and isinstance(inventory, list) and len(inventory) > 0:
            item_id = inventory[0]['id']
            
            # Update inventory
            update_data = {"currentStock": 50}
            success, _ = self.run_test(
                "Update Inventory",
                "PUT",
                f"inventory/{item_id}",
                200,
                data=update_data
            )
        
        return success

    def test_expense_management(self):
        """Test expense management"""
        self.log("=== Testing Expense Management ===")
        
        # Get expenses
        success, expenses = self.run_test(
            "Get Expenses",
            "GET",
            "expenses",
            200
        )
        
        # Create expense
        expense_data = {
            "description": "Test expense",
            "amount": 25.50,
            "category": "supplies"
        }
        
        success, _ = self.run_test(
            "Create Expense",
            "POST",
            "expenses",
            201,
            data=expense_data
        )
        
        return success

    def test_reports(self):
        """Test reporting endpoints"""
        self.log("=== Testing Reports ===")
        
        # Get daily report
        success, _ = self.run_test(
            "Get Daily Report",
            "GET",
            "reports/daily",
            200
        )
        
        # Get weekly report
        success, _ = self.run_test(
            "Get Weekly Report",
            "GET",
            "reports/weekly",
            200
        )
        
        # Get monthly report
        success, _ = self.run_test(
            "Get Monthly Report",
            "GET",
            "reports/monthly",
            200
        )
        
        return success

    def test_session_specific_sales_functionality(self):
        """Test session-specific sales functionality as requested"""
        self.log("=== Testing Session-Specific Sales Functionality ===")
        
        # First login
        if not self.test_login("admin", "password123"):
            self.log("❌ Admin login failed, cannot test sales")
            return False
        
        time.sleep(1)
        
        # 1. Test Active Session Check
        success, active_session = self.run_test(
            "1. Get Active Session",
            "GET",
            "sessions/active",
            200
        )
        
        if not success:
            self.log("❌ Failed to check active session")
            return False
        
        # If no active session, start one for testing
        if not active_session:
            self.log("No active session found, starting new session for testing...")
            success, new_session = self.run_test(
                "Start New Session for Testing",
                "POST",
                "sessions/start",
                201,
                data={"name": "Session-Specific Sales Test"}
            )
            if not success:
                self.log("❌ Could not start session for testing")
                return False
            active_session = new_session
            self.log("✅ New session started successfully")
        else:
            self.log("✅ Active session found")
        
        session_start_time = active_session.get('startTime')
        self.log(f"Session start time: {session_start_time}")
        
        time.sleep(1)
        
        # 2. Test Menu Items Loading
        success, categories = self.run_test(
            "2. Get Menu Categories",
            "GET",
            "menu/categories",
            200
        )
        
        if not success or not isinstance(categories, list) or len(categories) == 0:
            self.log("❌ No menu categories available for testing")
            return False
        
        # Find a menu item to test with
        test_item = None
        for category in categories:
            if 'menuItems' in category and len(category['menuItems']) > 0:
                test_item = category['menuItems'][0]
                break
        
        if not test_item:
            self.log("❌ No menu items available for testing")
            return False
        
        self.log(f"✅ Using test item: {test_item['name']} (€{test_item['price']})")
        
        time.sleep(1)
        
        # 3. Test Session Sales Calculation - Get initial session sales
        success, initial_session_sales = self.run_test(
            "3. Get Initial Session Sales by Range",
            "GET",
            f"sales/range?startDate={session_start_time}&endDate={datetime.now().isoformat()}",
            200
        )
        
        if not success:
            self.log("❌ Failed to get session sales by range")
            return False
        
        initial_sales_count = len(initial_session_sales) if isinstance(initial_session_sales, list) else 0
        self.log(f"Initial session sales count: {initial_sales_count}")
        
        time.sleep(1)
        
        # 4. Test Sales Creation
        sale_data = {
            "menuItemId": test_item['id'],
            "amount": 2,
            "paymentType": "CASH"
        }
        
        success, sale_response = self.run_test(
            "4. Create Test Sale",
            "POST",
            "sales",
            200,  # FastAPI proxy returns 200 instead of 201
            data=sale_data
        )
        
        if not success:
            self.log("❌ Failed to create test sale")
            return False
        
        self.log("✅ Test sale created successfully")
        
        time.sleep(1)
        
        # 5. Test Session Totals Update - Get updated session sales
        success, updated_session_sales = self.run_test(
            "5. Get Updated Session Sales by Range",
            "GET",
            f"sales/range?startDate={session_start_time}&endDate={datetime.now().isoformat()}",
            200
        )
        
        if not success:
            self.log("❌ Failed to get updated session sales")
            return False
        
        updated_sales_count = len(updated_session_sales) if isinstance(updated_session_sales, list) else 0
        self.log(f"Updated session sales count: {updated_sales_count}")
        
        # Verify the sale was added to session
        if updated_sales_count > initial_sales_count:
            self.log("✅ Session sales count increased after creating sale")
        else:
            self.log("❌ Session sales count did not increase")
        
        # Calculate session-specific totals manually to verify
        session_totals = {"overall": 0, "cash": 0, "card": 0, "itemCount": 0}
        if isinstance(updated_session_sales, list):
            for sale in updated_session_sales:
                if 'menuItem' in sale and 'price' in sale['menuItem']:
                    sale_amount = sale['menuItem']['price'] * sale['amount']
                    session_totals['overall'] += sale_amount
                    session_totals['itemCount'] += sale['amount']
                    
                    if sale['paymentType'] == 'CASH':
                        session_totals['cash'] += sale_amount
                    else:
                        session_totals['card'] += sale_amount
        
        self.log(f"Calculated session totals: Overall=€{session_totals['overall']:.2f}, Cash=€{session_totals['cash']:.2f}, Card=€{session_totals['card']:.2f}, Items={session_totals['itemCount']}")
        
        time.sleep(1)
        
        # 6. Test that daily totals are different from session totals (if there are older sales)
        success, daily_totals = self.run_test(
            "6. Get Daily Sales Totals",
            "GET",
            "sales/today/totals",
            200
        )
        
        if success and isinstance(daily_totals, dict):
            self.log(f"Daily totals: Overall=€{daily_totals['overall']:.2f}, Cash=€{daily_totals['cash']:.2f}, Card=€{daily_totals['card']:.2f}, Items={daily_totals['itemCount']}")
            
            # The key test: session totals should be <= daily totals (session is subset of day)
            if session_totals['overall'] <= daily_totals['overall']:
                self.log("✅ Session totals are correctly subset of daily totals")
            else:
                self.log("❌ Session totals exceed daily totals - this shouldn't happen")
        
        # 7. Test New Session Scenario - Start a new session and verify zeros
        self.log("Testing new session scenario...")
        success, new_session_2 = self.run_test(
            "7. Start Another New Session",
            "POST",
            "sessions/start",
            200,  # FastAPI proxy returns 200 instead of 201
            data={"name": "New Session Zero Test"}
        )
        
        if success:
            new_session_start = new_session_2.get('startTime')
            time.sleep(1)
            
            # Get sales for this brand new session (should be empty)
            success, new_session_sales = self.run_test(
                "8. Get New Session Sales (Should be Empty)",
                "GET",
                f"sales/range?startDate={new_session_start}&endDate={datetime.now().isoformat()}",
                200
            )
            
            if success:
                new_session_count = len(new_session_sales) if isinstance(new_session_sales, list) else 0
                if new_session_count == 0:
                    self.log("✅ New session has zero sales as expected")
                else:
                    self.log(f"❌ New session has {new_session_count} sales, expected 0")
        
        return True

    def run_all_tests(self):
        """Run all API tests"""
        self.log("🚀 Starting Restaurant Bookkeeping API Tests")
        
        # Test health check first
        if not self.test_health_check():
            self.log("❌ Health check failed, stopping tests")
            return False
        
        # Test authentication
        if not self.test_auth_endpoints():
            self.log("❌ Authentication failed, stopping tests")
            return False
        
        # Test all other endpoints
        test_methods = [
            self.test_user_management,
            self.test_menu_management,
            self.test_session_management,
            self.test_sales_endpoints,
            self.test_employee_management,
            self.test_inventory_management,
            self.test_expense_management,
            self.test_reports
        ]
        
        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                self.log(f"❌ Error in {test_method.__name__}: {str(e)}", "ERROR")
        
        # Print final results
        self.log("=" * 50)
        self.log(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 All tests passed!")
            return True
        else:
            self.log(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False
    
    def run_session_sales_tests(self):
        """Run session-specific sales tests"""
        self.log("🚀 Starting Session-Specific Sales Tests")
        
        # Test health check first
        if not self.test_health_check():
            self.log("❌ Health check failed, stopping tests")
            return False
        
        # Run session-specific sales test
        success = self.test_session_specific_sales_functionality()
        
        # Print final results
        self.log("=" * 50)
        self.log(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 All tests passed!")
            return True
        else:
            self.log(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = RestaurantAPITester()
    # Run session-specific sales tests as requested
    success = tester.run_session_sales_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())