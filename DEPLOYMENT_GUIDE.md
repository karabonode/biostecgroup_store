# Biostec Group - Deployment Guide

## Pre-Deployment Checklist

### 🔴 CRITICAL - Security Issues (DO THIS FIRST!)

- [ ] **Regenerate Yoco Keys** (EXPOSED IN .env)
  - Go to https://dashboard.yoco.com
  - Get NEW live keys (or use test keys first)
  - Update `.env` file
  
- [ ] **Regenerate SMTP Password** (EXPOSED IN .env)
  - Change password: `BiostecGroup@4922` → New secure password
  - Update `.env` file
  
- [ ] **Remove .env from Git** (if using version control)
  ```bash
  echo ".env" >> .gitignore
  ```

- [ ] **Set .env permissions to 600** (Unix/Linux servers)
  ```bash
  chmod 600 .env
  ```

### ✅ Environment Setup

#### Option A: Development Server (Current Setup)
- Node.js + Express
- PHP API Backend
- MySQL Database
- Port: 3002 (or next available)

#### Option B: Production Server (Recommended)
- Web Server: Apache/Nginx
- Runtime: Node.js or PHP-FPM
- Database: MySQL 8.0+
- SSL/TLS Certificate (HTTPS required for Yoco)
- Environment: Ubuntu 20.04+ or CentOS 8+

---

## STEP-BY-STEP DEPLOYMENT INSTRUCTIONS

### PHASE 1: Pre-Deployment (Local or Staging)

#### Step 1.1: Secure Your Credentials
```bash
# Create a secure .env file (never commit this!)
nano .env
```

**Required Variables:**
```env
# ── Server ────────────────────────────────────
PORT=3000
NODE_ENV=production
APP_URL=https://yourdomain.com

# ── Yoco Payment (GET NEW KEYS!) ──────────────
YOCO_PUBLIC_KEY=pk_live_xxxxx  # Replace with new keys
YOCO_SECRET_KEY=sk_live_xxxxx  # Replace with new keys
YOCO_WEBHOOK_SECRET=whsec_xxxxx
YOCO_WEBHOOK_ID=sub_xxxxx
VITE_YOCO_PUBLIC_KEY=pk_live_xxxxx

# ── Database ──────────────────────────────────
DB_HOST=localhost  # Change for remote DB
DB_NAME=biostec_db
DB_USER=biostec_user  # Create new user
DB_PASS=secure_password_here

# ── Email / SMTP (Change Password!) ───────────
SMTP_HOST=mail.biostecgroup.co.za
SMTP_PORT=465
SMTP_USER=info@biostecgroup.co.za
SMTP_PASS=new_secure_password  # NOT: BiostecGroup@4922
ADMIN_EMAIL=info@biostecgroup.co.za

# ── Gemini API ────────────────────────────────
GEMINI_API_KEY=your_gemini_api_key
```

#### Step 1.2: Set Up Production Database
```bash
# On your production server
mysql -u root -p

# In MySQL console
CREATE DATABASE biostec_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'biostec_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON biostec_db.* TO 'biostec_user'@'localhost';
FLUSH PRIVILEGES;

# Import schema
USE biostec_db;
SOURCE /path/to/database_schema.sql;
SOURCE /path/to/database_migrations.sql;
```

#### Step 1.3: Verify Project Structure
```bash
# From project root
npm install                    # Install dependencies
npm run build                  # Build React frontend
npm run lint                   # Check for errors
```

#### Step 1.4: Test Payment Gateway (Use Test Keys First!)
```bash
# Run payment tests
npm run test:payment
```

**Expected Results:**
- ✅ Test navigates through products
- ✅ Test adds product to cart
- ✅ Test goes to checkout
- ✅ Can submit order form

---

### PHASE 2: Server Preparation

#### Step 2.1: Choose Your Deployment Platform

**Option A: Linux Server (VPS/Dedicated)**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

**Option B: Docker Container**
- Use Dockerfile for reproducible deployments
- Includes Node.js, PHP, MySQL
- Easy scaling and management

**Option C: Platform as a Service (PaaS)**
- Heroku, Railway, Render
- Automatic SSL/TLS
- Managed databases
- Easiest setup

#### Step 2.2: Configure Web Server (Nginx Example)

Create `/etc/nginx/sites-available/biostecgroup`:

```nginx
upstream app {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Route to Node.js app
    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (optional)
    location /static/ {
        root /var/www/biostecgroup;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/biostecgroup /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 2.3: Set Up SSL Certificate (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx

sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

---

### PHASE 3: Deploy Application

#### Step 3.1: Clone/Upload Project to Server

```bash
# Option A: Git clone
cd /var/www
sudo git clone https://github.com/yourusername/biostecgroup-1.git
cd biostecgroup-1

# Option B: SCP upload
scp -r . user@server:/var/www/biostecgroup-1/
ssh user@server

# Set permissions
cd /var/www/biostecgroup-1
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
sudo chmod 600 .env
```

#### Step 3.2: Install Dependencies & Build

```bash
# Install Node dependencies
npm ci  # Use ci instead of install for production

# Build React frontend
npm run build

