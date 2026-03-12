#!/bin/bash

#############################################################################
# RAILWAY DEPLOYMENT SCRIPT
# Purpose: Automate deployment to Railway.com from CLI
# Usage: bash scripts/deploy-railway.sh [environment]
#############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
APP_DIR="$PROJECT_ROOT/app"
ENV="${1:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${BLUE}ℹ️  INFO${NC}: $1"
}

log_success() {
  echo -e "${GREEN}✓ SUCCESS${NC}: $1"
}

log_warning() {
  echo -e "${YELLOW}⚠️  WARNING${NC}: $1"
}

log_error() {
  echo -e "${RED}✗ ERROR${NC}: $1"
}

#############################################################################
# STEP 1: VERIFY PREREQUISITES
#############################################################################

log_info "Step 1: Verifying prerequisites..."

# Check Railway CLI installed
if ! command -v railway &> /dev/null; then
  log_error "Railway CLI not found"
  echo "Install from: https://docs.railway.app/guides/cli"
  exit 1
fi

log_success "Railway CLI is installed: $(railway --version)"

# Check Git
if ! command -v git &> /dev/null; then
  log_error "Git not installed"
  exit 1
fi

log_success "Git is available"

# Check Node.js
if ! command -v node &> /dev/null; then
  log_error "Node.js not installed"
  exit 1
fi

log_success "Node.js version: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
  log_error "npm not installed"
  exit 1
fi

log_success "npm version: $(npm --version)"

#############################################################################
# STEP 2: VERIFY GIT STATE
#############################################################################

log_info "Step 2: Verifying Git repository..."

cd "$PROJECT_ROOT"

# Check if on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  log_warning "Not on main branch (current: $CURRENT_BRANCH)"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_error "Deployment cancelled"
    exit 1
  fi
fi

log_success "On branch: $CURRENT_BRANCH"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  log_warning "Uncommitted changes detected"
  echo "Run: git status"
  read -p "Continue with deployment? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_error "Deployment cancelled"
    exit 1
  fi
fi

log_success "Git repository is clean"

#############################################################################
# STEP 3: CHECK ENVIRONMENT VARIABLES
#############################################################################

log_info "Step 3: Checking environment variables..."

cd "$APP_DIR"

# Check .env.local exists
if [ ! -f ".env.local" ]; then
  log_warning ".env.local not found"
  log_info "Creating .env.local from .env.example..."

  if [ -f ".env.example" ]; then
    cp ".env.example" ".env.local"
    log_success "Created .env.local"
  else
    log_error ".env.example not found"
    exit 1
  fi
fi

log_success ".env.local exists"

# Check required variables
if ! grep -q "DATABASE_URL" .env.local; then
  log_error "DATABASE_URL not set in .env.local"
  exit 1
fi

if ! grep -q "SESSION_SECRET" .env.local; then
  log_error "SESSION_SECRET not set in .env.local"
  exit 1
fi

if ! grep -q "FEEDBACK_HASH_SALT" .env.local; then
  log_error "FEEDBACK_HASH_SALT not set in .env.local"
  exit 1
fi

log_success "All required environment variables are set"

#############################################################################
# STEP 4: BUILD VERIFICATION
#############################################################################

log_info "Step 4: Building Next.js app..."

npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
  log_success "Build successful"
else
  log_error "Build failed"
  log_info "Run: npm run build (for details)"
  exit 1
fi

#############################################################################
# STEP 5: PUSH TO GITHUB
#############################################################################

log_info "Step 5: Pushing to GitHub..."

cd "$PROJECT_ROOT"

# Get commit count
COMMITS=$(git log --oneline origin/main..main 2>/dev/null | wc -l || echo "0")

if [ "$COMMITS" -gt 0 ]; then
  log_info "Found $COMMITS unpushed commits"
  git push origin main
  log_success "Pushed to GitHub"
else
  log_info "No new commits to push"
fi

#############################################################################
# STEP 6: RAILWAY AUTHENTICATION
#############################################################################

log_info "Step 6: Authenticating with Railway..."

# Check if already authenticated
if ! railway whoami &> /dev/null; then
  log_warning "Not authenticated with Railway"
  log_info "Run: railway login"
  log_info "Then re-run this script"
  exit 1
fi

RAILWAY_USER=$(railway whoami)
log_success "Authenticated as: $RAILWAY_USER"

#############################################################################
# STEP 7: LINK TO RAILWAY PROJECT
#############################################################################

log_info "Step 7: Linking to Railway project..."

