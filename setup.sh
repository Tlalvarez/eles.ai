#!/bin/bash
set -e

echo "=== eles.ai Server Setup ==="

# Update system
echo "Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
echo "Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "Installing Nginx..."
sudo apt install -y nginx

# Install Certbot for SSL
echo "Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Clone repo
echo "Cloning repository..."
cd ~
git clone https://github.com/Tlalvarez/eles.ai.git
cd eles.ai

# Create .env.local
echo "Creating environment file..."
cat > .env.local << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://uuapsgtrdbdkowcvpbhw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1YXBzZ3RyZGJka293Y3ZwYmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MzE3MzAsImV4cCI6MjA4NTQwNzczMH0.IqEUI9eoNnuX-1FKezketqNFKQ1X7K3NQJOGzoQCQRY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1YXBzZ3RyZGJka293Y3ZwYmh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTgzMTczMCwiZXhwIjoyMDg1NDA3NzMwfQ.lPRmtz-pwnYYp3cvdllzLTHO6Wfb14r6lXA8JqY9LXg

# App
NEXT_PUBLIC_APP_URL=https://eles.ai
EOF

# Install dependencies and build
echo "Installing dependencies..."
npm install

echo "Building app..."
npm run build

# Configure Nginx
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/eles.ai > /dev/null << 'EOF'
server {
    listen 80;
    server_name eles.ai www.eles.ai;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/eles.ai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Start app with PM2
echo "Starting app with PM2..."
pm2 start npm --name "eles-ai" -- start
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | sudo bash

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next step: Set up SSL by running:"
echo "  sudo certbot --nginx -d eles.ai -d www.eles.ai"
echo ""
echo "Your site will be live at https://eles.ai after SSL setup."