# Install PM2 globally (if not done)
sudo npm install -g pm2
```

#### Step 3.3: Start Application with PM2

```bash
# Start the server
pm2 start server.ts --name "biostecgroup" --interpreter tsx

# Configure PM2 startup
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs biostecgroup
```

#### Step 3.4: Verify Deployment

Test the following URLs:

```bash
# Frontend
curl https://yourdomain.com/

# API Health Check
curl https://yourdomain.com/api/products/list.php

# Admin Panel
curl https://yourdomain.com/admin/stats
```

---

### PHASE 4: Post-Deployment

#### Step 4.1: Database Backup Setup

```bash
# Create backup script
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
mysqldump -u biostec_user -p${DB_PASS} biostec_db | gzip > $BACKUP_DIR/biostec_db_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# Schedule daily backups (crontab)
# Add: 2 0 * * * /usr/local/bin/backup-db.sh
```

#### Step 4.2: Monitoring & Logging

```bash
# View logs
pm2 logs biostecgroup

# Monitor performance
pm2 monit

# Setup log rotation
cat > /etc/logrotate.d/biostecgroup << 'EOF'
/var/www/biostecgroup-1/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
}
EOF
```

#### Step 4.3: Configure Yoco Webhooks

In your Yoco Dashboard:

1. Go to **Settings → Webhooks**
2. Add webhook endpoint: `https://yourdomain.com/api/webhooks/yoco.php`
3. Select events: `payment.completed`, `payment.failed`
4. Copy webhook secret to `.env`: `YOCO_WEBHOOK_SECRET`
5. Test webhook delivery

#### Step 4.4: Email Verification

```php
// Test email from command line
php -r "
\$_ENV['SMTP_HOST'] = 'mail.biostecgroup.co.za';
\$_ENV['SMTP_PORT'] = '465';
\$_ENV['SMTP_USER'] = 'info@biostecgroup.co.za';
\$_ENV['SMTP_PASS'] = 'your_new_password';
// Test email send
"
```

#### Step 4.5: Health Checks & Monitoring

Set up monitoring service (e.g., Uptime Robot):

```
- Monitor: https://yourdomain.com/health
- Check interval: Every 5 minutes
- Notify on: Down for 5 minutes
```

---

### PHASE 5: Final Testing

#### Step 5.1: Functional Tests

```bash
# Run full test suite
npm run test

# Run payment tests with production keys
npm run test:payment
```

#### Step 5.2: Security Tests

- [ ] HTTPS working (green lock icon)
- [ ] .env file not accessible via web
- [ ] API endpoints require authentication
- [ ] SQL injection protection enabled
- [ ] CORS properly configured
- [ ] XSS protections in place

#### Step 5.3: Performance Tests

```bash
# Check page load time
curl -w "@curl-format.txt" https://yourdomain.com/

# Database query performance
mysql -u biostec_user -p -e "
  SELECT 
    \`TABLE_NAME\`,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size in MB'
  FROM information_schema.TABLES
  WHERE table_schema = 'biostec_db';
"
```

#### Step 5.4: Production Payment Test

**DO NOT USE LIVE KEYS ON TEST TRANSACTIONS**

Use Yoco test card:
- Number: `4000002500000003`
- Expiry: Any future date
- CVC: Any 3 digits

---

## TROUBLESHOOTING

### Common Issues

**Issue: Port already in use**
```bash
# Find process using port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

**Issue: Database connection error**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Check credentials
mysql -u biostec_user -p biostec_db
```

**Issue: Payment not processing**
- [ ] Check YOCO_SECRET_KEY is correct
- [ ] Check webhook secret matches Yoco dashboard
- [ ] Check SMTP credentials for order notifications
- [ ] Review logs: `pm2 logs biostecgroup`

**Issue: High memory usage**
```bash
# Check Node.js memory
pm2 monit

# Increase memory limit
pm2 start server.ts --max-memory-restart 500M
```

---

## ROLLBACK PROCEDURE

If deployment fails:

```bash
# Stop current version
pm2 stop biostecgroup

# Restore previous database
gunzip < /var/backups/mysql/biostec_db_YYYY-MM-DD.sql.gz | mysql -u biostec_user -p biostec_db

# Restore previous code
cd /var/www
git checkout previous-working-commit

# Rebuild & restart
npm ci && npm run build
pm2 start biostecgroup
```

---

## MAINTENANCE SCHEDULE

| Task | Frequency | Command |
|------|-----------|---------|
| Database Backup | Daily | `backup-db.sh` |
| Log Rotation | Weekly | Automatic (logrotate) |
| SSL Renewal | Auto | certbot (30 days before expiry) |
| Dependency Updates | Monthly | `npm audit fix` |
| Security Review | Quarterly | Review logs, access logs |
| Full System Update | Quarterly | `apt update && apt upgrade` |

---

## Support & Resources

- **Yoco Documentation**: https://developer.yoco.com
- **Node.js Best Practices**: https://nodejs.org/en/docs/
- **MySQL Admin**: https://dev.mysql.com
- **Nginx Config**: https://nginx.org/en/docs/
- **PM2 Docs**: https://pm2.keymetrics.io/docs

---

**Last Updated**: May 16, 2026  
**Version**: 1.0
