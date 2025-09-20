#!/usr/bin/env python3
"""
Focused test to identify the exact issue with Quick-Expenses
"""

import asyncio
from playwright.async_api import async_playwright
import re

async def focused_debug():
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)
    page = await browser.new_page()
    
    # Capture all console messages with more detail
    console_messages = []
    
    def handle_console(msg):
        console_messages.append({
            'type': msg.type,
            'text': msg.text,
            'location': msg.location
        })
    
    page.on("console", handle_console)
    
    try:
        print("🔍 Focused debugging of Quick-Expenses...")
        
        # Navigate to Quick-Expenses page
        await page.goto("http://localhost:3000/setup/expenses")
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(5000)
        
        # Test the loadQuickExpenses function by checking the React component state
        result = await page.evaluate("""
            () => {
                // Try to access React component state through the DOM
                const root = document.querySelector('#root');
                if (root && root._reactInternalInstance) {
                    // Try to find the QuickExpenseManagement component
                    return { hasReactInstance: true };
                }
                
                // Check if there are any visible Quick-Expenses
                const expenseCards = document.querySelectorAll('.grid .border-2');
                const countElement = document.querySelector('h3');
                const countText = countElement ? countElement.textContent : '';
                
                return {
                    hasReactInstance: false,
                    visibleCards: expenseCards.length,
                    countText: countText,
                    pageContent: document.body.textContent.includes('Noch keine Quick-Expenses konfiguriert')
                };
            }
        """)
        
        print(f"Page state: {result}")
        
        # Now test adding a Quick-Expense step by step
        print("\n🔍 Testing add process step by step...")
        
        # Step 1: Click add button
        add_button = await page.query_selector('button:has-text("Quick-Expense hinzufügen")')
        if add_button:
            await add_button.click()
            await page.wait_for_timeout(1000)
            print("✅ Add button clicked")
        else:
            print("❌ Add button not found")
            return
        
        # Step 2: Fill form
        name_input = await page.query_selector('input[placeholder="z.B. Gemüse"]')
        amount_input = await page.query_selector('input[placeholder="25.00"]')
        
        if name_input and amount_input:
            await name_input.fill("Debug Test")
            await amount_input.fill("99.99")
            print("✅ Form filled")
        else:
            print("❌ Form inputs not found")
            return
        
        # Step 3: Submit and monitor console
        console_before_submit = len(console_messages)
        
        save_button = await page.query_selector('button:has-text("Hinzufügen")')
        if save_button:
            await save_button.click()
            await page.wait_for_timeout(3000)
            print("✅ Save button clicked")
        else:
            print("❌ Save button not found")
            return
        
        # Check what happened after submit
        console_after_submit = len(console_messages)
        new_messages = console_messages[console_before_submit:]
        
        print(f"New console messages after submit ({len(new_messages)}):")
        for msg in new_messages:
            print(f"  [{msg['type']}] {msg['text']}")
        
        # Check final state
        final_state = await page.evaluate("""
            () => {
                const countElement = document.querySelector('h3');
                const countText = countElement ? countElement.textContent : '';
                const expenseCards = document.querySelectorAll('.grid .border-2');
                const pageContent = document.body.textContent;
                
                return {
                    countText: countText,
                    visibleCards: expenseCards.length,
                    hasDebugTest: pageContent.includes('Debug Test'),
                    hasNoExpensesMessage: pageContent.includes('Noch keine Quick-Expenses konfiguriert')
                };
            }
        """)
        
        print(f"\nFinal state: {final_state}")
        
        # Analyze the issue
        print(f"\n🔍 Issue Analysis:")
        
        # Check if the form reset (indicating successful submission)
        form_reset = await page.evaluate("""
            () => {
                const nameInput = document.querySelector('input[placeholder="z.B. Gemüse"]');
                return nameInput ? nameInput.value === '' : false;
            }
        """)
        
        print(f"Form reset after submit: {form_reset}")
        
        # Check if add form is hidden (another indicator of successful submission)
        add_form_hidden = await page.query_selector('h3:has-text("Neue Quick-Expense hinzufügen")') is None
        print(f"Add form hidden after submit: {add_form_hidden}")
        
        # Summary
        if final_state['hasDebugTest'] and not final_state['hasNoExpensesMessage']:
            print("✅ Quick-Expense appears to be added to UI")
        elif final_state['hasNoExpensesMessage']:
            print("❌ Still showing 'no expenses' message")
        else:
            print("❓ Unclear state")
        
        if final_state['visibleCards'] > 0:
            print(f"✅ {final_state['visibleCards']} expense cards visible")
        else:
            print("❌ No expense cards visible")
        
        # Show all console messages for full context
        print(f"\nAll console messages ({len(console_messages)}):")
        for i, msg in enumerate(console_messages):
            print(f"  {i+1}. [{msg['type']}] {msg['text']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    finally:
        await browser.close()

if __name__ == "__main__":
    asyncio.run(focused_debug())