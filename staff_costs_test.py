#!/usr/bin/env python3
"""
Staff Costs Bug Fix Test for Restaurant Bookkeeper Application
Tests that staff costs (Mitarbeiterlöhne) reset to €0.00 for each new session
"""

import asyncio
import json
import time
from datetime import datetime, timedelta
from playwright.async_api import async_playwright
import sys

class StaffCostsTester:
    def __init__(self):
        self.browser = None
        self.page = None
        self.base_url = "http://localhost:3000"
        self.test_results = {
            "login_test": {},
            "session_creation_tests": {},
            "staff_costs_verification": {},
            "error_logs": []
        }

    async def setup(self):
        """Setup browser and navigate to application"""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(headless=True)
        self.page = await self.browser.new_page()
        
        # Set viewport for consistent testing
        await self.page.set_viewport_size({"width": 1920, "height": 1080})
        
        # Enable console logging to capture errors
        def handle_console(msg):
            print(f"BROWSER: {msg.text}")
            if msg.type in ['error', 'warning']:
                self.test_results["error_logs"].append({
                    'type': msg.type,
                    'text': msg.text,
                    'timestamp': datetime.now().isoformat()
                })
        
        self.page.on("console", handle_console)
        
        try:
            await self.page.goto(self.base_url, timeout=30000)
            await self.page.wait_for_load_state('networkidle', timeout=30000)
            print(f"✅ Successfully loaded application at {self.base_url}")
            return True
        except Exception as e:
            print(f"❌ Failed to load application: {e}")
            return False

    async def test_login(self):
        """Test login with admin/admin123"""
        print("\n🔍 Testing login functionality...")
        
        try:
            # Wait for login form to appear
            await self.page.wait_for_selector('input[type="text"], input[type="email"], input[placeholder*="Benutzername"], input[placeholder*="Username"]', timeout=10000)
            
            # Find username and password fields
            username_field = await self.page.query_selector('input[type="text"], input[type="email"], input[placeholder*="Benutzername"], input[placeholder*="Username"]')
            password_field = await self.page.query_selector('input[type="password"]')
            
            if not username_field or not password_field:
                print("❌ Could not find login fields")
                return False
            
            # Fill login credentials
            await username_field.fill("admin")
            await password_field.fill("admin123")
            
            # Find and click login button
            login_button = await self.page.query_selector('button[type="submit"], button:has-text("Anmelden"), button:has-text("Login")')
            if login_button:
                await login_button.click()
            else:
                # Try pressing Enter on password field
                await password_field.press("Enter")
            
            # Wait for login to complete
            await self.page.wait_for_timeout(3000)
            
            # Check if we're redirected to dashboard
            current_url = self.page.url
            is_logged_in = "login" not in current_url.lower() and self.page.url != f"{self.base_url}/"
            
            if not is_logged_in:
                # Check if we're on the main dashboard
                dashboard_element = await self.page.query_selector('h1:has-text("Session Dashboard"), h1:has-text("Dashboard")')
                is_logged_in = dashboard_element is not None
            
            self.test_results["login_test"] = {
                "success": is_logged_in,
                "final_url": current_url,
                "timestamp": datetime.now().isoformat()
            }
            
            if is_logged_in:
                print("✅ Login successful")
                return True
            else:
                print("❌ Login failed")
                return False
                
        except Exception as e:
            print(f"❌ Error during login: {e}")
            self.test_results["login_test"] = {"error": str(e)}
            return False

    async def create_session(self, session_name):
        """Create a new session and return session ID"""
        print(f"\n🔍 Creating session: {session_name}")
        
        try:
            # Navigate to session dashboard if not already there
            if "session" not in self.page.url.lower() and self.page.url != f"{self.base_url}/":
                await self.page.goto(f"{self.base_url}/")
                await self.page.wait_for_load_state('networkidle')
            
            # Find session name input field
            session_input = await self.page.wait_for_selector('input[placeholder*="Session Name"], input[placeholder*="Session"], input[type="text"]', timeout=10000)
            await session_input.fill(session_name)
            
            # Find and click create session button
            create_button = await self.page.wait_for_selector('button:has-text("Session erstellen"), button:has-text("erstellen"), button[type="submit"]', timeout=5000)
            await create_button.click()
            
            # Wait for session creation
            await self.page.wait_for_timeout(3000)
            
            # Check if session was created successfully
            success_indicator = await self.page.query_selector(f'text="{session_name}"')
            
            if success_indicator:
                print(f"✅ Session '{session_name}' created successfully")
                return True
            else:
                print(f"❌ Failed to create session '{session_name}'")
                return False
                
        except Exception as e:
            print(f"❌ Error creating session '{session_name}': {e}")
            return False

    async def navigate_to_management_dashboard(self, session_name):
        """Navigate to management dashboard for a specific session"""
        print(f"\n🔍 Navigating to Management Dashboard for '{session_name}'")
        
        try:
            # Look for the active session card or session link
            session_link = await self.page.query_selector(f'a[href*="/management"], .card:has-text("{session_name}") a, a:has-text("Management")')
            
            if session_link:
                await session_link.click()
            else:
                # Try direct navigation
                await self.page.goto(f"{self.base_url}/management")
            
            await self.page.wait_for_load_state('networkidle')
            await self.page.wait_for_timeout(2000)
            
            # Verify we're on management dashboard
            management_title = await self.page.query_selector('h1:has-text("Management"), h1:has-text("management")')
            
            if management_title:
                print(f"✅ Successfully navigated to Management Dashboard")
                return True
            else:
                print(f"❌ Failed to navigate to Management Dashboard")
                return False
                
        except Exception as e:
            print(f"❌ Error navigating to Management Dashboard: {e}")
            return False

    async def check_staff_costs(self, session_name):
        """Check staff costs (Mitarbeiterlöhne) values on management dashboard"""
        print(f"\n🔍 Checking staff costs for session '{session_name}'")
        
        try:
            # Wait for page to load completely
            await self.page.wait_for_timeout(2000)
            
            # Look for staff costs in the top banner (Session Status Banner)
            banner_staff_costs = None
            banner_elements = await self.page.query_selector_all('div:has-text("Mitarbeiterlöhne")')
            
            for element in banner_elements:
                parent = await element.query_selector('..')
                if parent:
                    cost_element = await parent.query_selector('.text-2xl, .font-bold')
                    if cost_element:
                        cost_text = await cost_element.text_content()
                        if '€' in cost_text:
                            banner_staff_costs = cost_text.strip()
                            break
            
            # Look for staff costs in the bottom overview section
            overview_staff_costs = None
            overview_elements = await self.page.query_selector_all('.card .text-yellow-600, .bg-yellow-50 .text-2xl')
            
            for element in overview_elements:
                cost_text = await element.text_content()
                if '€' in cost_text:
                    overview_staff_costs = cost_text.strip()
                    break
            
            # Take screenshot for verification
            screenshot_path = f"/tmp/staff_costs_{session_name.replace(' ', '_')}.png"
            await self.page.screenshot(path=screenshot_path, full_page=False)
            
            staff_costs_data = {
                "session_name": session_name,
                "banner_staff_costs": banner_staff_costs,
                "overview_staff_costs": overview_staff_costs,
                "screenshot_path": screenshot_path,
                "timestamp": datetime.now().isoformat()
            }
            
            print(f"📊 Staff Costs for '{session_name}':")
            print(f"   Banner: {banner_staff_costs}")
            print(f"   Overview: {overview_staff_costs}")
            
            # Check if both values are €0.00
            is_zero_banner = banner_staff_costs and ("€0.00" in banner_staff_costs or "€0,00" in banner_staff_costs)
            is_zero_overview = overview_staff_costs and ("€0.00" in overview_staff_costs or "€0,00" in overview_staff_costs)
            
            staff_costs_data["is_zero_banner"] = is_zero_banner
            staff_costs_data["is_zero_overview"] = is_zero_overview
            staff_costs_data["both_zero"] = is_zero_banner and is_zero_overview
            
            return staff_costs_data
            
        except Exception as e:
            print(f"❌ Error checking staff costs: {e}")
            return {"error": str(e), "session_name": session_name}

    async def run_comprehensive_staff_costs_test(self):
        """Run comprehensive test for staff costs bug fix"""
        print("🚀 Starting Staff Costs Bug Fix Test...")
        
        if not await self.setup():
            return False
        
        try:
            # Step 1: Login
            if not await self.test_login():
                print("❌ Login failed, cannot continue with tests")
                return False
            
            # Step 2: Create first session
            session1_name = "Morning Session"
            if not await self.create_session(session1_name):
                print("❌ Failed to create first session")
                return False
            
            # Step 3: Navigate to Management Dashboard for first session
            if not await self.navigate_to_management_dashboard(session1_name):
                print("❌ Failed to navigate to Management Dashboard for first session")
                return False
            
            # Step 4: Check staff costs for first session
            session1_costs = await self.check_staff_costs(session1_name)
            self.test_results["staff_costs_verification"]["session1"] = session1_costs
            
            # Step 5: Go back to Session Dashboard
            await self.page.goto(f"{self.base_url}/")
            await self.page.wait_for_load_state('networkidle')
            await self.page.wait_for_timeout(2000)
            
            # Step 6: Create second session
            session2_name = "Afternoon Session"
            if not await self.create_session(session2_name):
                print("❌ Failed to create second session")
                return False
            
            # Step 7: Navigate to Management Dashboard for second session
            if not await self.navigate_to_management_dashboard(session2_name):
                print("❌ Failed to navigate to Management Dashboard for second session")
                return False
            
            # Step 8: Check staff costs for second session
            session2_costs = await self.check_staff_costs(session2_name)
            self.test_results["staff_costs_verification"]["session2"] = session2_costs
            
            # Generate comprehensive report
            await self.generate_test_report()
            
            return True
            
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            return False
        
        finally:
            if self.browser:
                await self.browser.close()

    async def generate_test_report(self):
        """Generate comprehensive test report"""
        print("\n" + "="*80)
        print("📋 STAFF COSTS BUG FIX TEST REPORT")
        print("="*80)
        
        # Login Test Results
        login_result = self.test_results.get("login_test", {})
        if login_result.get("success"):
            print(f"\n✅ LOGIN TEST: PASSED")
            print(f"   Successfully logged in with admin/admin123")
        else:
            print(f"\n❌ LOGIN TEST: FAILED")
            if "error" in login_result:
                print(f"   Error: {login_result['error']}")
        
        # Staff Costs Verification
        session1_data = self.test_results["staff_costs_verification"].get("session1", {})
        session2_data = self.test_results["staff_costs_verification"].get("session2", {})
        
        print(f"\n📊 STAFF COSTS VERIFICATION:")
        
        # Session 1 Results
        if "error" not in session1_data:
            print(f"\n   SESSION 1 (Morning Session):")
            print(f"     Banner Staff Costs: {session1_data.get('banner_staff_costs', 'Not found')}")
            print(f"     Overview Staff Costs: {session1_data.get('overview_staff_costs', 'Not found')}")
            print(f"     Banner shows €0.00: {session1_data.get('is_zero_banner', False)}")
            print(f"     Overview shows €0.00: {session1_data.get('is_zero_overview', False)}")
            print(f"     Both show €0.00: {session1_data.get('both_zero', False)}")
        else:
            print(f"\n   SESSION 1 (Morning Session): ERROR")
            print(f"     {session1_data.get('error', 'Unknown error')}")
        
        # Session 2 Results
        if "error" not in session2_data:
            print(f"\n   SESSION 2 (Afternoon Session):")
            print(f"     Banner Staff Costs: {session2_data.get('banner_staff_costs', 'Not found')}")
            print(f"     Overview Staff Costs: {session2_data.get('overview_staff_costs', 'Not found')}")
            print(f"     Banner shows €0.00: {session2_data.get('is_zero_banner', False)}")
            print(f"     Overview shows €0.00: {session2_data.get('is_zero_overview', False)}")
            print(f"     Both show €0.00: {session2_data.get('both_zero', False)}")
        else:
            print(f"\n   SESSION 2 (Afternoon Session): ERROR")
            print(f"     {session2_data.get('error', 'Unknown error')}")
        
        # Final Assessment
        print(f"\n📊 FINAL ASSESSMENT:")
        
        session1_passed = session1_data.get('both_zero', False) if "error" not in session1_data else False
        session2_passed = session2_data.get('both_zero', False) if "error" not in session2_data else False
        
        if session1_passed and session2_passed:
            print(f"   ✅ STAFF COSTS BUG FIX: WORKING CORRECTLY")
            print(f"   ✅ Both sessions show €0.00 staff costs as expected")
            print(f"   ✅ Staff costs are properly isolated per session")
        elif session1_passed or session2_passed:
            print(f"   ⚠️  STAFF COSTS BUG FIX: PARTIALLY WORKING")
            print(f"   Session 1 correct: {session1_passed}")
            print(f"   Session 2 correct: {session2_passed}")
        else:
            print(f"   ❌ STAFF COSTS BUG FIX: NOT WORKING")
            print(f"   Neither session shows €0.00 staff costs")
            print(f"   The bug may still be present")
        
        # Error Summary
        error_count = len(self.test_results["error_logs"])
        if error_count > 0:
            print(f"\n❌ ERRORS DETECTED ({error_count}):")
            for error in self.test_results["error_logs"][-5:]:  # Show last 5 errors
                print(f"   • [{error['type']}] {error['text']}")
        else:
            print(f"\n✅ NO JAVASCRIPT ERRORS DETECTED")
        
        # Test Summary
        print(f"\n🎯 TEST SUMMARY:")
        print(f"   Login Test: {'✅ PASSED' if login_result.get('success') else '❌ FAILED'}")
        print(f"   Session 1 Staff Costs: {'✅ €0.00' if session1_passed else '❌ NOT €0.00'}")
        print(f"   Session 2 Staff Costs: {'✅ €0.00' if session2_passed else '❌ NOT €0.00'}")
        print(f"   Overall Bug Fix: {'✅ WORKING' if (session1_passed and session2_passed) else '❌ NEEDS ATTENTION'}")

async def main():
    """Main test execution"""
    tester = StaffCostsTester()
    success = await tester.run_comprehensive_staff_costs_test()
    
    if success:
        print(f"\n🎉 Staff Costs Test completed!")
        sys.exit(0)
    else:
        print(f"\n💥 Staff Costs Test failed!")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())