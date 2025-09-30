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

The API manages two user types: Individual and Business. Both are handled via the same endpoints below. Responses include a `user_type` to distinguish records, and fields differ slightly per type.

### 1. List Users
**GET** `/api/admin/users`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters (all optional):**
- `name`: Filter by name (partial match)
- `surname`: Filter by surname (partial match)
- `email`: Filter by email (partial match)
- `id_number`: Filter by ID number (partial match)
- `phone_no`: Filter by phone number (partial match)
- `nipt`: Filter by NIPT (partial match, business only)

**Examples:**
- `/api/admin/users` - Get all users
- `/api/admin/users?name=john` - Users with "john" in name
- `/api/admin/users?email=gmail` - Users with "gmail" in email
- `/api/admin/users?nipt=L123` - Business users with NIPT like "L123"

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "user_type": "individual",
            "name": "John",
            "surname": "Doe",
            "id_number": "123456789",
            "phone_no": "+355 69 123 4567",
            "email": "john@example.com",
            "balance": "100.50",
            "email_verified_at": null,
            "created_at": "2025-09-11T10:25:59.000000Z",
            "updated_at": "2025-09-11T10:25:59.000000Z"
        },
        {
            "id": 2,
            "user_type": "business",
            "name": "Acme",
            "surname": "Corp",
            "id_number": "987654321",
            "phone_no": "+355 68 987 6543",
            "email": "billing@acme.com",
            "nipt": "L12345678A",
            "balance": "2500.00",
            "email_verified_at": null,
            "created_at": "2025-09-12T09:00:00.000000Z",
            "updated_at": "2025-09-12T09:00:00.000000Z"
        }
    ]
}
```

### 2. Create Individual User
**POST** `/api/admin/individual-users`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
    "name": "John",
    "surname": "Doe",
    "id_number": "123456789",
    "phone_no": "+355 69 123 4567",
    "email": "john@example.com",
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
        "user_type": "individual",
        "name": "John",
        "surname": "Doe",
        "id_number": "123456789",
        "phone_no": "+355 69 123 4567",
        "email": "john@example.com",
        "balance": "100.50",
        "email_verified_at": null,
        "created_at": "2025-09-11T10:25:59.000000Z",
        "updated_at": "2025-09-11T10:25:59.000000Z"
    }
}
```

### 3. Create Business User
**POST** `/api/admin/business-users`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
    "name": "Acme",
    "surname": "Corp",
    "id_number": "987654321",
    "phone_no": "+355 68 987 6543",
    "email": "billing@acme.com",
    "nipt": "L12345678A",
    "balance": 2500.00,
    "password": "securePassword!"
}
```

**Response:**
```json
{
    "success": true,
    "message": "User created successfully",
    "data": {
        "id": 2,
        "user_type": "business",
        "name": "Acme",
        "surname": "Corp",
        "id_number": "987654321",
        "phone_no": "+355 68 987 6543",
        "email": "billing@acme.com",
        "nipt": "L12345678A",
        "balance": "2500.00",
        "email_verified_at": null,
        "created_at": "2025-09-12T09:00:00.000000Z",
        "updated_at": "2025-09-12T09:00:00.000000Z"
    }
}
```

### 4. Get Single Individual User
**GET** `/api/admin/individual-users/{id}`

**Headers:** `Authorization: Bearer {token}`

**Example:** `/api/admin/individual-users/1`

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "user_type": "individual",
        "name": "John",
        "surname": "Doe",
        "id_number": "123456789",
        "phone_no": "+355 69 123 4567",
        "email": "john@example.com",
        "balance": "100.50",
        "email_verified_at": null,
        "created_at": "2025-09-11T10:25:59.000000Z",
        "updated_at": "2025-09-11T10:25:59.000000Z"
    }
}
```

### 5. Get Single Business User
**GET** `/api/admin/business-users/{id}`

**Headers:** `Authorization: Bearer {token}`

