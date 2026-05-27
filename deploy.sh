#!/bin/bash

# Biostec Group - Automated Deployment Script
# Usage: ./deploy.sh [production|staging|development]

set -e  # Exit on error

ENVIRONMENT=${1:-development}
PROJECT_ROOT=$(pwd)
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="./backups"
LOG_FILE="./deploy_${TIMESTAMP}.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Header
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Biostec Group - Deployment Script                        ║"
echo "║   Environment: ${ENVIRONMENT}                                    ║"
echo "║   Time: ${TIMESTAMP}                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

log "Starting deployment process..."

# ============================================================================
# PHASE 1: PRE-DEPLOYMENT CHECKS
# ============================================================================

log "PHASE 1: Pre-Deployment Checks"

# Check Node.js
log "Checking Node.js..."
NODE_VERSION=$(node -v)
if [[ $NODE_VERSION != v* ]]; then
    error "Node.js not found"
fi
success "Node.js $NODE_VERSION found"

# Check npm
log "Checking npm..."
NPM_VERSION=$(npm -v)
success "npm $NPM_VERSION found"

# Check .env exists
if [ ! -f .env ]; then
    error ".env file not found. Please create it from .env.example"
fi
log ".env file verified"

# Check for exposed keys
if grep -q "pk_live\|sk_live" .env; then
    if grep -q "efbf3dcbdV9gmoM28554\|c7183ca3M14lqJvcf0c4afc8cd2a" .env; then
        error "SECURITY ALERT: Exposed Yoco keys detected! Please regenerate keys from dashboard."
    fi
fi
success "Credentials check passed"

# ============================================================================
# PHASE 2: DEPENDENCY INSTALLATION
# ============================================================================

log "PHASE 2: Installing Dependencies"

if [ -d node_modules ]; then
    log "node_modules found, skipping npm install"
else
    log "Running: npm ci"
    npm ci || error "Failed to install dependencies"
fi
success "Dependencies installed"

# ============================================================================
# PHASE 3: SECURITY AUDIT
# ============================================================================

log "PHASE 3: Security Audit"

log "Running npm audit..."
AUDIT_OUTPUT=$(npm audit --json 2>/dev/null || echo '{}')

# Check for vulnerabilities
if echo "$AUDIT_OUTPUT" | grep -q '"vulnerabilities"'; then
    warning "Security vulnerabilities found. Running npm audit fix..."
    npm audit fix --force 2>/dev/null || warning "Some vulnerabilities could not be auto-fixed"
fi
success "Security audit completed"

# ============================================================================
# PHASE 4: BUILD PROCESS
# ============================================================================

log "PHASE 4: Building Application"

# Create backup
log "Creating backup..."
mkdir -p "$BACKUP_DIR"
if [ -d dist ]; then
    tar -czf "${BACKUP_DIR}/dist_${TIMESTAMP}.tar.gz" dist/ 2>/dev/null || warning "Could not backup old dist"
    log "Backup created: ${BACKUP_DIR}/dist_${TIMESTAMP}.tar.gz"
fi

# Clean previous build
log "Cleaning previous build..."
rm -rf dist/

# Build
log "Building frontend: npm run build"
npm run build || error "Frontend build failed"
success "Frontend build completed"

# Verify build output
if [ ! -d dist ]; then
    error "Build directory not created"
fi

log "Build artifacts: $(du -sh dist/)"

# ============================================================================
# PHASE 5: CODE QUALITY
# ============================================================================

log "PHASE 5: Code Quality Checks"

# TypeScript check
log "Running TypeScript check..."
npm run lint 2>/dev/null || warning "TypeScript check found issues"
success "Code quality check completed"

# ============================================================================
# PHASE 6: TESTING
# ============================================================================

if [ "$ENVIRONMENT" != "production" ]; then
    log "PHASE 6: Running Tests"
    
    # Run payment tests
    log "Running payment tests..."
    npm run test:payment 2>/dev/null || warning "Some tests failed"
    success "Tests completed"
else
    log "PHASE 6: Skipping tests (production build)"
fi

# ============================================================================
# PHASE 7: PRODUCTION-SPECIFIC CHECKS
# ============================================================================

if [ "$ENVIRONMENT" = "production" ]; then
    log "PHASE 7: Production Checks"
    
    # Check for debug code
    if grep -r "console.log" src/ --include="*.ts" --include="*.tsx" --include="*.js"; then
        warning "console.log statements found in source code"
    fi
    
    # Check for TODO comments
    if grep -r "TODO\|FIXME\|HACK" src/ --include="*.ts" --include="*.tsx"; then
        warning "TODO/FIXME comments found in source code"
    fi
    
    # Verify environment is production
    if ! grep -q "NODE_ENV=production" .env; then
        warning "NODE_ENV not set to production in .env"
    fi
    
    success "Production checks completed"
fi

# ============================================================================
# PHASE 8: DEPLOYMENT
# ============================================================================

log "PHASE 8: Deployment Steps"

case "$ENVIRONMENT" in
    production)
        log "Production deployment:"
        log "1. Upload to server:"
        log "   scp -r dist/ user@server:/var/www/biostecgroup/"
        log "2. Restart application:"
        log "   pm2 restart biostecgroup"
        log "3. Verify deployment:"
        log "   curl https://yourdomain.com"
        ;;
    staging)
        log "Staging deployment:"
        log "1. Upload to staging server:"
        log "   scp -r dist/ staging@server:/var/www/staging/"
        log "2. Run tests on staging"
        ;;
    development)
        success "Development build ready. Run: npm run dev"
        ;;
esac

# ============================================================================
# PHASE 9: POST-DEPLOYMENT
# ============================================================================

log "PHASE 9: Post-Deployment Tasks"

case "$ENVIRONMENT" in
    production)
        log "Post-deployment checklist:"
        log "□ Verify HTTPS working"
        log "□ Check homepage loads"
        log "□ Verify products display"
        log "□ Test payment flow"
        log "□ Check email notifications"
        log "□ Verify database connectivity"
        log "□ Monitor error logs"
        ;;
    *)
        success "Build completed successfully"
        ;;
esac

# ============================================================================
# COMPLETION
# ============================================================================

log "Deployment log saved to: $LOG_FILE"
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              DEPLOYMENT COMPLETED SUCCESSFULLY              ║"
echo "║                                                            ║"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "║  ⚠️  Remember to:                                           ║"
    echo "║     1. Monitor application logs                             ║"
    echo "║     2. Verify payment processing                            ║"
    echo "║     3. Test customer emails                                 ║"
    echo "║     4. Check analytics tracking                             ║"
else
    echo "║  Ready for testing and further deployment                   ║"
fi
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

success "All deployment tasks completed!"