cd "$PROJECT_ROOT"

# Check if .railway/config.json exists
if [ ! -f ".railway/config.json" ]; then
  log_warning "Not linked to Railway project"
  log_info "Railway will auto-detect from GitHub or use:"
  log_info "  railway link <PROJECT_ID>"
  log_info ""
  log_info "Get PROJECT_ID from: https://railway.app/dashboard"
  read -p "Enter Railway Project ID: " PROJECT_ID

  if [ -z "$PROJECT_ID" ]; then
    log_error "Project ID required"
    exit 1
  fi

  mkdir -p .railway
  echo "{\"projectId\": \"$PROJECT_ID\"}" > .railway/config.json
  log_success "Linked to project: $PROJECT_ID"
else
  PROJECT_ID=$(grep -o '"projectId": "[^"]*"' .railway/config.json | cut -d'"' -f4)
  log_success "Already linked to project: $PROJECT_ID"
fi

#############################################################################
# STEP 8: SET ENVIRONMENT VARIABLES ON RAILWAY
#############################################################################

log_info "Step 8: Setting environment variables on Railway..."

cd "$APP_DIR"

# Parse .env.local and set on Railway
set -a
source .env.local
set +a

log_info "Setting DATABASE_URL..."
railway variables set DATABASE_URL="$DATABASE_URL" --environment "$ENV" 2>/dev/null || log_warning "Could not set DATABASE_URL (may already exist)"

log_info "Setting SESSION_SECRET..."
railway variables set SESSION_SECRET="$SESSION_SECRET" --environment "$ENV" 2>/dev/null || log_warning "Could not set SESSION_SECRET (may already exist)"

log_info "Setting FEEDBACK_HASH_SALT..."
railway variables set FEEDBACK_HASH_SALT="$FEEDBACK_HASH_SALT" --environment "$ENV" 2>/dev/null || log_warning "Could not set FEEDBACK_HASH_SALT (may already exist)"

log_info "Setting NODE_ENV..."
railway variables set NODE_ENV="$ENV" --environment "$ENV" 2>/dev/null || log_warning "Could not set NODE_ENV (may already exist)"

log_success "Environment variables configured"

#############################################################################
# STEP 9: TRIGGER DEPLOYMENT
#############################################################################

log_info "Step 9: Triggering deployment on Railway..."

log_info "Railway will auto-deploy when code is pushed to GitHub"
log_info "Monitor deployment at:"
log_info "  https://railway.app/project/$PROJECT_ID"

log_success "Deployment initiated!"

#############################################################################
# STEP 10: WAIT FOR DEPLOYMENT (OPTIONAL)
#############################################################################

read -p "Wait for deployment to complete? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  log_info "Waiting for deployment..."
  log_info "(Press Ctrl+C to stop monitoring)"

  # Poll deployment status
  MAX_WAIT=600  # 10 minutes
  ELAPSED=0

  while [ $ELAPSED -lt $MAX_WAIT ]; do
    DEPLOYMENT_STATUS=$(railway deployments list --environment "$ENV" 2>/dev/null | head -1)

    if [[ $DEPLOYMENT_STATUS == *"SUCCESS"* ]] || [[ $DEPLOYMENT_STATUS == *"success"* ]]; then
      log_success "Deployment completed successfully!"
      break
    fi

    if [[ $DEPLOYMENT_STATUS == *"FAILED"* ]] || [[ $DEPLOYMENT_STATUS == *"failed"* ]]; then
      log_error "Deployment failed"
      log_info "Check logs at: https://railway.app/project/$PROJECT_ID"
      exit 1
    fi

    echo -ne "\rWaiting... $ELAPSED/${MAX_WAIT}s\033[0K"
    sleep 10
    ELAPSED=$((ELAPSED + 10))
  done
fi

#############################################################################
# FINAL STATUS
#############################################################################

log_info "Getting deployment info..."

# Get app URL
APP_URL=$(railway domain 2>/dev/null || echo "Check Railway dashboard for URL")

log_success "Deployment complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DEPLOYMENT SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Project:    pinbox-alternative"
echo "Environment: $ENV"
echo "App URL:    $APP_URL"
echo "Dashboard:  https://railway.app/project/$PROJECT_ID"
echo ""
echo "Next steps:"
echo "  1. Verify app is running at the URL above"
echo "  2. Test voting page: {URL}/523da2"
echo "  3. Generate QR posters:"
echo "     npm run generate-qr -- --slug 523da2 --base-url \"$APP_URL\""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
