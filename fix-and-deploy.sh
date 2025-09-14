#!/bin/bash
set -e

APP_DIR="/home/deploy/apps/partpulse-app"
WEB_ROOT="/var/www/html"

echo "🔧 Fixing CSS asset deployment and redeploying..."

# 1. Navigate to app directory
cd "$APP_DIR"

# 2. Pull latest code and restore original Vite config
git fetch origin
git reset --hard origin/main
echo "[INFO] Pulled latest code"

# 3. Install dependencies (legacy peer deps)
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
echo "[INFO] Dependencies installed"

# 4. Build the application
npm run build
echo "[INFO] Build completed"

# 5. Deploy all build output, preserving CSS assets
sudo rm -rf "$WEB_ROOT"/*
sudo mkdir -p "$WEB_ROOT/assets/css" "$WEB_ROOT/assets/js" "$WEB_ROOT/assets/other"
sudo cp -r dist/* "$WEB_ROOT"/
echo "[INFO] Copied dist/* to $WEB_ROOT"

# 6. Fix permissions
sudo chown -R www-data:www-data "$WEB_ROOT"
sudo chmod -R 755 "$WEB_ROOT"
echo "[INFO] Permissions fixed"

# 7. Reload Nginx
sudo systemctl reload nginx
echo "[INFO] Nginx reloaded"

# 8. Verify HTTP status
STATUS=$(curl -o /dev/null -s -w "%{http_code}" http://localhost)
echo "[INFO] HTTP status code: $STATUS"
if [ "$STATUS" = "200" ]; then
  echo "✅ Deployment successful! Your styled CMMS is live."
else
  echo "❌ Deployment failed with HTTP status $STATUS"
  exit 1
fi
