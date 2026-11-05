# KindredActs - Social Development Events Platform (Backend Server)

This is the Express.js & MongoDB backend server for **KindredActs**, a community-driven social development event management platform where citizens can discover, organize, join, and manage local community welfare drives (winter blanket distributions, beach cleanups, tree plantations, free health clinics, and slum education camps).

## 🚀 Key Features

* **JWT Authentication & Authorization**: Secure token-based auth with password hash encryption (`bcryptjs`), role ownership enforcement, and social login support.
* **Events REST API**:
  * `GET /api/events/recent`: Efficiently fetches the latest 6 upcoming community initiatives using MongoDB's `.limit(6)` operator.
  * `GET /api/events/upcoming`: Real-time query of all active upcoming events (excluding passed dates) with optional search & category filtering.
  * `POST /api/events`: Protected creation endpoint ensuring events are strictly set for future dates and tied to the creator's verified email.
  * `PUT /api/events/:id` & `DELETE /api/events/:id`: Strict ownership verification ensuring organizers can only update and delete events they created.
  * `POST /api/events/:id/join`: Protected join mechanism that registers volunteer commitments in a dedicated database collection and prevents duplicate joins.
  * `GET /api/events/user/joined`: User-specific dashboard view displaying joined volunteer campaigns sorted chronologically by event date.
* **Resilient MongoDB Driver**: Direct connection to MongoDB Atlas with an in-memory development fallback for effortless local evaluation.
* **Strict Input Validation**: Validates passwords (must include 1 uppercase, 1 lowercase, and >= 6 characters) and enforces future date rules.

## 📦 Tech Stack

* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: MongoDB (Official native driver `mongodb`)
* **Security & Tokens**: `jsonwebtoken`, `bcryptjs`, `cors`
* **Configuration**: `dotenv`

## 🛠️ Environment Variables Setup

Create a `.env` file in the root of the server directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/kindredacts?retryWrites=true&w=majority
DB_NAME=kindredacts_db
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:3000
```

## 🏃 Running Locally

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Or start standard production server
npm start
```

## 📡 API Reference Summary

* `POST /api/auth/register` - Create volunteer account
* `POST /api/auth/login` - Volunteer login (returns JWT token)
* `POST /api/auth/social-login` - Social authentication (Google/GitHub)
* `PUT /api/auth/profile` - Update user display name & photo URL
* `GET /api/events/recent` - Get 6 recent upcoming events (.limit(6))
* `GET /api/events/upcoming` - Get all upcoming events (supports `?search=` and `?category=`)
* `GET /api/events/:id` - Get event details
* `POST /api/events` - Create new event (JWT required)
* `GET /api/events/user/created` - Get events created by logged-in user (JWT required)
* `PUT /api/events/:id` - Edit created event (JWT + owner check)
* `DELETE /api/events/:id` - Delete created event (JWT + owner check)
* `POST /api/events/:id/join` - Join an event (JWT required)
* `GET /api/events/user/joined` - Get all events joined by current user (JWT required)
