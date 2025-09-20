You are an expert full-stack developer. 
Please generate a **single-container Node.js application** with:

- React + TypeScript + TailwindCSS frontend
- Express.js backend
- PostgreSQL database integration (with Prisma ORM)
- Authentication (login/logout with JWT)
- Simple user management (CRUD for users, no roles)
- Backend serves both API and frontend build

## Goal
A simple restaurant bookkeeping app for iPad use. 
All authenticated users see the same features. 
The app must be easy to use with large buttons and minimal typing.

## Features

### Authentication
- Login page (username + password)
- JWT-based authentication (Access + Refresh tokens)
- Passwords stored as bcrypt hash
- Logout button

### Sessions
- After login, user is redirected to a Session Dashboard.
- A session represents a partial result of the day.
- There can be multiple sessions per day, but only one active at a time.
- Session data:
  - id, date, start_time, end_time, is_active, user_id
- CRUD:
  - Start new session (closes any active one)
  - End session
  - List all sessions for current day with summaries
- All daily operations (sales, expenses, shifts, inventory changes) are linked to the current active session.
- Daily Closing aggregates results of all sessions for the day.


### User Management
- Admin screen for:
  - Add user
  - Change password
  - Delete user
- No roles: all users see same features

### Stammdaten (configurable)
- **Menu Categories** (CRUD: add, edit, delete)
- **Menu Items**: id, name, price, category_id, soldCount
- **Employees**: id, name, hourlyWage
- **Inventory Items**: id, name, unit, stock, minStock, purchasePrice

### Daily Operations
- **Sales**:
  - Grid of buttons grouped by menu category
  - Tap = +1 sale
  - Choose payment type (cash/card)
  - Daily totals shown (overall, cash, card)
- **Expenses**:
  - Predefined buttons + generic add-expense
- **Employees**:
  - Check-in/out
  - Worked hours & wage calculation
- **Inventory**:
  - Traffic-light list (ok/low/empty)
  - +Delivery / -Consumption buttons
  - Optional: sales reduce inventory

### Reports
- **Chef Report**:
  - Revenue (cash/card)
  - Costs (expenses + staff)
  - Profit
  - Top-selling items
  - Inventory warnings
  - Views: Day / Week / Month
- **Daily Closing**:
  - Previous balance
  - Sales
  - Expenses
  - Staff costs
  - Input: actual cash counted
  - Output: difference expected vs. actual
  - Save report

## Database (Postgres)
- users (id, username, password_hash, created_at)
- menu_categories (id, name)
- menu_items (id, name, price, category_id, sold_count)
- sales (id, menu_item_id, amount, payment_type, timestamp, user_id)
- employees (id, name, hourly_wage)
- shifts (id, employee_id, start_time, end_time, duration, wage)
- expenses (id, amount, reason, timestamp, user_id)
- inventory_items (id, name, unit, stock, min_stock, purchase_price)
- inventory_changes (id, inventory_item_id, change, reason, timestamp, user_id)
- day_records (id, date, start_cash, sales_cash, sales_card, expenses, end_cash)

## Backend
- Express.js REST API
- Authentication middleware (JWT)
- CRUD endpoints:
  - Users
  - Menu categories
  - Menu items
  - Employees
  - Inventory
  - Sales, Expenses, Shifts, Inventory Changes
- Reports endpoints (daily/weekly/monthly)

## Frontend
- React + TypeScript + TailwindCSS
- Login page
- Dashboard with big tiles:
  - Sales
  - Expenses
  - Employees
  - Inventory
  - Reports
  - Daily Cl
