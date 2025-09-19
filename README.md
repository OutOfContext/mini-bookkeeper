This will be the bookkeeper web app:

PROMPT:

You are an expert web developer.
Please generate a **React + TypeScript + TailwindCSS web app** that implements the following concept:

## Goal
A simple bookkeeping app for a restaurant. 
The app is designed for **manual daily use** on an iPad, with minimal typing. 
Most actions should be done with **large, tappable buttons**. 
Data should be stored locally in the browser (IndexedDB or LocalStorage).

## Features

### 1. Stammdaten (setup, one-time)
- Menu Items: name, price, optional inventory link
- Employees: name, role, hourly wage
- Inventory Items: name, unit, start stock, minimum stock
- Initial cash register balance

### 2. Daily Operations (buttons only)
- **Sales**: Grid of buttons, one per menu item.
  - Tap = +1 sale
  - Prompt for payment type (cash / card)
  - Show daily totals (overall, cash, card)
- **Expenses**:
  - Predefined buttons (e.g. "Vegetables 20 €", "Cleaning 15 €")
  - Generic "Add expense" button for free input
- **Employees**:
  - Each employee has Check-in / Check-out buttons
  - Track worked hours
  - Automatically calculate wage
- **Inventory**:
  - List of items with traffic-light status (ok / low / empty)
  - Buttons: "+ Delivery", "- Consumption"
  - Optional link to menu items so sales reduce inventory automatically

### 3. Reports
- **Chef Report (short report)**:
  - Show: Total revenue, costs (expenses + staff), profit
  - Breakdown by payment type (cash / card)
  - Top-selling items
  - Inventory warnings
  - Switch view: Day / Week / Month
- **Daily Closing**:
  - Show: Previous day’s balance, today’s sales, expenses, staff costs
  - Input: actual cash counted
  - Output: difference between expected and actual
  - Save report

## UI Concept
- **Dashboard (home screen)** with big tiles:
  - "Start Sales"
  - "Book Expense"
  - "Employee Check-in/out"
  - "Inventory"
  - "Chef Report"
  - "Daily Closing"
- Color coding:
  - Green = Revenue
  - Red = Expenses
  - Blue = Employees
  - Yellow = Inventory
  - Gray = Reports/Closing
- All screens optimized for **iPad usage** with large, easy-to-tap buttons.

## Data Model
- DayRecord: date, startCash, salesCash, salesCard, expenses, endCash
- MenuItem: id, name, price, soldCount
- Sale: menuItemId, amount, paymentType, timestamp
- Employee: id, name, role, hourlyWage
- Shift: employeeId, start, end, duration, calculatedWage
- InventoryItem: id, name, unit, stock, minStock, purchasePrice
- InventoryChange: inventoryItemId, change, reason, timestamp

## Technical Requirements
- Use React + TypeScript + TailwindCSS
- Store data locally (IndexedDB or LocalStorage)
- Provide reusable components for:
  - ButtonGrid (menu items)
  - SummaryCards (totals, reports)
  - DataTables (expenses, shifts, inventory)
- Include demo/sample data for testing
- Focus on simplicity and clarity (POS-like design)
- Responsive design for iPad (landscape & portrait)

Please generate the **full React project structure** including:
- Components
- Pages (for each screen described)
- Context or Redux for state management
- Local storage hooks (IndexedDB/LocalStorage)
- Sample data for quick testing


Use this for reference!
