# Flow9 Backend

Personal Life OS - Financial Management API

---

## Giới thiệu

Backend API cho Flow9 - hệ thống quản lý tài chính cá nhân.

### Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Auth**: JWT (Bearer token)
- **Features**: Cron jobs, NLP parser, SSE notifications, CoinGecko integration

### Tính năng

- **Auth**: Đăng nhập bằng mã PIN 6 số
- **Transactions**: Giao dịch với NLP parser
- **Subscriptions**: Theo dõi đăng ký định kỳ
- **Payroll**: Quản lý ca làm và lương
- **Budgets**: Ngân sách và mục tiêu tiết kiệm
- **Investments**: Theo dõi đầu tư (Crypto với CoinGecko)
- **Debts**: Quản lý nợ

---

## Cài đặt

### Yêu cầu

- Node.js 18+
- MongoDB Atlas account
- npm hoặc yarn

### Cài đặt

```bash
# Clone và cài đặt
cd flow9-backend
npm install

# Tạo file môi trường
cp .env.example .env
# Chỉnh sửa .env với MongoDB URI và JWT secret
```

### Cấu hình

Tạo file `.env`:

```env
PORT=3001
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/flow9
JWT_SECRET=your-secret-key-change-this
FRONTEND_URL=http://localhost:3000
```

### Chạy Development

```bash
npm run dev
```

Server chạy tại http://localhost:3001

### Chạy Production

```bash
npm run build
npm start
```

---

## API Endpoints

### Auth (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login với PIN 6 số |
| POST | `/api/auth/verify` | Verify JWT token |
| POST | `/api/auth/change-pin` | Đổi PIN |

### Transactions (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | Lấy giao dịch |
| POST | `/api/transactions` | Tạo giao dịch (NLP) |
| PUT | `/api/transactions/:id` | Cập nhật giao dịch |
| DELETE | `/api/transactions/:id` | Xóa giao dịch |

### Subscriptions (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions` | Lấy tất cả đăng ký |
| POST | `/api/subscriptions` | Tạo đăng ký |
| PUT | `/api/subscriptions/:id` | Cập nhật đăng ký |
| POST | `/api/subscriptions/:id/pay` | Đánh dấu đã thanh toán |
| DELETE | `/api/subscriptions/:id` | Xóa đăng ký |

### Payroll (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shifts` | Lấy ca làm |
| POST | `/api/shifts` | Tạo ca làm |
| GET | `/api/salary/config` | Lấy cấu hình lương |
| PUT | `/api/salary/config` | Cập nhật cấu hình lương |
| GET | `/api/salary/summary` | Lấy tổng kết tháng |

### Budgets (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | Lấy ngân sách và mục tiêu |
| POST | `/api/budgets` | Tạo ngân sách/mục tiêu |
| PUT | `/api/budgets/:id` | Cập nhật |
| POST | `/api/budgets/:id/contribute` | Đóng góp vào mục tiêu |
| DELETE | `/api/budgets/:id` | Xóa |

### Investments (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/investments` | Lấy danh sách đầu tư |
| POST | `/api/investments` | Thêm đầu tư |
| PUT | `/api/investments/:id` | Cập nhật |
| POST | `/api/investments/:id/update-price` | Cập nhật giá từ CoinGecko |
| POST | `/api/investments/update-all-prices` | Cập nhật tất cả giá |
| DELETE | `/api/investments/:id` | Xóa |

### Debts (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/debts` | Lấy danh sách nợ |
| POST | `/api/debts` | Thêm nợ |
| PUT | `/api/debts/:id` | Cập nhật |
| POST | `/api/debts/:id/payment` | Thanh toán nợ |
| DELETE | `/api/debts/:id` | Xóa |

### CoinGecko (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/coingecko/coins/search?q=` | Tìm kiếm coin |
| GET | `/api/coingecko/coins/top` | Top 50 coins |
| GET | `/api/coingecko/coins/:id/price` | Lấy giá coin |

---

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

---

## Project Structure

```
src/
├── config/
│   └── database.ts      # MongoDB connection
├── models/
│   ├── User.ts
│   ├── Transaction.ts
│   ├── Subscription.ts
│   ├── WorkShift.ts
│   ├── SalaryConfig.ts
│   ├── Category.ts
│   ├── Budget.ts
│   ├── Investment.ts
│   └── Debt.ts
├── routes/
│   ├── auth.ts
│   ├── transactions.ts
│   ├── subscriptions.ts
│   ├── shifts.ts
│   ├── salary.ts
│   ├── budgets.ts
│   ├── investments.ts
│   ├── debts.ts
│   └── coingecko.ts
├── services/
│   ├── nlpParser.ts     # Transaction NLP parser
│   ├── salaryCalculator.ts
│   └── coingecko.ts    # CoinGecko API
├── middleware/
│   └── auth.ts          # JWT authentication
├── cron/
│   └── index.ts         # Scheduled tasks
└── index.ts             # Entry point
```

---

## Scripts

```bash
npm run dev      # Development với nodemon
npm run build    # Build TypeScript
npm start        # Production
```

---

## Deploy trên Railway

1. Push code lên GitHub
2. Kết nối repo với Railway
3. Thêm environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `FRONTEND_URL`
4. Deploy tự động

---

## License

MIT+1
