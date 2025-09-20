#!/usr/bin/env python3
"""
Debug Quick-Expenses functionality by testing directly in browser context
"""

import asyncio
from playwright.async_api import async_playwright

async def debug_quick_expenses():
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=False)  # Use headful for debugging
    page = await browser.new_page()
    
    # Enable console logging
    page.on("console", lambda msg: print(f"BROWSER: {msg.text}"))
    
    try:
        # Navigate to the Quick-Expenses page
        await page.goto("http://localhost:3000/setup/expenses")
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(3000)
        
        print("🔍 Testing Quick-Expenses functionality...")
        
        # Test database operations directly in the browser context
        result = await page.evaluate("""
            async () => {
                try {
                    // Access the database from the global window object
                    // First, let's see what's available
                    const dbModule = window.db || window.BookkeeperDB;
                    
                    if (!dbModule) {
                        // Try to access via React DevTools or global state
                        const reactFiber = document.querySelector('#root')._reactInternalInstance || 
                                         document.querySelector('#root')._reactInternals;
                        
                        return { error: 'Database not accessible', available: Object.keys(window) };
                    }
                    
                    // Test basic operations
                    const count = await dbModule.quickExpenses.count();
                    const expenses = await dbModule.quickExpenses.toArray();
                    
                    return {
                        success: true,
                        count: count,
                        expenses: expenses.map(e => ({ id: e.id, name: e.name, amount: e.defaultAmount }))
                    };
                } catch (error) {
                    return { error: error.message, stack: error.stack };
                }
            }
        """)
        
        print(f"Database test result: {result}")
        
        # Try a different approach - test the form submission
        print("\n🔍 Testing form submission...")
        
        # Click add button
        await page.click('button:has-text("Quick-Expense hinzufügen")')
        await page.wait_for_timeout(1000)
        
        # Fill the form
        await page.fill('input[placeholder="z.B. Gemüse"]', 'Debug Test Expense')
        await page.fill('input[placeholder="25.00"]', '99.99')
        
        # Monitor network activity
        requests = []
        page.on("request", lambda req: requests.append(req.url))
        
        # Submit the form
        await page.click('button:has-text("Hinzufügen")')
        await page.wait_for_timeout(3000)
        
        # Check if the count changed
        count_element = await page.query_selector('h3:has-text("Konfigurierte Quick-Expenses")')
        count_text = await count_element.text_content() if count_element else "Not found"
        
        print(f"Count after submission: {count_text}")
        print(f"Network requests: {requests[-5:] if requests else 'None'}")
        
        # Check browser console for errors
        await page.wait_for_timeout(2000)
        
    except Exception as e:
        print(f"Error: {e}")
    
    finally:
        await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_quick_expenses())