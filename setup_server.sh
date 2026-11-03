#!/bin/bash
set -e

echo "=== Step 1: Removing old code (habesha_ams) without backup ==="
rm -rf /home/charisme/habesha_ams
rm -f /home/charisme/public_html

echo "=== Step 2: Extracting elhadar_hrms ==="
rm -rf /home/charisme/elhadar_hrms
mkdir -p /home/charisme/elhadar_hrms
tar -xzf /home/charisme/elhadar_deploy.tar.gz -C /home/charisme/elhadar_hrms

echo "=== Step 3: Symlinking public_html -> elhadar_hrms/public ==="
ln -sfn /home/charisme/elhadar_hrms/public /home/charisme/public_html

echo "=== Step 4: Configuring .env and permissions ==="
cd /home/charisme/elhadar_hrms
cp .env.example .env

sed -i 's|APP_NAME=.*|APP_NAME="Elhadar Engineering HRMS"|g' .env
sed -i 's|APP_ENV=.*|APP_ENV=production|g' .env
sed -i 's|APP_DEBUG=.*|APP_DEBUG=false|g' .env
sed -i 's|APP_URL=.*|APP_URL=https://charismahand.com|g' .env
sed -i 's|SESSION_DRIVER=.*|SESSION_DRIVER=file|g' .env
sed -i 's|CACHE_STORE=.*|CACHE_STORE=file|g' .env
sed -i 's|QUEUE_CONNECTION=.*|QUEUE_CONNECTION=sync|g' .env

mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache
chmod -R 775 storage bootstrap/cache

echo "=== Step 5: Running composer install ==="
/home/charisme/bin/composer install --no-dev --optimize-autoloader --no-interaction

echo "=== Step 6: Generating application key ==="
php artisan key:generate --force
php artisan storage:link

echo "=== Step 7: Completed successfully! ==="
