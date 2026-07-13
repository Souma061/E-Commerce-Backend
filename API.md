# E-Commerce Backend — API Documentation

This document maintains the API reference for the E-Commerce Backend application.

## Base URL
* **Development:** `http://localhost:3000`

---

## Authentication (`/auth`)

### 1. Register User
Create a new user account in the system.

* **Endpoint:** `/auth/register`
* **Method:** `POST`
* **Content-Type:** `application/json`

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "strongpassword123",
  "name": "John Doe"
}
```

| Field | Type | Validation Rules | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | Required, Email format, 5 to 50 chars | User's unique email address (will be trimmed and lowercased) |
| `password` | `string` | Required, 8 to 20 chars | User's account password |
| `name` | `string` | Required, 2 to 30 chars | User's display name (will be trimmed) |

#### Success Response (`201 Created`)
```json
{
  "id": "cm4d9z1ab00003b6t12345678",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "CUSTOMER",
  "createdAt": "2026-07-13T07:11:27.000Z"
}
```

#### Error Responses

##### Email Already Exists (`409 Conflict`)
```json
{
  "message": "An account with email user@example.com already exists",
  "error": "Conflict",
  "statusCode": 409
}
```

##### Validation Failed (`400 Bad Request`)
Returned when request payload validation fails.
```json
{
  "message": [
    "Invalid email address",
    "Password must be at least 8 characters long",
    "Name must be at least 2 characters long"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### 2. Login User
Authenticate an existing user.

* **Endpoint:** `/auth/login`
* **Method:** `POST`
* **Content-Type:** `application/json`

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "strongpassword123"
}
```

| Field | Type | Validation Rules | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | Required, Email format, 5 to 50 chars | User's registered email address |
| `password` | `string` | Required, 8 to 20 chars | User's password |

#### Success Response (`201 Created`)
*Note: In NestJS, POST routes return `201 Created` by default.*
```json
{
  "id": "cm4d9z1ab00003b6t12345678",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "CUSTOMER",
  "createdAt": "2026-07-13T07:11:27.000Z"
}
```

#### Error Responses

##### Email Not Found (`401 Unauthorized`)
*Note: In production, this will be unified to "Invalid email or password" to prevent user enumeration.*
```json
{
  "message": "No account found with this email",
  "error": "Unauthorized",
  "statusCode": 401
}
```

##### Incorrect Password (`401 Unauthorized`)
*Note: In production, this will be unified to "Invalid email or password" to prevent user enumeration.*
```json
{
  "message": "Incorrect password",
  "error": "Unauthorized",
  "statusCode": 401
}
```

##### Validation Failed (`400 Bad Request`)
```json
{
  "message": [
    "Invalid email address",
    "Password must be at least 8 characters long"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```
