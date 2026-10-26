# Multi-Level Product Distribution & Partner Management Platform
### Functional Demo Prototype (1 Owner + 10 Partners + 30 Users = 41 Seeded Accounts)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-darkblue.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-blueviolet.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-11%20Passed-success.svg)]()

---

## 1. Project Overview & Architecture
This platform is a functional full-stack prototype demonstrating a compliant, product-based distribution and partner branch network. It simulates commercial order fulfillment, coupon campaigns, 4-month customer replenishment cycles, operating expenses, and transparent 6% sales-performance commissions.

> [!IMPORTANT]
> **Compliance & Direct Selling Safety:**
> - Recruitment-based bonuses (e.g. ₹30 per recruited member mentioned in the proposal) are **strictly UNAPPROVED and disabled** in accordance with Consumer Protection (Direct Selling) Rules.
> - Commissions are modeled **exclusively at 6.0% on verified, delivered end-consumer product sales**, explicitly labeled as an illustrative simulation pending corporate legal review.
> - Exactly 30 direct users are distributed across 10 main partner branches for service attribution. Joining fees are not treated as eligible sales.

---

## 2. Seeded Demo Accounts (Exactly 41 Total)

A standard demo password (`Demo@12345`) is pre-hashed for all accounts, and the application includes a **1-click Account Switcher** modal in the navigation bar to immediately evaluate any account without manual password typing.

### A. Super Admin / Owner (1 Account)
| Account ID | Name | Role | Email | Branch / Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **OWN001** | Demo Owner | `OWNER` | `owner@demoplatform.local` | Central Platform HQ (Mumbai) |

### B. Main Regional Partners (10 Accounts)
| Partner ID | Name | Branch Hub | Referral Code | Assigned Direct Users |
| :--- | :--- | :--- | :--- | :--- |
| **PAR001** | Aarav Patel | West Zone Hub (Mumbai) | `REF-PAR001` | USR001, USR002, USR003 |
| **PAR002** | Priya Sharma | North Zone Hub (Delhi NCR) | `REF-PAR002` | USR004, USR005, USR006 |
| **PAR003** | Rohan Mehta | West Zone Hub (Ahmedabad) | `REF-PAR003` | USR007, USR008, USR009 |
| **PAR004** | Ananya Iyer | South Zone Hub (Bengaluru) | `REF-PAR004` | USR010, USR011, USR012 |
| **PAR005** | Vikram Singh | North Zone Hub (Jaipur) | `REF-PAR005` | USR013, USR014, USR015 |
| **PAR006** | Neha Gupta | East Zone Hub (Kolkata) | `REF-PAR006` | USR016, USR017, USR018 |
| **PAR007** | Kavita Reddy | South Zone Hub (Hyderabad) | `REF-PAR007` | USR019, USR020, USR021 |
| **PAR008** | Rajesh Nair | South Zone Hub (Kochi) | `REF-PAR008` | USR022, USR023, USR024 |
| **PAR009** | Sunita Verma | Central Zone Hub (Bhopal) | `REF-PAR009` | USR025, USR026, USR027 |
| **PAR010** | Amit Joshi | North Zone Hub (Chandigarh) | `REF-PAR010` | USR028, USR029, USR030 |

### C. Direct Regular Users (30 Accounts)
- **USR001 - USR003**: Assigned to **PAR001** (Devendra Rao, Meera Kulkarni, Siddharth Jain)
- **USR004 - USR006**: Assigned to **PAR002** (Pooja Malhotra, Gaurav Khanna, Ritika Sen)
- **USR007 - USR009**: Assigned to **PAR003** (Alok Bhatt, Trisha Desai, Kunal Trivedi)
- **USR010 - USR012**: Assigned to **PAR004** (Karthik Sundaram, Deepa Swaminathan, Manoj Venkatesh)
- **USR013 - USR015**: Assigned to **PAR005** (Harish Rathore, Simran Bhasin, Manish Chauhan)
- **USR016 - USR018**: Assigned to **PAR006** (Sourav Mukherjee, Payal Ghosh, Debashish Roy)
- **USR019 - USR021**: Assigned to **PAR007** (Sravani Rao, Pradeep Varma, Anusha Goud)
- **USR022 - USR024**: Assigned to **PAR008** (Arjun Menon, Laxmi Pillai, Gokul Krishnan)
- **USR025 - USR027**: Assigned to **PAR009** (Varun Tiwari, Shalini Dubey, Naveen Shukla)
- **USR028 - USR030**: Assigned to **PAR010** (Jaspreet Kaur, Tarun Sandhu, Simranjeet Gill)

