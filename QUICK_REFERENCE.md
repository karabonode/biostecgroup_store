# QUICK REFERENCE - DEPLOYMENT COMMANDS

## 🚀 QUICK START

### Local Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:3002)
npm run test         # Run all tests
npm run test:payment # Run payment tests
```

### Build for Production
```bash
npm run build        # Build React + TypeScript
npm run lint         # Check for errors
```

### Automated Deployment
```bash
chmod +x deploy.sh   # Make script executable
./deploy.sh production  # Deploy to production
./deploy.sh staging     # Deploy to staging
./deploy.sh development # Build for development
```

---

## 🔐 SECURITY - DO THIS FIRST

### 1️⃣ Regenerate Exposed Keys
```bash
# Edit .env and update these (DO NOT skip!)
YOCO_PUBLIC_KEY=pk_live_xxxxx       # Get from https://dashboard.yoco.com
YOCO_SECRET_KEY=sk_live_xxxxx       # Get from https://dashboard.yoco.com
VITE_YOCO_PUBLIC_KEY=pk_live_xxxxx
SMTP_PASS=new_secure_password       # Change from: BiostecGroup@4922
```

### 2️⃣ Hide .env from Git
```bash
echo ".env" >> .gitignore
git rm --cached .env
git commit -m "Remove .env from version control"
```

### 3️⃣ Secure File Permissions
```bash
chmod 600 .env                # Only owner can read
chmod 755 api/                # API folder readable
chmod 644 api/config/*.php    # Config files readable but not writable
```

---

## 📦 DEPLOYMENT ENVIRONMENTS

### Option 1: Linux VPS (Recommended)
```bash
# 1. Connect to server
ssh user@yourdomain.com

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs npm

# 3. Clone project
cd /var/www
sudo git clone https://github.com/yourusername/repo.git biostecgroup-1
cd biostecgroup-1

# 4. Setup environment
nano .env  # Add all required variables

# 5. Build and start
npm ci && npm run build
sudo npm install -g pm2
pm2 start server.ts --name biostecgroup
pm2 startup && pm2 save
```

### Option 2: Docker
```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 3000
CMD ["node", "server.ts"]
EOF

# Build and run
docker build -t biostecgroup .
docker run -p 3000:3000 --env-file .env biostecgroup
```

### Option 3: Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create biostecgroup
heroku config:set NODE_ENV=production

# Add environment variables
heroku config:set YOCO_PUBLIC_KEY=pk_live_xxxxx
heroku config:set YOCO_SECRET_KEY=sk_live_xxxxx
heroku config:set SMTP_PASS=new_password

# Deploy
git push heroku main
```

---

## 🗄️ DATABASE SETUP

### Create Database
```bash
# On server
mysql -u root -p

# In MySQL
CREATE DATABASE biostec_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'biostec_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON biostec_db.* TO 'biostec_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Import Schema
```bash
mysql -u biostec_user -p biostec_db < database_schema.sql
mysql -u biostec_user -p biostec_db < database_migrations.sql
```

### Verify Tables
```bash
mysql -u biostec_user -p -e "USE biostec_db; SHOW TABLES;"
```

---

## 🔧 CONFIGURE WEB SERVER

### Nginx (Reverse Proxy)
```bash
sudo nano /etc/nginx/sites-available/biostecgroup
```

```nginx
upstream app { server localhost:3000; }

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable & Test
```bash
sudo ln -s /etc/nginx/sites-available/biostecgroup /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## 🚀 START & MANAGE APPLICATION

### Using PM2
```bash
# Start application
pm2 start server.ts --name "biostecgroup" --interpreter tsx

# View logs
pm2 logs biostecgroup

# Monitor
pm2 monit

# Restart
pm2 restart biostecgroup

# Stop
pm2 stop biostecgroup

# Setup auto-start on reboot
pm2 startup
pm2 save
```

---

## 🧪 TESTING

### Payment Tests
```bash
# Use test cards from Yoco
npm run test:payment

# Test card: 4000002500000003
# Expiry: Any future date
# CVC: Any 3 digits
```

### Verify Deployment
```bash
# Check homepage
curl https://yourdomain.com

# Check API
curl https://yourdomain.com/api/products/list.php

# Check SSL
curl -I https://yourdomain.com | grep SSL
```

---

## 💾 BACKUP & RESTORE

### Create Backup
```bash
# Database backup
mysqldump -u biostec_user -p biostec_db | gzip > backup_$(date +%Y%m%d).sql.gz

# Application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz /var/www/biostecgroup-1
```

### Restore Backup
```bash
# Restore database
gunzip < backup_20260516.sql.gz | mysql -u biostec_user -p biostec_db

# Restore application
tar -xzf app_backup_20260516.tar.gz -C /var/www
```

---

## 📊 MONITORING

### Application Logs
```bash
# Real-time logs
pm2 logs biostecgroup

# Filter by error
pm2 logs biostecgroup | grep ERROR

# View log file
tail -f ~/.pm2/logs/biostecgroup-out.log
```

### Database Health
```bash
# Check processes
mysql -u biostec_user -p -e "SHOW PROCESSLIST;"

# Check table sizes
mysql -u biostec_user -p -e "
  SELECT TABLE_NAME, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'MB'
  FROM information_schema.TABLES WHERE table_schema = 'biostec_db';
"
```

### Server Health
```bash
# CPU & Memory
top -b -n 1 | head -n 15

# Disk usage
df -h

# Load average
uptime

# Network
netstat -tuln | grep LISTEN
```

---

## 🐛 TROUBLESHOOTING

### Port Already in Use
```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Can't Connect to Database
```bash
# Check MySQL running
sudo systemctl status mysql

# Test connection
mysql -u biostec_user -p -h localhost

# Check credentials in .env
nano .env | grep DB_
```

### Payment Not Working
```bash
# Check keys
grep YOCO .env

# Test API
curl -H "Authorization: Bearer sk_live_xxxxx" \
     https://api.yoco.com/v1/payment_methods

# Check logs
pm2 logs biostecgroup | grep -i yoco
```

### High Memory Usage
```bash
# Monitor
pm2 monit

# Increase limit
pm2 start server.ts --max-memory-restart 500M
```

---

## 📋 DEPLOYMENT CHECKLIST

Before going live, verify:

- [ ] `.env` has new Yoco keys (not exposed ones!)
- [ ] SMTP password changed
- [ ] SSL certificate installed (HTTPS working)
- [ ] Database imported and tested
- [ ] Application builds without errors
- [ ] Tests pass (npm run test)
- [ ] Homepage loads in browser
- [ ] Payment test successful
- [ ] Admin panel accessible
- [ ] Email notifications working
- [ ] Backups configured
- [ ] Monitoring active
- [ ] Support team trained
- [ ] Rollback procedure documented

---

## 🆘 EMERGENCY PROCEDURES

### Quick Rollback
```bash
# Stop current version
pm2 stop biostecgroup

# Restore from backup
tar -xzf app_backup_20260516.tar.gz -C /var/www

# Restore database
gunzip < backup_20260516.sql.gz | mysql -u biostec_user -p biostec_db

# Restart
pm2 start biostecgroup
```

### Restart Everything
```bash
# Restart Node.js app
pm2 restart biostecgroup

# Restart Nginx
sudo systemctl restart nginx

# Restart MySQL
sudo systemctl restart mysql
```

### Emergency Contact
- On-call support: [Add phone number]
- Escalation: [Add manager details]
- Status page: https://status.yourdomain.com

---

## 📞 SUPPORT

- **Yoco Docs**: https://developer.yoco.com
- **Node.js Docs**: https://nodejs.org/docs
- **MySQL Docs**: https://dev.mysql.com
- **Nginx Docs**: https://nginx.org/docs

---

**Version**: 1.0  
**Last Updated**: May 16, 2026
