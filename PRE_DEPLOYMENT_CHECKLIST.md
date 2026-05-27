# PRE-DEPLOYMENT CHECKLIST

## 🔴 CRITICAL - Security (Complete IMMEDIATELY)

### Credentials Exposure
- [ ] **STOP** - Your live Yoco keys are exposed in `.env`
  - [ ] Go to https://dashboard.yoco.com
  - [ ] Navigate to API Keys section
  - [ ] Regenerate BOTH public and secret keys
  - [ ] Copy new keys
  - [ ] Update your `.env` file with new keys
  - [ ] Verify old keys no longer work

- [ ] SMTP password is exposed (`BiostecGroup@4922`)
  - [ ] Change email password immediately
  - [ ] Update `.env` file with new password
  - [ ] Test email sending works

- [ ] Firebase credentials may be exposed
  - [ ] Review firebase-service-account.json
  - [ ] Regenerate Firebase credentials if needed
  - [ ] Rotate API keys

### Version Control Security
- [ ] Add `.env` to `.gitignore`
  ```bash
  echo ".env" >> .gitignore
  ```
- [ ] If `.env` was committed, run:
  ```bash
  git rm --cached .env
  git commit -m "Remove .env from version control"
  ```
- [ ] Create `.env.example` (without secrets)

---

## ✅ CODE QUALITY

### Testing
- [ ] All tests pass: `npm run test`
- [ ] Payment tests pass: `npm run test:payment`
- [ ] No linting errors: `npm run lint`
- [ ] No TypeScript errors: `npm run lint`

### Build Verification
- [ ] Frontend builds without errors: `npm run build`
- [ ] No console warnings/errors in build output
- [ ] Verify `dist/` folder created with content

### Code Review
- [ ] Remove all `console.log()` statements (or use logger)
- [ ] Remove all `TODO` comments
- [ ] Check for hardcoded IP addresses or URLs
- [ ] Verify all API endpoints have error handling
- [ ] Check database queries for SQL injection vulnerability

---

## 📦 DEPENDENCIES

### Node.js Packages
- [ ] Run: `npm audit`
  - [ ] Fix vulnerabilities: `npm audit fix`
  - [ ] Address high/critical issues
  - [ ] Document any unfixed vulnerabilities
- [ ] Check for outdated packages: `npm outdated`
- [ ] Remove unused dependencies

### System Dependencies
- [ ] Node.js version: 18+ installed
- [ ] MySQL version: 5.7+ or 8.0+
- [ ] PHP version: 7.4+ (for API backend)
- [ ] npm version: 9+

---

## 🗄️ DATABASE

### Schema & Migrations
- [ ] Database schema imported: `database_schema.sql`
- [ ] Migrations applied: `database_migrations.sql`
- [ ] Admin user created with secure password
- [ ] Verify all tables exist:
  ```bash
  mysql -u root -p biostec_db -e "SHOW TABLES;"
  ```

### Data Integrity
- [ ] Backup of existing data created (if migrating)
- [ ] Sample products added (at least 1 test product)
- [ ] Test order can be created
- [ ] Database indexes optimized

### Connection Settings
- [ ] Database host correct in `api/config/database.php`
- [ ] Database user credentials correct
- [ ] Database charset set to `utf8mb4`
- [ ] Connection pooling enabled

---

## 🔧 ENVIRONMENT CONFIGURATION

### .env File
- [ ] Create `.env` file (copy from `.env.example` if exists)
- [ ] Set `NODE_ENV=production`
- [ ] Set `PORT=3000` (or desired port)
- [ ] Set `APP_URL=https://yourdomain.com`

### Yoco Payment
- [ ] `YOCO_PUBLIC_KEY` set to NEW key (not exposed one!)
- [ ] `YOCO_SECRET_KEY` set to NEW key (not exposed one!)
- [ ] `VITE_YOCO_PUBLIC_KEY` matches public key
- [ ] Webhook configuration verified in Yoco dashboard
- [ ] Test payment flow works

### Email/SMTP
- [ ] `SMTP_HOST` correct for your email provider
- [ ] `SMTP_PORT` correct (usually 465 for SSL)
- [ ] `SMTP_USER` and `SMTP_PASS` updated
- [ ] Test email sent successfully

### API & Frontend
- [ ] `GEMINI_API_KEY` set (if using Gemini features)
- [ ] Firebase credentials updated if needed
- [ ] All environment variables documented

---

## 🚀 DEPLOYMENT TARGET

### Choose Platform
- [ ] **Option A: Linux VPS/Dedicated Server**
  - [ ] Server IP/domain confirmed
  - [ ] SSH access verified
  - [ ] Root or sudo access available
  - [ ] Firewall rules configured (allow 80, 443)
  
