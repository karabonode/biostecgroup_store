# 🚀 START HERE - DEPLOYMENT GUIDE

**Welcome to the Biostec Group Deployment Package**

This folder contains everything you need to deploy your e-commerce application to production. Follow these steps in order.

---

## ⏱️ ESTIMATED TIME: 2-3 hours

---

## PHASE 1: SECURITY (30 MINUTES) 🔐

### ⚠️ CRITICAL - Do this first!

Your API keys are currently exposed. You MUST regenerate them before any deployment.

### Step 1: Regenerate Yoco Payment Keys

1. Go to: https://dashboard.yoco.com
2. Sign in to your account
3. Navigate to **Settings → API Keys**
4. Click **Regenerate** for both keys
5. Copy the new keys:
   - New **Public Key**: `pk_live_...`
   - New **Secret Key**: `sk_live_...`

### Step 2: Update Environment File

```bash
# Edit the .env file
nano .env
```

Update these lines with your NEW keys:
```env
YOCO_PUBLIC_KEY=pk_live_xxxxx       # PASTE YOUR NEW PUBLIC KEY
YOCO_SECRET_KEY=sk_live_xxxxx       # PASTE YOUR NEW SECRET KEY
VITE_YOCO_PUBLIC_KEY=pk_live_xxxxx  # SAME AS ABOVE
SMTP_PASS=new_secure_password       # Change from: BiostecGroup@4922
```

### Step 3: Test Credentials

```bash
# Verify build works with new keys
npm run build

# Check for errors
echo $?  # Should output: 0
```

✅ **Security phase complete**

---

## PHASE 2: CHOOSE DEPLOYMENT PLATFORM (15 MINUTES) 🖥️

### Option A: Linux VPS (Most Control) ⭐

**Best for**: Full control, production use, cost-effective

Requirements:
- VPS provider account (DigitalOcean, Linode, AWS, etc.)
- Root/sudo access
- Minimum: 2GB RAM, 2 CPU, 20GB storage

**Cost**: $5-20/month

👉 **See**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#phase-2-server-preparation)

### Option B: Docker Container (Quick)

**Best for**: Developers, staging environments

Requirements:
- Docker installed locally
- Container registry (Docker Hub, etc.)

**Cost**: Variable

