#!/usr/bin/env python3
"""
Test Quick-Expenses UI functionality without trying to import modules
"""

import asyncio
from playwright.async_api import async_playwright
import re

async def test_ui_functionality():
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)
    page = await browser.new_page()
    
    # Capture console messages
    console_messages = []
    errors = []
    
    def handle_console(msg):
        console_messages.append(f"[{msg.type}] {msg.text}")
        if msg.type == 'error':
            errors.append(msg.text)
    
    page.on("console", handle_console)
    
    try:
        print("🔍 Testing Quick-Expenses UI functionality...")
        
        # Navigate to Quick-Expenses page
        await page.goto("http://localhost:3000/setup/expenses")
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(5000)  # Wait longer for initialization
        
        # Check if the page loaded correctly
        page_title = await page.title()
        print(f"Page title: {page_title}")
        
        # Check if the main elements are present
        header = await page.query_selector('h1:has-text("Quick-Expenses verwalten")')
        add_button = await page.query_selector('button:has-text("Quick-Expense hinzufügen")')
        count_element = await page.query_selector('h3:has-text("Konfigurierte Quick-Expenses")')
        
        print(f"Header present: {header is not None}")
        print(f"Add button present: {add_button is not None}")
        print(f"Count element present: {count_element is not None}")
        
        if count_element:
            count_text = await count_element.text_content()
            count_match = re.search(r'\((\d+)\)', count_text)
            initial_count = int(count_match.group(1)) if count_match else 0
            print(f"Initial count: {initial_count}")
        else:
            initial_count = 0
            print("Could not find count element")
        
        # Check if there are any Quick-Expenses cards visible
        expense_cards = await page.query_selector_all('.grid .border-2')
        print(f"Visible expense cards: {len(expense_cards)}")
        
        # If there are cards, get their details
        if expense_cards:
            print("Existing Quick-Expenses:")
            for i, card in enumerate(expense_cards[:3]):  # Show first 3
                card_text = await card.text_content()
                # Extract name and amount from card text
                lines = [line.strip() for line in card_text.split('\n') if line.strip()]
                print(f"  Card {i+1}: {lines[:3]}")  # Show first 3 lines
        
        # Test adding a new Quick-Expense
        if add_button:
            print("\n🔍 Testing add functionality...")
            await add_button.click()
            await page.wait_for_timeout(1000)
            
            # Check if form appeared
            form_title = await page.query_selector('h3:has-text("Neue Quick-Expense hinzufügen")')
            print(f"Add form appeared: {form_title is not None}")
            
            if form_title:
                # Fill the form
                test_name = f"UI Test Expense"
                test_amount = "15.50"
                
                name_input = await page.query_selector('input[placeholder="z.B. Gemüse"]')
                amount_input = await page.query_selector('input[placeholder="25.00"]')
                save_button = await page.query_selector('button:has-text("Hinzufügen")')
                
                if name_input and amount_input and save_button:
                    await name_input.fill(test_name)
                    await amount_input.fill(test_amount)
                    
                    print(f"Form filled with: {test_name}, €{test_amount}")
                    
                    # Submit the form
                    await save_button.click()
                    await page.wait_for_timeout(3000)
                    
                    # Check if count changed
                    updated_count_element = await page.query_selector('h3:has-text("Konfigurierte Quick-Expenses")')
                    if updated_count_element:
                        updated_count_text = await updated_count_element.text_content()
                        updated_count_match = re.search(r'\((\d+)\)', updated_count_text)
                        updated_count = int(updated_count_match.group(1)) if updated_count_match else 0
                        print(f"Updated count: {updated_count}")
                        print(f"Count increased: {updated_count > initial_count}")
                        
                        # Check if the new expense appears
                        page_content = await page.content()
                        found_in_ui = test_name in page_content
                        print(f"New expense found in UI: {found_in_ui}")
                        
                        # Final assessment
                        success = updated_count > initial_count or found_in_ui
                        print(f"\n{'✅ SUCCESS' if success else '❌ FAILED'}: Add functionality {'working' if success else 'not working'}")
                    else:
                        print("Could not find updated count element")
                else:
                    print("Could not find form elements")
            else:
                print("Add form did not appear")
        else:
            print("Add button not found")
        
        # Show any errors
        if errors:
            print(f"\n❌ JavaScript Errors ({len(errors)}):")
            for error in errors:
                print(f"  • {error}")
        else:
            print(f"\n✅ No JavaScript errors detected")
        
        # Show recent console messages
        print(f"\nRecent console messages:")
        for msg in console_messages[-5:]:
            print(f"  {msg}")
        
        return len(errors) == 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    finally:
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_ui_functionality())