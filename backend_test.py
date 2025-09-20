#!/usr/bin/env python3
"""
Backend Test for Restaurant Bookkeeper Application
Tests Quick-Expenses functionality and IndexedDB operations
"""

import asyncio
import json
import time
from datetime import datetime, timedelta
from playwright.async_api import async_playwright
import sys

class QuickExpenseTester:
    def __init__(self):
        self.browser = None
        self.page = None
        self.base_url = "http://localhost:3000"
        self.test_results = {
            "quick_expenses_tests": {},
            "database_operations": {},
            "ui_functionality": {},
            "indexeddb_verification": {},
            "error_logs": []
        }

    async def setup(self):
        """Setup browser and navigate to application"""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(headless=True)
        self.page = await self.browser.new_page()
        
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

    async def check_indexeddb_schema(self):
        """Check if IndexedDB has the correct schema for quickExpenses"""
        print("\n🔍 Checking IndexedDB schema...")
        
        try:
            # Execute JavaScript to check IndexedDB schema
            schema_check = await self.page.evaluate("""
                async () => {
                    return new Promise((resolve) => {
                        const request = indexedDB.open('BookkeeperDB');
                        request.onsuccess = (event) => {
                            const db = event.target.result;
                            const objectStoreNames = Array.from(db.objectStoreNames);
                            const version = db.version;
                            
                            // Check if quickExpenses table exists
                            const hasQuickExpenses = objectStoreNames.includes('quickExpenses');
                            
                            resolve({
                                version: version,
                                objectStores: objectStoreNames,
                                hasQuickExpenses: hasQuickExpenses
                            });
                        };
                        request.onerror = () => resolve({ error: 'Failed to open database' });
                    });
                }
            """)
            
            self.test_results["indexeddb_verification"] = schema_check
            
            print(f"📊 IndexedDB Schema:")
            print(f"   Version: {schema_check.get('version', 'Unknown')}")
            print(f"   Object Stores: {schema_check.get('objectStores', [])}")
            print(f"   Has quickExpenses table: {schema_check.get('hasQuickExpenses', False)}")
            
            return schema_check
            
        except Exception as e:
            print(f"❌ Error checking IndexedDB schema: {e}")
            return None

    async def check_existing_quick_expenses(self):
        """Check existing Quick-Expenses in the database"""
        print("\n🔍 Checking existing Quick-Expenses...")
        
        try:
            # Navigate to Quick-Expenses page
            await self.page.goto(f"{self.base_url}/setup/expenses")
            await self.page.wait_for_load_state('networkidle')
            await self.page.wait_for_timeout(3000)
            
            # Get the count from the UI
            count_element = await self.page.wait_for_selector('h3:has-text("Konfigurierte Quick-Expenses")', timeout=10000)
            count_text = await count_element.text_content()
            
            # Extract count from text like "Konfigurierte Quick-Expenses (6)"
            import re
            count_match = re.search(r'\((\d+)\)', count_text)
            ui_count = int(count_match.group(1)) if count_match else 0
            
            # Check database directly via JavaScript
            db_count = await self.page.evaluate("""
                async () => {
                    try {
                        const { db } = await import('./src/services/database.js');
                        const count = await db.quickExpenses.count();
                        const expenses = await db.quickExpenses.toArray();
                        return { count: count, expenses: expenses };
                    } catch (error) {
                        return { error: error.message };
                    }
                }
            """)
            
            existing_data = {
                'ui_count': ui_count,
                'db_count': db_count.get('count', 0) if isinstance(db_count, dict) else 0,
                'db_expenses': db_count.get('expenses', []) if isinstance(db_count, dict) else [],
                'db_error': db_count.get('error') if isinstance(db_count, dict) else None
            }
            
            self.test_results["quick_expenses_tests"]["existing_data"] = existing_data
            
            print(f"📊 Existing Quick-Expenses:")
            print(f"   UI Count: {existing_data['ui_count']}")
            print(f"   DB Count: {existing_data['db_count']}")
            if existing_data['db_error']:
                print(f"   DB Error: {existing_data['db_error']}")
            
            return existing_data
            
        except Exception as e:
            print(f"❌ Error checking existing Quick-Expenses: {e}")
            return None

    async def test_add_quick_expense(self):
        """Test adding a new Quick-Expense"""
        print("\n🔍 Testing Quick-Expense addition...")
        
        try:
            # Navigate to Quick-Expenses page
            await self.page.goto(f"{self.base_url}/setup/expenses")
            await self.page.wait_for_load_state('networkidle')
            await self.page.wait_for_timeout(2000)
            
            # Get initial count
            initial_count_element = await self.page.wait_for_selector('h3:has-text("Konfigurierte Quick-Expenses")', timeout=10000)
            initial_count_text = await initial_count_element.text_content()
            import re
            initial_count_match = re.search(r'\((\d+)\)', initial_count_text)
            initial_count = int(initial_count_match.group(1)) if initial_count_match else 0
            
            print(f"   Initial count: {initial_count}")
            
            # Click "Quick-Expense hinzufügen" button
            add_button = await self.page.wait_for_selector('button:has-text("Quick-Expense hinzufügen")', timeout=10000)
            await add_button.click()
            await self.page.wait_for_timeout(1000)
            
            # Fill the form
            test_expense = {
                'name': 'Test Ausgabe',
                'amount': '15.50',
                'category': 'Food & Ingredients'
            }
            
            # Fill name field
            name_input = await self.page.wait_for_selector('input[placeholder="z.B. Gemüse"]', timeout=5000)
            await name_input.fill(test_expense['name'])
            
            # Fill amount field
            amount_input = await self.page.wait_for_selector('input[placeholder="25.00"]', timeout=5000)
            await amount_input.fill(test_expense['amount'])
            
            # Select category (should be default)
            category_select = await self.page.wait_for_selector('select', timeout=5000)
            await category_select.select_option(test_expense['category'])
            
            # Click save button
            save_button = await self.page.wait_for_selector('button:has-text("Hinzufügen")', timeout=5000)
            await save_button.click()
            
            # Wait for the operation to complete
            await self.page.wait_for_timeout(3000)
            
            # Check if count increased
            updated_count_element = await self.page.wait_for_selector('h3:has-text("Konfigurierte Quick-Expenses")', timeout=10000)
            updated_count_text = await updated_count_element.text_content()
            updated_count_match = re.search(r'\((\d+)\)', updated_count_text)
            updated_count = int(updated_count_match.group(1)) if updated_count_match else 0
            
            # Check if the new expense appears in the list
            expense_cards = await self.page.query_selector_all('.grid .border-2')
            found_test_expense = False
            
            for card in expense_cards:
                card_text = await card.text_content()
                if test_expense['name'] in card_text and test_expense['amount'] in card_text:
                    found_test_expense = True
                    break
            
            # Verify in database
            db_verification = await self.page.evaluate("""
                async () => {
                    try {
                        const { db } = await import('./src/services/database.js');
                        const expenses = await db.quickExpenses.toArray();
                        const testExpense = expenses.find(e => e.name === 'Test Ausgabe');
                        return { 
                            total: expenses.length, 
                            found: !!testExpense,
                            expense: testExpense 
                        };
                    } catch (error) {
                        return { error: error.message };
                    }
                }
            """)
            
            add_test_result = {
                'initial_count': initial_count,
                'updated_count': updated_count,
                'count_increased': updated_count > initial_count,
                'found_in_ui': found_test_expense,
                'db_verification': db_verification,
                'test_expense': test_expense
            }
            
            self.test_results["quick_expenses_tests"]["add_test"] = add_test_result
            
            print(f"📊 Add Test Results:")
            print(f"   Initial count: {add_test_result['initial_count']}")
            print(f"   Updated count: {add_test_result['updated_count']}")
            print(f"   Count increased: {add_test_result['count_increased']}")
            print(f"   Found in UI: {add_test_result['found_in_ui']}")
            print(f"   DB verification: {add_test_result['db_verification']}")
            
            return add_test_result
            
        except Exception as e:
            print(f"❌ Error testing Quick-Expense addition: {e}")
            return None

    async def test_database_operations(self):
        """Test direct database operations"""
        print("\n🔍 Testing database operations...")
        
        try:
            # Navigate to any page to have access to the database
            await self.page.goto(f"{self.base_url}/setup/expenses")
            await self.page.wait_for_load_state('networkidle')
            
            # Test database operations via JavaScript
            db_test = await self.page.evaluate("""
                async () => {
                    try {
                        // Import database
                        const { db } = await import('./src/services/database.js');
                        
                        // Test 1: Check if database is accessible
                        const isOpen = db.isOpen();
                        
                        // Test 2: Try to count quickExpenses
                        const count = await db.quickExpenses.count();
                        
                        // Test 3: Try to get all quickExpenses
                        const allExpenses = await db.quickExpenses.toArray();
                        
                        // Test 4: Try to add a test expense
                        const testId = 'test_' + Date.now();
                        await db.quickExpenses.add({
                            id: testId,
                            name: 'DB Test Expense',
                            defaultAmount: 99.99,
                            category: 'Test',
                            isActive: true,
                            color: 'blue'
                        });
                        
                        // Test 5: Verify the addition
                        const newCount = await db.quickExpenses.count();
                        const addedExpense = await db.quickExpenses.get(testId);
                        
                        // Test 6: Clean up - delete the test expense
                        await db.quickExpenses.delete(testId);
                        const finalCount = await db.quickExpenses.count();
                        
                        return {
                            isOpen: isOpen,
                            initialCount: count,
                            allExpenses: allExpenses.map(e => ({ id: e.id, name: e.name, amount: e.defaultAmount })),
                            addSuccess: !!addedExpense,
                            countAfterAdd: newCount,
                            countAfterDelete: finalCount,
                            addedExpense: addedExpense
                        };
                    } catch (error) {
                        return { error: error.message, stack: error.stack };
                    }
                }
            """)
            
            self.test_results["database_operations"] = db_test
            
            print(f"📊 Database Operations Test:")
            if 'error' in db_test:
                print(f"   ❌ Error: {db_test['error']}")
            else:
                print(f"   Database open: {db_test.get('isOpen', False)}")
                print(f"   Initial count: {db_test.get('initialCount', 0)}")
                print(f"   Add success: {db_test.get('addSuccess', False)}")
                print(f"   Count after add: {db_test.get('countAfterAdd', 0)}")
                print(f"   Count after delete: {db_test.get('countAfterDelete', 0)}")
                print(f"   Existing expenses: {len(db_test.get('allExpenses', []))}")
            
            return db_test
            
        except Exception as e:
            print(f"❌ Error testing database operations: {e}")
            return None

    async def diagnose_issue(self):
        """Diagnose why Quick-Expenses might not be saving"""
        print("\n🔍 Diagnosing Quick-Expenses issue...")
        
        try:
            # Navigate to Quick-Expenses page
            await self.page.goto(f"{self.base_url}/setup/expenses")
            await self.page.wait_for_load_state('networkidle')
            await self.page.wait_for_timeout(2000)
            
            # Check for JavaScript errors in console
            console_errors = [log for log in self.test_results["error_logs"] if log['type'] == 'error']
            
            # Check network requests
            network_requests = []
            
            def handle_request(request):
                network_requests.append({
                    'url': request.url,
                    'method': request.method,
                    'resource_type': request.resource_type
                })
            
            self.page.on("request", handle_request)
            
            # Try to add an expense and monitor what happens
            await self.page.click('button:has-text("Quick-Expense hinzufügen")')
            await self.page.wait_for_timeout(1000)
            
            # Fill form
            await self.page.fill('input[placeholder="z.B. Gemüse"]', 'Diagnose Test')
            await self.page.fill('input[placeholder="25.00"]', '10.00')
            
            # Click save and monitor
            await self.page.click('button:has-text("Hinzufügen")')
            await self.page.wait_for_timeout(3000)
            
            # Check final state
            final_count_element = await self.page.wait_for_selector('h3:has-text("Konfigurierte Quick-Expenses")', timeout=10000)
            final_count_text = await final_count_element.text_content()
            import re
            final_count_match = re.search(r'\((\d+)\)', final_count_text)
            final_count = int(final_count_match.group(1)) if final_count_match else 0
            
            diagnosis = {
                'console_errors': console_errors,
                'network_requests': network_requests[-10:],  # Last 10 requests
                'final_count': final_count,
                'page_url': self.page.url,
                'timestamp': datetime.now().isoformat()
            }
            
            self.test_results["ui_functionality"]["diagnosis"] = diagnosis
            
            print(f"🔍 Diagnosis Results:")
            print(f"   Console errors: {len(console_errors)}")
            for error in console_errors[-3:]:  # Show last 3 errors
                print(f"     • {error['text']}")
            print(f"   Network requests: {len(network_requests)}")
            print(f"   Final count: {final_count}")
            
            return diagnosis
            
        except Exception as e:
            print(f"❌ Error during diagnosis: {e}")
            return None

    async def run_comprehensive_test(self):
        """Run all tests and provide comprehensive analysis"""
        print("🚀 Starting comprehensive Quick-Expenses test...")
        
        if not await self.setup():
            return False
        
        try:
            # Run all tests
            schema = await self.check_indexeddb_schema()
            existing = await self.check_existing_quick_expenses()
            add_test = await self.test_add_quick_expense()
            db_ops = await self.test_database_operations()
            diagnosis = await self.diagnose_issue()
            
            # Generate comprehensive report
            print("\n" + "="*80)
            print("📋 QUICK-EXPENSES TEST REPORT")
            print("="*80)
            
            # Schema Analysis
            if schema:
                print(f"\n✅ INDEXEDDB SCHEMA:")
                if schema.get('hasQuickExpenses'):
                    print(f"   ✅ quickExpenses table exists (version {schema.get('version')})")
                else:
                    print(f"   ❌ quickExpenses table missing (version {schema.get('version')})")
                print(f"   Tables: {', '.join(schema.get('objectStores', []))}")
            
            # Existing Data Analysis
            if existing:
                print(f"\n✅ EXISTING DATA:")
                print(f"   UI shows: {existing['ui_count']} Quick-Expenses")
                print(f"   Database has: {existing['db_count']} Quick-Expenses")
                if existing['db_error']:
                    print(f"   ❌ Database error: {existing['db_error']}")
                else:
                    print(f"   ✅ Database accessible")
            
            # Add Test Analysis
            if add_test:
                print(f"\n✅ ADD FUNCTIONALITY TEST:")
                if add_test['count_increased'] and add_test['found_in_ui']:
                    print(f"   ✅ Quick-Expense addition WORKING")
                    print(f"   Count: {add_test['initial_count']} → {add_test['updated_count']}")
                    print(f"   UI updated: {add_test['found_in_ui']}")
                else:
                    print(f"   ❌ Quick-Expense addition FAILED")
                    print(f"   Count changed: {add_test['count_increased']}")
                    print(f"   Found in UI: {add_test['found_in_ui']}")
                    if add_test['db_verification'].get('error'):
                        print(f"   DB Error: {add_test['db_verification']['error']}")
            
            # Database Operations Analysis
            if db_ops:
                print(f"\n✅ DATABASE OPERATIONS:")
                if 'error' in db_ops:
                    print(f"   ❌ Database operations FAILED: {db_ops['error']}")
                else:
                    print(f"   ✅ Database operations WORKING")
                    print(f"   Add/Delete cycle successful: {db_ops.get('addSuccess', False)}")
                    print(f"   Database accessible: {db_ops.get('isOpen', False)}")
            
            # Error Analysis
            error_count = len(self.test_results["error_logs"])
            if error_count > 0:
                print(f"\n❌ ERRORS DETECTED ({error_count}):")
                for error in self.test_results["error_logs"][-5:]:  # Show last 5 errors
                    print(f"   • [{error['type']}] {error['text']}")
            else:
                print(f"\n✅ NO JAVASCRIPT ERRORS DETECTED")
            
            # Final Assessment
            print(f"\n📊 FINAL ASSESSMENT:")
            
            # Determine if Quick-Expenses are working
            schema_ok = schema and schema.get('hasQuickExpenses', False)
            db_ops_ok = db_ops and not 'error' in db_ops and db_ops.get('addSuccess', False)
            add_test_ok = add_test and add_test.get('count_increased', False) and add_test.get('found_in_ui', False)
            
            if schema_ok and db_ops_ok and add_test_ok:
                print(f"   ✅ Quick-Expenses functionality is WORKING")
                print(f"   ✅ Database schema is correct")
                print(f"   ✅ CRUD operations are functional")
                print(f"   ✅ UI updates correctly")
            else:
                print(f"   ❌ Quick-Expenses functionality has ISSUES")
                if not schema_ok:
                    print(f"      • Database schema issue")
                if not db_ops_ok:
                    print(f"      • Database operations failing")
                if not add_test_ok:
                    print(f"      • UI add functionality not working")
            
            return True
            
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            return False
        
        finally:
            if self.browser:
                await self.browser.close()

async def main():
    """Main test execution"""
    tester = QuickExpenseTester()
    success = await tester.run_comprehensive_test()
    
    if success:
        print(f"\n🎉 Test completed successfully!")
        sys.exit(0)
    else:
        print(f"\n💥 Test failed!")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())