👉 **See**: [QUICK_REFERENCE.md#docker](./QUICK_REFERENCE.md)

### Option C: PaaS (Easiest)

**Best for**: No DevOps experience needed, fastest setup

Options: Heroku, Railway, Render, Vercel

**Cost**: $10-50/month

👉 **See**: [QUICK_REFERENCE.md#heroku](./QUICK_REFERENCE.md)

---

## PHASE 3: PREPARE YOUR SERVER (30-60 MINUTES) ⚙️

### If Using Linux VPS:

```bash
# 1. SSH into your server
ssh user@your-server-ip

# 2. Update system
sudo apt update && sudo apt upgrade -y

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs npm

# 4. Install MySQL
sudo apt install -y mysql-server

# 5. Install Nginx
sudo apt install -y nginx

# 6. Install PM2
sudo npm install -g pm2

# 7. Clone your project
cd /var/www
git clone https://github.com/YOUR-USERNAME/biostecgroup-1.git
cd biostecgroup-1
```

### Set Up Database:

```bash
# 1. Create database
mysql -u root -p

# In MySQL console:
CREATE DATABASE biostec_db CHARACTER SET utf8mb4;
CREATE USER 'biostec_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON biostec_db.* TO 'biostec_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 2. Import schema
mysql -u biostec_user -p biostec_db < database_schema.sql
mysql -u biostec_user -p biostec_db < database_migrations.sql
```

### Create .env on Server:

```bash
# Create .env with your production settings
nano .env
```

Add all required variables (see [QUICK_REFERENCE.md](./QUICK_REFERENCE.md))

✅ **Server preparation complete**

---

## PHASE 4: BUILD & TEST (30 MINUTES) 🧪

### Build Frontend:

```bash
# From project directory
npm install
npm run build

# Verify dist/ folder created
ls -la dist/
```

### Run Tests:

```bash
# Run all tests
npm run test:payment

# Expected output: ✅ Tests passed
```

✅ **Build complete**

---

## PHASE 5: DEPLOY APPLICATION (30 MINUTES) 🚀

### Using Automated Script:

```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy to production
./deploy.sh production
```

### Manual Deployment:

```bash
# 1. Install dependencies
npm ci

# 2. Build
npm run build

# 3. Start with PM2
pm2 start server.ts --name "biostecgroup" --interpreter tsx
pm2 startup
pm2 save

# 4. Configure Nginx (see DEPLOYMENT_GUIDE.md)
# Copy Nginx config and enable it
```

### Configure Domain & SSL:

```bash
# 1. Point domain to server IP in DNS settings

# 2. Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# 3. Update Nginx config with SSL paths

# 4. Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

✅ **Application deployed**

---

## PHASE 6: VERIFY DEPLOYMENT (30 MINUTES) ✅

### Health Checks:

```bash
# Test homepage
curl https://yourdomain.com

# Test API
curl https://yourdomain.com/api/products/list.php

# Check logs
pm2 logs biostecgroup
```

### Functional Testing:

- [ ] Visit https://yourdomain.com
- [ ] Browse products (should show items)
- [ ] Add product to cart
- [ ] Go to checkout
- [ ] Fill in order details
- [ ] Submit order
- [ ] Should receive confirmation email
- [ ] Check admin panel for order

### Payment Testing:

```bash
# Use Yoco test card
Card: 4000002500000003
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
```

✅ **All systems verified**

---

## WHAT'S IN THE BOX

### Documentation Files

📄 **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**
- Comprehensive 500+ line deployment guide
- 5 phases with detailed steps
- Troubleshooting section
- Rollback procedures

📋 **[PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md)**
- 50+ verification checkpoints
- Security audit items
- Testing requirements
- Monitoring setup

⚡ **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)**
- Common commands
- Quick troubleshooting
- Emergency procedures
- Service-specific guides

🔧 **[deploy.sh](./deploy.sh)**
- Automated deployment script
- Security checks
- Build automation
- Deployment logging

📊 **[DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md)**
- Current status report
- Requirements checklist
- Success criteria
- Version history

---

## TROUBLESHOOTING

### Build Fails

```bash
# Clear cache and retry
rm -rf node_modules dist
npm ci
npm run build
```

### Can't Connect to Database

```bash
# Check MySQL running
sudo systemctl status mysql

# Test credentials
mysql -u biostec_user -p biostec_db
```

### Payment Not Working

1. Verify YOCO keys in `.env`
2. Check webhook configured in Yoco dashboard
3. Review logs: `pm2 logs biostecgroup`
4. Test with Yoco test card (4000002500000003)

### 502 Bad Gateway

```bash
# Check app running
pm2 status

# Restart if needed
pm2 restart biostecgroup

# Check Nginx config
sudo nginx -t
```

### Need More Help?

1. Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#troubleshooting)
2. Review logs: `pm2 logs biostecgroup`
3. Check Yoco status: https://status.yoco.com
4. MySQL logs: `sudo tail -f /var/log/mysql/error.log`

---

## SUPPORT RESOURCES

- 📚 **Yoco Documentation**: https://developer.yoco.com
- 🟢 **Node.js Docs**: https://nodejs.org/en/docs/
- 🐬 **MySQL Documentation**: https://dev.mysql.com/doc/
- ⚙️ **Nginx Docs**: https://nginx.org/en/docs/

---

## DEPLOYMENT CHECKLIST

Before going live, verify:

```
Security:
  ☐ Yoco keys regenerated (NOT the exposed ones!)
  ☐ SMTP password changed
  ☐ .env file secure (permissions 600)
  
Build:
  ☐ npm run build succeeds
  ☐ npm run test:payment passes
  ☐ No TypeScript errors
  
Database:
  ☐ Schema imported
  ☐ Migrations applied
  ☐ Test data added
  
Deployment:
  ☐ Server provisioned
  ☐ Database created
  ☐ SSL certificate installed
  ☐ Nginx configured
  ☐ Application deployed
  
Testing:
  ☐ Homepage loads
  ☐ Products display
  ☐ Cart works
  ☐ Payment gateway integrates
  ☐ Order emails send
  ☐ Admin dashboard works
  
Monitoring:
  ☐ Application logging
  ☐ Error alerts configured
  ☐ Uptime monitoring
  ☐ Database backups running
```

---

## NEXT STEPS

1. ✅ **Complete Phase 1** (Security) - Start here!
2. ✅ **Choose Platform** (Phase 2) - Pick your hosting
3. ✅ **Prepare Server** (Phase 3) - Set up environment
4. ✅ **Build & Test** (Phase 4) - Verify code
5. ✅ **Deploy** (Phase 5) - Launch application
6. ✅ **Verify** (Phase 6) - Test everything works

---

## SUCCESS!

Once all phases complete, you'll have:

✅ Production-ready application  
✅ Secure payment processing  
✅ Working email notifications  
✅ Live product catalog  
✅ Order tracking system  
✅ Admin management panel  

---

**Questions?** Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**Need quick command?** See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

**Ready to deploy?** Run `./deploy.sh production`

---

🎉 **Good luck with your deployment!**

**Version**: 1.0  
**Last Updated**: May 16, 2026
