# CanSat GCS - Deployment Guide

## Overview

This guide covers deploying the CanSat Ground Control Software to various platforms for production use.

## Prerequisites

- Node.js 18+
- npm or yarn
- Git (optional, for GitHub Pages)
- Docker (optional, for container deployment)

## Local Development Deployment

### 1. Development Server

```bash
cd cansat-gcs
npm install
npm run dev
```

Accessible at: `http://localhost:3000`

### 2. Production Build

```bash
npm run build
npm run preview
```

This creates optimized production build in `dist/` folder.

## Cloud Deployment Options

### Option 1: Vercel (Recommended)

**Easiest & Fastest Deployment**

#### Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

#### Environment Variables

Set in Vercel dashboard:

```
VITE_API_URL=https://api.cansat.example.com
VITE_WEBSOCKET_URL=wss://ws.cansat.example.com
VITE_ENABLE_MOCK_DATA=false
```

#### Features

- Automatic deployments from Git
- Custom domains
- SSL certificates (free)
- Analytics & monitoring
- Serverless functions (optional)

### Option 2: Netlify

**User-Friendly Alternative**

#### Setup

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

#### Configuration File

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production]
  command = "npm run build"
  environment = { VITE_ENABLE_MOCK_DATA = "false" }
```

### Option 3: GitHub Pages

**Free for Open Source**

#### Setup

```bash
# Add to package.json
"homepage": "https://yourusername.github.io/cansat-gcs",

# Build
npm run build

# Deploy to gh-pages
git add dist/
git commit -m "Deploy to GitHub Pages"
git push

# Enable GitHub Pages in repository settings
# Set source to "Deploy from a branch"
# Select "gh-pages" branch
```

#### GitHub Actions (Auto-Deploy)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Option 4: Docker

**For On-Premise or Server Deployment**

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

#### Docker Compose

```yaml
version: "3.8"
services:
  cansat-gcs:
    build: .
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://api:8080
      - VITE_WEBSOCKET_URL=ws://ws:8080
    restart: unless-stopped
    networks:
      - cansat-network

  api:
    image: your-api:latest
    ports:
      - "8080:8080"
    networks:
      - cansat-network

networks:
  cansat-network:
    driver: bridge
```

#### Deploy to Docker Hub

```bash
# Build
docker build -t yourusername/cansat-gcs:1.0.0 .

# Login
docker login

# Push
docker push yourusername/cansat-gcs:1.0.0

# Run on server
docker run -d -p 3000:3000 yourusername/cansat-gcs:1.0.0
```

### Option 5: AWS

#### AWS S3 + CloudFront

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name/ --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

#### AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize
amplify init

# Deploy
amplify publish
```

### Option 6: Azure Static Web Apps

```bash
# Install Azure CLI
choco install azure-cli  # Windows
brew install azure-cli   # macOS

# Login
az login

# Create resource group
az group create \
  --name myResourceGroup \
  --location eastus

# Deploy
az staticwebapp create \
  --name cansat-gcs \
  --resource-group myResourceGroup \
  --source https://github.com/yourusername/cansat-gcs \
  --branch main \
  --app-location "dist"
```

## Self-Hosted Deployment

### Linux Server (Nginx)

#### Setup

```bash
# SSH to server
ssh user@your-server.com

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/yourusername/cansat-gcs.git
cd cansat-gcs

# Install dependencies and build
npm ci
npm run build

# Install PM2 for process management
npm install -g pm2

# Start application
pm2 start "npm run preview" --name "cansat-gcs"
pm2 startup
pm2 save
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name cansat.example.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cansat.example.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/cansat.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cansat.example.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        root /home/user/cansat-gcs/dist;
        try_files $uri $uri/ /index.html;
        index index.html index.htm;
    }

    # Cache static assets
    location /assets {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

#### SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d cansat.example.com

# Auto-renew
sudo systemctl enable certbot.timer
```

### Windows Server

#### Setup with IIS

1. Install Node.js on Windows
2. Build: `npm run build`
3. Install IIS URL Rewrite module
4. Create IIS site pointing to `dist` folder
5. Add URL Rewrite rule:
   ```xml
   <rule name="SPA" stopProcessing="true">
     <match url=".*" />
     <conditions logicalGrouping="MatchAll">
       <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
       <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
     </conditions>
     <action type="Rewrite" url="/index.html" />
   </rule>
   ```

## Performance Optimization

### Build Optimization

```bash
# Analyze bundle size
npm run build -- --stats

# Update package.json
{
  "scripts": {
    "build": "tsc -b && vite build --minify esbuild",
    "analyze": "vite build --stats"
  }
}
```

### Runtime Optimization

- Enable gzip compression in web server
- Set cache headers for static assets
- Use CDN for distribution
- Enable service workers for offline support

### CDN Configuration

```javascript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        dir: "dist",
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
};
```

## Monitoring & Logging

### Application Monitoring

```typescript
// src/services/monitoring.ts
export async function reportError(error: Error) {
  // Send to error tracking service
  fetch("/api/errors", {
    method: "POST",
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href,
    }),
  });
}
```

### Server Logs

```bash
# PM2 logs
pm2 logs cansat-gcs

# Follow logs
pm2 logs cansat-gcs --lines 50 --follow
```

## Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Set security headers
- [ ] Implement CORS properly
- [ ] Validate all user inputs
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Regular security audits
- [ ] Implement CSP headers
- [ ] Use package lock files

## Troubleshooting Deployment

### Build Fails

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Application Won't Start

```bash
# Check Node version
node --version  # Should be 18+

# Check port availability
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Check environment variables
echo $VITE_API_URL
```

### Performance Issues

```bash
# Profile build
npm run build -- --profile

# Monitor runtime
chrome://inspect  # DevTools

# Check memory usage
ps aux | grep node
```

## Rollback Procedures

```bash
# Vercel
vercel rollback

# Docker
docker run -d -p 3000:3000 yourusername/cansat-gcs:previous-version

# Git
git revert HEAD
git push
```

## Maintenance

### Regular Tasks

- [ ] Weekly: Check for security updates
- [ ] Monthly: Review error logs
- [ ] Quarterly: Update dependencies
- [ ] Yearly: Security audit

### Backup Strategy

```bash
# Backup database/data
aws s3 sync ./data s3://backup-bucket/cansat-gcs/

# Version control
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0
```

## Support & Contact

For deployment issues:

- Check logs: `pm2 logs`
- Review error tracking service
- Contact ISL support team

---

**Last Updated**: June 2026  
**Version**: 1.0.0
