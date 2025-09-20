#!/usr/bin/env python3
"""
Debug database operations directly
"""

import asyncio
from playwright.async_api import async_playwright

async def debug_database():
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)
    page = await browser.new_page()
    
    # Capture all console messages
    console_messages = []
    page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))
    
    try:
        print("🔍 Debugging database operations...")
        
        # Navigate to any page to access the database
        await page.goto("http://localhost:3000")
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(3000)
        
        # Test database operations directly
        result = await page.evaluate("""
            async () => {
                try {
                    // Clear any existing database first
                    const deleteRequest = indexedDB.deleteDatabase('BookkeeperDB');
                    await new Promise((resolve, reject) => {
                        deleteRequest.onsuccess = () => resolve();
                        deleteRequest.onerror = () => reject(deleteRequest.error);
                    });
                    
                    // Import and initialize fresh database
                    const { initializeSampleData, db } = await import('./src/services/database.js');
                    
                    // Initialize sample data
                    await initializeSampleData();
                    
                    // Check what was actually created
                    const quickExpenseCount = await db.quickExpenses.count();
                    const quickExpenses = await db.quickExpenses.toArray();
                    
                    const menuCount = await db.menuItems.count();
                    const employeeCount = await db.employees.count();
                    
                    return {
                        success: true,
                        quickExpenseCount: quickExpenseCount,
                        quickExpenses: quickExpenses.map(e => ({ id: e.id, name: e.name, amount: e.defaultAmount })),
                        menuCount: menuCount,
                        employeeCount: employeeCount,
                        dbVersion: db.verno
                    };
                } catch (error) {
                    return { 
                        error: error.message, 
                        stack: error.stack,
                        name: error.name
                    };
                }
            }
        """)
        
        print(f"Database test result:")
        if 'error' in result:
            print(f"  ❌ Error: {result['error']}")
            print(f"  Error name: {result.get('name', 'Unknown')}")
        else:
            print(f"  ✅ Success: {result['success']}")
            print(f"  DB Version: {result['dbVersion']}")
            print(f"  Menu Items: {result['menuCount']}")
            print(f"  Employees: {result['employeeCount']}")
            print(f"  Quick-Expenses: {result['quickExpenseCount']}")
            print(f"  Quick-Expenses data: {result['quickExpenses']}")
        
        # Show console messages
        print(f"\nConsole messages ({len(console_messages)}):")
        for msg in console_messages:
            print(f"  {msg}")
        
        return result
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None
    
    finally:
        await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_database())