**Example:** `/api/admin/business-users/2`

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 2,
        "user_type": "business",
        "name": "Acme",
        "surname": "Corp",
        "id_number": "987654321",
        "phone_no": "+355 68 987 6543",
        "email": "billing@acme.com",
        "nipt": "L12345678A",
        "balance": "2500.00",
        "email_verified_at": null,
        "created_at": "2025-09-12T09:00:00.000000Z",
        "updated_at": "2025-09-12T09:00:00.000000Z"
    }
}
```

### 6. Update Individual User
**PUT** `/api/admin/individual-users/{id}`

**Headers:** `Authorization: Bearer {token}`

**Example:** `/api/admin/individual-users/1`

**Request Body:**
```json
{
    "name": "John Updated",
    "surname": "Doe Updated",
    "id_number": "123456789",
    "phone_no": "+355 69 123 4567",
    "email": "john.updated@example.com",
    "balance": 200.75,
    "password": "newpassword123"
}
```

**Note:** `password` is optional on update. Omit it to keep the current password.

**Response:**
```json
{
    "success": true,
    "message": "User updated successfully",
    "data": {
        "id": 1,
        "user_type": "individual",
        "name": "John Updated",
        "surname": "Doe Updated",
        "id_number": "123456789",
        "phone_no": "+355 69 123 4567",
        "email": "john.updated@example.com",
        "balance": "200.75",
        "email_verified_at": null,
        "created_at": "2025-09-11T10:25:59.000000Z",
        "updated_at": "2025-09-11T11:30:00.000000Z"
    }
}
```

### 7. Update Business User
**PUT** `/api/admin/business-users/{id}`

**Headers:** `Authorization: Bearer {token}`

**Example:** `/api/admin/business-users/2`

**Request Body:**
```json
{
    "name": "Acme",
    "surname": "Corp",
    "id_number": "987654321",
    "phone_no": "+355 68 987 6543",
    "email": "billing@acme.com",
    "nipt": "L12345678A",
    "balance": 2750.00,
    "password": "newSecurePassword!"
}
```

**Note:** `password` is optional on update. Omit it to keep the current password.

**Response:**
```json
{
    "success": true,
    "message": "User updated successfully",
    "data": {
        "id": 2,
        "user_type": "business",
        "name": "Acme",
        "surname": "Corp",
        "id_number": "987654321",
        "phone_no": "+355 68 987 6543",
        "email": "billing@acme.com",
        "nipt": "L12345678A",
        "balance": "2750.00",
        "email_verified_at": null,
        "created_at": "2025-09-12T09:00:00.000000Z",
        "updated_at": "2025-09-12T10:00:00.000000Z"
    }
}
```

### 8. Delete Individual User
**DELETE** `/api/admin/individual-users/{id}`

**Headers:** `Authorization: Bearer {token}`

**Example:** `/api/admin/individual-users/1`

**Response:**
```json
{
    "success": true,
    "message": "User deleted successfully"
}
```

### 9. Delete Business User
**DELETE** `/api/admin/business-users/{id}`

**Headers:** `Authorization: Bearer {token}`

**Example:** `/api/admin/business-users/2`

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
    "message": "No query results for model [User] 999"
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
   - **Get All Users (aggregate):** GET `/api/admin/users`
   - **Search Users:** GET `/api/admin/users?name=john` or `?nipt=L123`
   - **Get Individual:** GET `/api/admin/individual-users/1`
   - **Get Business:** GET `/api/admin/business-users/2`
   - **Create Individual:** POST `/api/admin/individual-users`
   - **Create Business:** POST `/api/admin/business-users`
   - **Update Individual:** PUT `/api/admin/individual-users/1`
   - **Update Business:** PUT `/api/admin/business-users/2`
   - **Delete Individual:** DELETE `/api/admin/individual-users/1`
   - **Delete Business:** DELETE `/api/admin/business-users/2`

4. **Test Error Cases:**
   - Try accessing without token
   - Try with invalid data
   - Try accessing non-existent users

## Notes

- `user_type` distinguishes records in responses: `individual` vs `business`.
- `nipt` exists only for Business users; it is absent for Individuals.
- Balances are returned as strings with 2 decimal places.