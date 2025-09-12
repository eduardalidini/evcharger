# Admin & User Management API

Base URL: `http://your-domain.com/api`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer {your-token}
```

## Admin Authentication

### 1. Admin Login
**POST** `/api/admin/login`

**Request Body:**
```json
{
    "email": "admin@admin.com",
    "password": "password!"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "admin": {
            "id": 1,
            "name": "Admin",
            "email": "admin@admin.com"
        },
        "token": "1|abc123...",
        "token_type": "Bearer"
    }
}
```

### 2. Get Current Admin Info
**GET** `/api/admin/me`

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
    "success": true,
    "data": {
        "admin": {
            "id": 1,
            "name": "Admin",
            "email": "admin@admin.com",
            "created_at": "2025-09-11T10:25:59.000000Z"
        }
    }
}
```

### 3. Admin Logout
**POST** `/api/admin/logout`

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

## User Management

### 1. List Users
**GET** `/api/admin/users`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters (all optional):**
- `name`: Filter by name (partial match)
- `surname`: Filter by surname (partial match)
- `email`: Filter by email (partial match)
- `id_number`: Filter by ID number (partial match)
- `phone_no`: Filter by phone number (partial match)
- `nipt`: Filter by NIPT (partial match)

**Examples:**
- `/api/admin/users` - Get all users
- `/api/admin/users?name=john` - Users with "john" in name
- `/api/admin/users?name=john&surname=doe` - Users with "john" in name AND "doe" in surname
- `/api/admin/users?email=gmail` - Users with "gmail" in email
- `/api/admin/users?phone_no=355` - Users with "355" in phone number

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "John",
            "surname": "Doe",
            "id_number": "123456789",
            "phone_no": "+355 69 123 4567",
            "email": "john@example.com",
            "nipt": null,
            "balance": "100.50",
            "email_verified_at": null,
            "created_at": "2025-09-11T10:25:59.000000Z",
            "updated_at": "2025-09-11T10:25:59.000000Z"
        }
    ]
}
```

### 2. Create User
**POST** `/api/admin/users`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
    "name": "John",
    "surname": "Doe",
    "id_number": "123456789",
    "phone_no": "+355 69 123 4567",
    "email": "john@example.com",
    "nipt": null,
    "balance": 100.50,
    "password": "password123"
}
```

**Response:**
```json
{
    "success": true,
    "message": "User created successfully",
    "data": {
        "id": 1,
        "name": "John",
        "surname": "Doe",
        "id_number": "123456789",
        "phone_no": "+355 69 123 4567",
        "email": "john@example.com",
        "nipt": null,
        "balance": "100.50",
        "email_verified_at": null,
        "created_at": "2025-09-11T10:25:59.000000Z",
        "updated_at": "2025-09-11T10:25:59.000000Z"
    }
}
```

### 3. Get Single User
**GET** `/api/admin/users/id`

**Headers:** `Authorization: Bearer {token}`

**Example:** `/api/admin/users/1`

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "name": "John",
        "surname": "Doe",
        "id_number": "123456789",
        "phone_no": "+355 69 123 4567",
        "email": "john@example.com",
        "nipt": null,
        "balance": "100.50",
        "email_verified_at": null,
        "created_at": "2025-09-11T10:25:59.000000Z",
        "updated_at": "2025-09-11T10:25:59.000000Z"
    }
}
```

### 4. Update User
**PUT** `/api/admin/users/id`

**Headers:** `Authorization: Bearer {token}`

**Example:** `/api/admin/users/1`

**Request Body:**
```json
{
    "name": "John Updated",
    "surname": "Doe Updated",
    "id_number": "123456789",
    "phone_no": "+355 69 123 4567",
    "email": "john.updated@example.com",
    "nipt": "L12345678A",
    "balance": 200.75,
    "password": "newpassword123"
}
```

**Note:** Password field is optional. Leave empty to keep current password.

**Response:**
```json
{
    "success": true,
    "message": "User updated successfully",
    "data": {
        "id": 1,
        "name": "John Updated",
        "surname": "Doe Updated",
        "id_number": "123456789",
        "phone_no": "+355 69 123 4567",
        "email": "john.updated@example.com",
        "nipt": "L12345678A",
        "balance": "200.75",
        "email_verified_at": null,
        "created_at": "2025-09-11T10:25:59.000000Z",
        "updated_at": "2025-09-11T11:30:00.000000Z"
    }
}
```

### 5. Delete User
**DELETE** `/api/admin/users/{id}`

**Headers:** `Authorization: Bearer {token}`

**Example:** `/api/admin/users/1`

**Response:**
```json
{
    "success": true,
    "message": "User deleted successfully"
}
```

## Error Responses

All endpoints return standardized error responses:

**Validation Error (422):**
```json
{
    "message": "The given data was invalid.",
    "errors": {
        "email": ["The email field is required."],
        "password": ["The password field is required."]
    }
}
```

**Unauthorized (401):**
```json
{
    "message": "Unauthenticated."
}
```

**Not Found (404):**
```json
{
    "message": "No query results for model [App\\Models\\User] 999"
}
```

## Postman Testing Steps

1. **Login Admin:**
   - POST to `/api/admin/login`
   - Copy the `token` from response

2. **Set Authorization:**
   - In Postman, go to Authorization tab
   - Select "Bearer Token"
   - Paste the token

3. **Test User Operations:**
   - **Get All Users:** GET `/api/admin/users`
   - **Search Users:** GET `/api/admin/users?name=john&email=gmail`
   - **Get Single User:** GET `/api/admin/users/1`
   - **Create User:** POST `/api/admin/users` (with JSON body)
   - **Update User:** PUT `/api/admin/users/1` (with JSON body)
   - **Delete User:** DELETE `/api/admin/users/1`

4. **Test Error Cases:**
   - Try accessing without token
   - Try with invalid data
   - Try accessing non-existent users

## Key Improvements Made

✅ **No Pagination:** All responses return simple data arrays without pagination metadata
✅ **Individual Field Search:** Each field can be searched separately via query parameters
✅ **Proper Route Model Binding:** Single user endpoints use `/users/{id}` format
✅ **Clean Responses:** Only essential user data in responses