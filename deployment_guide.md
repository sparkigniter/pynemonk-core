# Deployment Guide: pynemonk Monolith

This guide provides step-by-step instructions for deploying the pynemonk monolith (API & Frontend) to a production server using Docker.

## 1. Prerequisites

Ensure the following are installed on your deployment server:
- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)

## 2. Infrastructure Setup

### Create Project Directory
```bash
mkdir -p ~/pynemonk
cd ~/pynemonk
```

### Create Environment File (`.env`)
Create an `.env` file to store your production secrets. Replace the placeholders with your actual values.

```bash
# Database
POSTGRES_USER=pynemonk_admin
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=pynemonk_core

# API Configuration
NODE_ENV=production
JWT_SECRET=your_super_secret_jwt_key
API_PORT=3000

# Frontend Configuration
VITE_API_URL=https://api.yourdomain.com
```

## 3. Docker Compose Configuration

Create a `docker-compose.yml` file on your server. This configuration uses the images you just pushed to Docker Hub.

```yaml
services:
  # ── Backend API (Monolith) ──────────────────────────────────────────────
  api:
    image: vikasmb123/pynemonk:tagname
    container_name: pynemonk-api
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PGHOST=postgres
      - PGUSER=${POSTGRES_USER}
      - PGPASSWORD=${POSTGRES_PASSWORD}
      - PGDATABASE=${POSTGRES_DB}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - pynemonk-net

  # ── Frontend (Vite/Nginx) ───────────────────────────────────────────────
  frontend:
    image: vikasmb123/pynemonk-frontend:tagname
    container_name: pynemonk-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=${VITE_API_URL}
    networks:
      - pynemonk-net

  # ── Database (PostgreSQL) ───────────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    container_name: pynemonk-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - pynemonk-net

networks:
  pynemonk-net:
    driver: bridge

volumes:
  postgres_data:
```

## 4. Deployment Commands

### Pull the Images
Ensure you are logged into Docker Hub if the repository is private:
```bash
docker login
docker compose pull
```

### Start the Services
Run the containers in detached mode:
```bash
docker compose up -d
```

### Run Database Migrations
Once the API is running, trigger the migrations to set up the schema:
```bash
docker exec -it pynemonk-api npm run migrate
```

### Verify Logs
Check if everything started correctly:
```bash
docker compose logs -f api
```

## 5. Post-Deployment
- **SSL**: It is highly recommended to set up an Nginx reverse proxy with Let's Encrypt (Certbot) in front of these containers.
- **Backups**: Set up a cron job to backup the `postgres_data` volume regularly.
