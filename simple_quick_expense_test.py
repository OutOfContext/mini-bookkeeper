#!/usr/bin/env python3
"""
Simple test to check Quick-Expenses functionality
"""

import asyncio
from playwright.async_api import async_playwright
import re

async def test_quick_expenses():
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)
    page = await browser.new_page()
    
    # Capture console messages
    console_messages = []
    page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))
    
    try:
        print("🔍 Testing Quick-Expenses functionality...")
        
        # Navigate to Quick-Expenses page
        await page.goto("http://localhost:3000/setup/expenses")
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(3000)
        
        # Get initial count
        count_element = await page.wait_for_selector('h3:has-text("Konfigurierte Quick-Expenses")', timeout=10000)
        count_text = await count_element.text_content()
        initial_count_match = re.search(r'\((\d+)\)', count_text)
        initial_count = int(initial_count_match.group(1)) if initial_count_match else 0
        
        print(f"Initial count: {initial_count}")
        
        # Click add button
        add_button = await page.wait_for_selector('button:has-text("Quick-Expense hinzufügen")', timeout=10000)
        await add_button.click()
        await page.wait_for_timeout(1000)
        
        # Fill form with test data
        test_name = f"Test Expense {initial_count + 1}"
        test_amount = "25.99"
        
        name_input = await page.wait_for_selector('input[placeholder="z.B. Gemüse"]', timeout=5000)
        await name_input.fill(test_name)
        
        amount_input = await page.wait_for_selector('input[placeholder="25.00"]', timeout=5000)
        await amount_input.fill(test_amount)
        
        # Submit form
        save_button = await page.wait_for_selector('button:has-text("Hinzufügen")', timeout=5000)
        await save_button.click()
        
        # Wait for operation to complete
        await page.wait_for_timeout(3000)
        
        # Check new count
        updated_count_element = await page.wait_for_selector('h3:has-text("Konfigurierte Quick-Expenses")', timeout=10000)
        updated_count_text = await updated_count_element.text_content()
        updated_count_match = re.search(r'\((\d+)\)', updated_count_text)
        updated_count = int(updated_count_match.group(1)) if updated_count_match else 0
        
        print(f"Updated count: {updated_count}")
        
        # Check if the new expense appears in the list
        page_content = await page.content()
        found_in_ui = test_name in page_content and test_amount in page_content
        
        print(f"Found in UI: {found_in_ui}")
        print(f"Count increased: {updated_count > initial_count}")
        
        # Show console messages
        print(f"\nConsole messages ({len(console_messages)}):")
        for msg in console_messages[-10:]:  # Show last 10 messages
            print(f"  {msg}")
        
        # Final assessment
        success = updated_count > initial_count and found_in_ui
        print(f"\n{'✅ SUCCESS' if success else '❌ FAILED'}: Quick-Expenses {'working' if success else 'not working'}")
        
        return success
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    finally:
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_quick_expenses())