---

## 3. Technology Stack & Key Libraries
- **Frontend**: React 18 with TypeScript, Vite build tool, Tailwind CSS, Lucide React icons, and Recharts.
- **Backend**: Node.js with Express and TypeScript (`tsx` runtime).
- **Database & ORM**: Prisma ORM with SQLite file persistence (`server/prisma/dev.db`), architected for 100% plug-and-play migration to PostgreSQL.
- **Authentication**: JWT token authentication with backend role middleware (`requireRole('OWNER' | 'PARTNER' | 'USER')`).
- **Validation**: Zod schema validation on all POST/PUT routes.
- **Currency**: INR (₹) with decimal/paise arithmetic precision.

---

## 4. Setup, Seed & Test Instructions

### Step 1: Install Dependencies
```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### Step 2: Database Migration & Seeding
```bash
cd server
# Push relational schema to local SQLite database
npx prisma db push

# Seed 41 accounts, 8 products, coupons, orders, expenses, and transfer records
npm run prisma:seed
```

### Step 3: Run Automated Test Suite
```bash
cd server
npm test
```
The Vitest automated test suite validates:
1. Exact count of 1 Owner, 10 Partners, and 30 Users (41 accounts).
2. Exactly 3 assigned users per partner.
3. Role-based backend security (blocking unauthorized access).
4. Partner isolation (preventing access to another partner's records).
5. 6% illustrative commission calculations and permanent lock on recruitment bonuses.
6. Coupon validations and minimum order rules.
7. Product checkout, inventory decrement, and commission ledger creation.
8. Payment failure handling without stock or commission leaks.
9. Refund simulation, inventory restock, and commission ledger reversal.
10. Financial P&L formula accuracy.
11. Dynamic hierarchy tree generation.

### Step 4: Start Backend & Frontend
In Terminal 1 (Backend API on `http://localhost:5000`):
```bash
cd server
npm run dev
```

In Terminal 2 (Frontend on `http://localhost:3000`):
```bash
cd client
npm run dev
```

Visit **`http://localhost:3000`** in any web browser.

---

## 5. Financial Management Formulas

All figures on the Owner Financial Dashboard follow these exact accounting formulas:

$$\text{Net Sales} = \text{Gross Product Sales} - \text{Discounts} - \text{Refunds}$$

$$\text{Gross Profit} = \text{Net Sales} - \text{Cost of Goods Sold (COGS)}$$

$$\text{Estimated Operating Profit} = \text{Gross Profit} - \text{Operating Expenses} - \text{Owner Remuneration} - \text{Approved Selling Expenses}$$

$$\text{Estimated Net Profit} = \text{Estimated Operating Profit} - \text{Estimated Tax Provision (25\%)}$$

---

## 6. Key Demo Features & Workflows

1. **Owner KPI Dashboard**: 10 real-time KPI metrics, 5 Recharts visualizations, and live order telemetry.
2. **Interactive Referral Topology**: Expandable and collapsible tree (Owner &rarr; 10 Partners &rarr; 3 Users), instant search with branch highlighting, and node detail drawers.
3. **E-Commerce Catalogue & Cart**: 8 FMCG and wellness products, cart quantity controls, coupon deductions (`WELCOME10`, `PARTNER5`, `FESTIVE15`), and mock payment gateway with testable success or failure toggles.
4. **Order Invoicing & Refund Reversals**: View invoices marked `DEMO INVOICE`, test the **"Simulate Cancellation & Restock"** button to witness real-time inventory restock and commission reversal.
5. **4-Month Replenishment Tracker**: Configurable 120-day cycle with **Sandbox Test Controls** to simulate `DUE_SOON` and `OVERDUE` states.
6. **Operating Expenses & Inter-Company Transfer Register**: Record audited corporate expenses and inter-entity fund allocations.
7. **Compliance Lock**: Strict system enforcement keeping headcount/recruitment bonuses permanently unapproved.
