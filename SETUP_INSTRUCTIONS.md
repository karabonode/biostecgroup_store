# Biostec Group - XAMPP/MySQL Setup Instructions

## Overview
This application has been migrated from Firebase to a local MySQL database (XAMPP) with a custom PHP API backend.

## Prerequisites
1. XAMPP installed (Apache + MySQL)
2. Node.js and npm

## Step 1: Database Setup

### 1.1 Start XAMPP
1. Open XAMPP Control Panel
2. Start **Apache** and **MySQL**
3. Open phpMyAdmin: http://localhost/phpmyadmin

### 1.2 Create Database
1. Click "New" in phpMyAdmin
2. Create database named: `biostec_db`
3. Select collation: `utf8mb4_unicode_ci`

### 1.3 Import Schema
1. Select the `biostec_db` database
2. Click "Import" tab
3. Choose file: `database_schema.sql`
4. Click "Go"

### 1.4 Create Admin User
Run this SQL query in phpMyAdmin SQL tab:

```sql
INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    role,
    email_verified,
    is_active,
    verification_token
) VALUES (
    'admin@biostecgroup.co.za',
    '$2y$12$3ELnct3YFFiYjX0LgnfGOO6dItHm0NNLuI7l5QccSwRW569vwGWtK',
    'Admin',
    'User',
    'admin',
    1,
    1,
    NULL
)
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    first_name = VALUES(first_name),
    last_name = VALUES(last_name),
    role = 'admin',
    email_verified = 1,
    is_active = 1,
    verification_token = NULL;
```

Default admin credentials:
- Email: admin@biostecgroup.co.za
- Password: Biostecgroup@4922

## Step 2: Project Setup

### 2.1 Place Project in htdocs
Copy the entire project folder to:
```
C:\xampp\htdocs\biostecgroup-1\
```

### 2.2 Update API Base URL
Edit `src/context/AuthContext.tsx`:
```typescript
const API_BASE_URL = 'http://localhost/biostecgroup-1/api';
```

Adjust the path based on your folder name in htdocs.

## Step 3: Install Dependencies

```bash
cd C:\xampp\htdocs\biostecgroup-1
npm install
```

## Step 4: Configure Apache (if needed)

If you have CORS issues, add to `C:\xampp\apache\conf\httpd.conf`:

```apache
<Directory "C:/xampp/htdocs/biostecgroup-1">
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</Directory>
```

Or create/edit `.htaccess` in the api folder:
```
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
```

## Step 5: Start Development Server

```bash
npm run dev
```

Access the app at: http://localhost:5173 (or the port Vite shows)

## Default Login Credentials

### Admin Account
- **Email:** admin@biostecgroup.co.za
- **Password:** (the one you set when creating the admin user)

## Database Schema Summary

### Tables Created:
1. **users** - Customer and admin accounts
2. **user_addresses** - Shipping/billing addresses
3. **categories** - Product categories
4. **products** - Laptop inventory
5. **inventory_logs** - Stock change audit trail
6. **orders** - Customer orders
7. **order_items** - Order line items
8. **repair_tickets** - Repair requests
9. **admin_activity_logs** - Security audit
10. **settings** - Application settings

### Key Features:
- Password hashing with bcrypt (cost 12)
- JWT token authentication
- Audit logging for all admin actions
- Inventory tracking with logs
- Full-text search on products
- Soft deletes and status flags

## API Endpoints

### Authentication
- `POST /api/auth/login.php` - Login
- `POST /api/auth/register.php` - Register

### Products
- `GET /api/products/list.php` - List products
- `POST /api/products/create.php` - Create product (admin)
- `PUT /api/products/update.php?id=X` - Update product (admin)
- `POST /api/products/upload.php` - Upload image (admin)

### Admin
- `GET /api/admin/stats.php` - Dashboard stats (admin)

## Security Features

1. **Password Hashing:** bcrypt with cost 12
2. **JWT Tokens:** Signed with secret key, 24hr expiry
3. **Prepared Statements:** All SQL uses prepared statements
4. **Input Sanitization:** XSS protection
5. **Role-based Access:** Admin vs customer permissions
6. **Audit Logging:** All admin actions logged
7. **CORS Headers:** Configured for cross-origin requests

## Troubleshooting

### Database Connection Error
- Check XAMPP MySQL is running
- Verify credentials in `api/config/database.php`
- Ensure database `biostec_db` exists

### 404 Errors on API
- Check project is in correct htdocs folder
- Verify Apache is running
- Check URL paths match folder structure

### CORS Errors
- Enable Apache headers module in XAMPP
- Add CORS headers to .htaccess or httpd.conf

### Image Upload Fails
- Check `api/uploads/` folder exists and is writable
- Verify PHP file upload limits in php.ini
- Check file size (max 5MB)

## File Structure

```
biostecgroup-1/
├── api/                    # PHP Backend
│   ├── config/
│   │   ├── database.php    # DB connection
│   │   └── auth.php        # Auth functions
│   ├── auth/
│   │   ├── login.php
│   │   └── register.php
│   ├── products/
│   │   ├── list.php
│   │   ├── create.php
│   │   ├── update.php
│   │   └── upload.php
│   ├── admin/
│   │   └── stats.php
│   └── uploads/            # Uploaded images
├── src/
│   ├── api/
│   │   └── products.ts     # Frontend API client
│   ├── context/
│   │   └── AuthContext.tsx # Auth state
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── Admin.tsx
│   └── ...
├── database_schema.sql     # Database setup
└── SETUP_INSTRUCTIONS.md   # This file
```

## Next Steps

1. Create additional admin endpoints for orders and repairs
2. Add email verification
3. Implement password reset
4. Add more detailed reporting
5. Set up automated backups
