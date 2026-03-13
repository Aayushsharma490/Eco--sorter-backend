# Eco Sorter Backend API

RESTful API for the Eco Sorter Platform built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- MongoDB installed locally OR MongoDB Atlas account

### Installation

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecosorter
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:5173
```

5. Seed the database with demo data:
```bash
npm run seed
```

6. Start the server:
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will run on `http://localhost:5000`

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |

### Pickups

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/pickups` | Get all pickups | Private |
| GET | `/api/pickups/pending` | Get pending pickups | Executive/Admin |
| POST | `/api/pickups` | Create pickup request | User |
| PUT | `/api/pickups/:id/accept` | Accept pickup | Executive |
| PUT | `/api/pickups/:id/complete` | Complete pickup | Executive |
| DELETE | `/api/pickups/:id` | Cancel pickup | User/Admin |

### Dustbins

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/dustbins` | Get all dustbins | Private |
| GET | `/api/dustbins/critical` | Get critical dustbins | Executive/Admin |
| POST | `/api/dustbins` | Create dustbin | User |
| PUT | `/api/dustbins/:id` | Update dustbin level | Private |

### Collection Centers

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/centers` | Get all centers | Public |
| POST | `/api/centers` | Create center | Admin |
| PUT | `/api/centers/:id` | Update center | Admin |
| DELETE | `/api/centers/:id` | Delete center | Admin |

### Statistics

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/stats/admin` | Admin dashboard stats | Admin |
| GET | `/api/stats/executive` | Executive dashboard stats | Executive |
| GET | `/api/stats/user` | User dashboard stats | User |

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Login Flow

1. POST to `/api/auth/login` with email and password
2. Receive JWT token in response
3. Include token in subsequent requests:
```
Authorization: Bearer <your-token>
```

### Demo Credentials

```
User: user@demo.com / demo123
Executive: executive@demo.com / demo123
Admin: admin@demo.com / demo123
```

## 📊 Database Models

### User
- name, email, password (hashed)
- role: user | executive | admin
- phone, address
- credits (for users)

### Pickup
- user (ref), executive (ref)
- scheduledDate, estimatedWeight, actualWeight
- status: pending | accepted | in-progress | completed | cancelled
- creditsEarned (calculated: 1kg = 10 credits)

### Dustbin
- user (ref)
- location, level (0-100)
- status: low | moderate | critical (auto-calculated)

### CollectionCenter
- name, address
- serviceableAreas (array of areas with pincodes)
- contact info

## 🧪 Testing with Postman/Thunder Client

### 1. Register/Login
```json
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "user@demo.com",
  "password": "demo123"
}
```

### 2. Get User Stats
```json
GET http://localhost:5000/api/stats/user
Authorization: Bearer <your-token>
```

### 3. Create Pickup
```json
POST http://localhost:5000/api/pickups
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "scheduledDate": "2026-03-15",
  "estimatedWeight": 10,
  "notes": "Please collect from main gate"
}
```

## 🚀 Deployment

### Deploy to Railway

1. Create account on [Railway.app](https://railway.app)
2. Create new project
3. Add MongoDB database
4. Deploy from GitHub
5. Add environment variables

### Deploy to Render

1. Create account on [Render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Add environment variables
5. Deploy

### Environment Variables for Production

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<strong-random-secret>
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend-domain.com
```

## 📁 Project Structure

```
backend/
├── models/           # Database models
│   ├── User.js
│   ├── Pickup.js
│   ├── Dustbin.js
│   └── CollectionCenter.js
├── routes/           # API routes
│   ├── auth.js
│   ├── pickups.js
│   ├── dustbins.js
│   ├── centers.js
│   └── stats.js
├── middleware/       # Custom middleware
│   └── auth.js
├── utils/           # Utility functions
│   └── generateToken.js
├── server.js        # Main server file
├── seed.js          # Database seeder
└── package.json
```

## 🔧 Development

### Run with auto-reload
```bash
npm run dev
```

### Seed database
```bash
node seed.js
```

### Clear and reseed
```bash
node seed.js
```

## 📝 Notes

- Credits calculation: 1kg plastic = 10 credits
- Dustbin status: <50% = low, 50-79% = moderate, ≥80% = critical
- Pickup status flow: pending → accepted → in-progress → completed
- JWT tokens expire in 7 days (configurable)

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in `.env`
- For Atlas, whitelist your IP address

### Port Already in Use
- Change PORT in `.env`
- Or kill process: `npx kill-port 5000`

### CORS Errors
- Update FRONTEND_URL in `.env`
- Ensure frontend URL matches exactly

## 📞 Support

For issues or questions, contact: dev@ecosorter.com