- [ ] **Option B: Docker/Container**
  - [ ] Docker installed on host
  - [ ] Docker Compose configured
  - [ ] Container networking verified
  
- [ ] **Option C: PaaS (Heroku/Railway/Render)**
  - [ ] Account created
  - [ ] Project configured
  - [ ] Git repository connected

### Server Specifications
- [ ] CPU: 2+ cores
- [ ] RAM: 2GB minimum (4GB+ recommended)
- [ ] Storage: 10GB minimum
- [ ] Bandwidth: Sufficient for expected traffic
- [ ] Uptime guarantee: 99.9%+

---

## 🔐 SECURITY

### HTTPS/SSL
- [ ] Domain name registered
- [ ] SSL certificate obtained (Let's Encrypt recommended)
- [ ] Certificate auto-renewal configured
- [ ] HTTP redirects to HTTPS

### API Security
- [ ] CORS properly configured for your domain
- [ ] CSRF tokens enabled
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] SQL injection protection verified

### Authentication
- [ ] Password hashing: bcrypt with cost 12
- [ ] JWT tokens (if used) have expiration
- [ ] Sessions properly invalidate on logout
- [ ] Admin credentials changed from defaults

### File Permissions
- [ ] `.env` permissions: 600
- [ ] Database backup folder: 700
- [ ] Log folder: 755
- [ ] No world-readable sensitive files

---

## 📊 MONITORING & LOGGING

### Logging Setup
- [ ] Error logging configured
- [ ] Access logging enabled
- [ ] Log rotation configured (keep 30 days)
- [ ] Logs directory: `/var/log/biostecgroup/`

### Performance Monitoring
- [ ] Server monitoring tool selected (New Relic, DataDog, etc.)
- [ ] Uptime monitoring configured (Uptime Robot, etc.)
- [ ] Alert thresholds set
- [ ] Dashboard configured

### Backup Strategy
- [ ] Daily database backups configured
- [ ] Backup retention: 30 days minimum
- [ ] Backup encryption enabled
- [ ] Restore procedure tested

---

## 🧪 PRE-PRODUCTION TESTING

### Functional Testing
- [ ] Homepage loads correctly
- [ ] Products page displays all items
- [ ] Product detail page works
- [ ] Cart functionality works
- [ ] Checkout form submits
- [ ] Payment gateway integrates
- [ ] Order confirmation email sent
- [ ] Admin dashboard accessible

### Payment Testing (Use Test Keys First!)
- [ ] Create order with test product
- [ ] Submit payment with test card
- [ ] Webhook received and processed
- [ ] Order status updated in database
- [ ] Confirmation email sent
- [ ] Order appears in admin panel

### Security Testing
- [ ] HTTPS working (no mixed content warnings)
- [ ] `.env` not accessible via web
- [ ] API endpoints require proper authentication
- [ ] File upload restrictions enforced
- [ ] Admin panel password protected

### Performance Testing
- [ ] Homepage loads in < 3 seconds
- [ ] Products page loads in < 2 seconds
- [ ] Database queries optimized
- [ ] API response times < 500ms
- [ ] Concurrent user load tested

---

## 📋 DOCUMENTATION

### Code Documentation
- [ ] README.md updated with deployment info
- [ ] API endpoints documented
- [ ] Database schema documented
- [ ] Environment variables documented
- [ ] Troubleshooting guide created

### Team Documentation
- [ ] Deployment procedure documented
- [ ] Rollback procedure documented
- [ ] Escalation contacts listed
- [ ] Access credentials secured (use password manager)

---

## 🎯 FINAL CHECKLIST

Before going live:

- [ ] All security issues resolved
- [ ] All tests passing
- [ ] Database backed up
- [ ] Monitoring configured
- [ ] Support team trained
- [ ] Runbook/procedures documented
- [ ] Management approval obtained
- [ ] Maintenance window scheduled (if needed)

---

## 📞 DEPLOYMENT DAY CHECKLIST

### 24 Hours Before
- [ ] Final backup created
- [ ] All team members notified
- [ ] Rollback procedure verified
- [ ] Monitoring tools tested

### During Deployment
- [ ] Live monitoring active
- [ ] Chat channel open for team
- [ ] Database migration tested on backup first
- [ ] DNS/load balancer changes staged

### After Deployment
- [ ] Smoke tests run on production
- [ ] Team notified of success
- [ ] Customer-facing features verified
- [ ] Analytics tracking confirmed
- [ ] Support team alerted to monitor

### Documentation Updates
- [ ] Deployment log created
- [ ] Issues encountered documented
- [ ] Solutions documented for future reference
- [ ] Post-deployment review scheduled

---

**Status**: Ready for deployment ✅

**Last Reviewed**: May 16, 2026

**Next Review**: After first production deployment
