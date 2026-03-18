# Flow9 Backend

Personal Life OS - Financial Management API

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Auth**: JWT (httpOnly cookies)
- **Features**: Cron jobs, NLP parser, SSE notifications

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- npm or yarn

### Installation

```bash
# Clone and install
cd flow9-backend
npm install

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

### Configuration

Create `.env` file:

```env
PORT=3001
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/flow9
JWT_SECRET=your-secret-key-change-this
FRONTEND_URL=http://localhost:3000
```

### Run Development

```bash
npm run dev
```

Server runs on http://localhost:3001

### Run Production

```bash
npm run build
npm start
```

## API Endpoints

### Auth (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with 6-digit PIN |
| POST | `/api/auth/verify` | Verify JWT token |
| POST | `/api/auth/change-pin` | Change PIN |

### Shifts (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shifts` | Get shifts by month |
| POST | `/api/shifts` | Create shift |
| PUT | `/api/shifts/:id` | Update shift |
| DELETE | `/api/shifts/:id` | Delete shift |

### Salary (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/salary/config` | Get salary config |
| PUT | `/api/salary/config` | Update salary config |
| GET | `/api/salary/summary` | Get monthly summary |

### Transactions (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | Get transactions |
| POST | `/api/transactions` | Create transaction (NLP) |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/aggregate` | Get aggregated data |

### Subscriptions (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions` | Get all subscriptions |
| GET | `/api/subscriptions/upcoming` | Get upcoming renewals |
| POST | `/api/subscriptions` | Create subscription |
| PUT | `/api/subscriptions/:id` | Update subscription |
| POST | `/api/subscriptions/:id/pay` | Mark as paid |
| DELETE | `/api/subscriptions/:id` | Delete subscription |

### Categories (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get categories |
| POST | `/api/categories` | Create category |
| DELETE | `/api/categories/:id` | Delete category |

### Notifications (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/stream` | SSE notification stream |

## NLP Transaction Format

Transactions support natural language input:

```
# Expense (auto-detected)
Ăn trưa 50k
Mua sắm 200k
Xăng 100k

# Explicit income
+ Lương 15tr
+ Thưởng 2tr

# Shorthand
k = thousand (50k = 50,000)
tr = million (1.5tr = 1,500,000)
```

## Project Structure

```
src/
├── config/
│   └── database.ts      # MongoDB connection
├── models/
│   ├── User.ts
│   ├── WorkShift.ts
│   ├── SalaryConfig.ts
│   ├── Subscription.ts
│   ├── Transaction.ts
│   ├── Category.ts
│   └── AuditLog.ts
├── routes/
│   ├── auth.ts
│   ├── shifts.ts
│   ├── salary.ts
│   ├── subscriptions.ts
│   ├── transactions.ts
│   ├── categories.ts
│   └── notifications.ts
├── services/
│   ├── nlpParser.ts     # Transaction NLP parser
│   └── salaryCalculator.ts
├── middleware/
│   └── auth.ts          # JWT authentication
├── cron/
│   └── index.ts         # Scheduled tasks
└── index.ts             # Entry point
```

## Scripts

```bash
npm run dev      # Development with nodemon
npm run build    # Build TypeScript
npm start        # Production
```

## License

MIT
