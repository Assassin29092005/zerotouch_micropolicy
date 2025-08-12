# ZeroTouch MicroPolicy API Documentation

## Base URL
- Development: http://localhost:5000/api
- Production: https://your-backend.onrender.com/api

## Authentication
All protected routes need in the header:
Authorization: Bearer <jwt-token>

---

### 1. Authentication

#### POST /auth/signup
Create a new customer account.

Request Body:
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "User created successfully",
  "token": "eyJhbGci...",
  "user": { "id": "...", "username": "john_doe", "email": "john@example.com" }
}

### 2. Policies
#### POST `/policies/purchase` *(Auth required)*
Purchase a micro-policy.

**Request Body:**
---

#### GET `/policies/user` *(Auth required)*
Fetch all policies of logged-in user.

**Query params:**
- `status` (optional) = active | paid | expired
- `page` (optional) = Page number
- `limit` (optional) = Number of results

---

#### GET `/policies/notifications` *(Auth required)*
Fetch recent payout notifications.

---

### **3. Admin Routes** *(Admin authentication required)*

#### POST `/admin/simulate-event`
Trigger an event simulation (rain, flight, traffic, package, fake).

**Request Body:**

---

#### GET `/admin/users`
List all registered customers with policy stats.

#### GET `/admin/policies`
List all policies in the system.

#### GET `/admin/events`
View event history.

#### GET `/admin/dashboard/stats`
Get total counts for system dashboard.

---

## Error Format

---

## Status Codes
- **200**: OK
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Server Error