# Vidyamrit Deployment Guide

This guide explains how to deploy the Vidyamrit application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed
- MongoDB instance (local or cloud)
- Firebase Service Account Key
- Domain name configured (for production)

## Setup Instructions

### 1. Environment Configuration

#### Backend Environment Variables

Create a `.env.production` file in the `backend/` directory:

```bash
cp backend/.env.production.example backend/.env.production
```

Edit `backend/.env.production` and configure:

```env
NODE_ENV=production
PORT=5001
MONGO_URI=mongodb://your-mongodb-uri/vidyamrit
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./firebaseServiceAccountKey.json
LOGGER_PATH=./logs
MAIL_USER=your-email@example.com
MAIL_PASS=your-email-password
CORS_ORIGIN=https://your-production-domain.com
```

#### Frontend Environment Variables

Create a `.env.production` file in the `pwa/` directory:

```bash
cp pwa/.env.production.example pwa/.env.production
```

Edit `pwa/.env.production` and configure:

```env
# Since backend serves frontend, use the same domain
VITE_BACKEND_URL=https://your-production-domain.com

# Firebase configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 2. Firebase Service Account Key

Ensure `firebaseServiceAccountKey.json` is present in the `backend/` directory.

```bash
# Verify the file exists
ls -la backend/firebaseServiceAccountKey.json
```

### 3. Build Docker Image

Build the Docker image:

```bash
docker build -t vidyamrit-app:latest .
```

This will:
- Build the frontend (PWA) using Vite
- Build the backend TypeScript code
- Combine both into a single production image
- The backend will serve the frontend at the root path

### 4. Deploy with Docker Compose

Start the application:

```bash
docker-compose up -d
```

Check the logs:

```bash
docker-compose logs -f
```

Stop the application:

```bash
docker-compose down
```

### 5. Deploy to Easypanel

#### Option A: Using Docker Image

1. **Build and push your image to a registry:**

```bash
# Tag your image
docker tag vidyamrit-app:latest your-registry/vidyamrit-app:latest

# Push to registry
docker push your-registry/vidyamrit-app:latest
```

2. **In Easypanel:**
   - Create a new service
   - Select "Docker Image"
   - Enter your image: `your-registry/vidyamrit-app:latest`
   - Set port to `5001`
   - Add environment variables from `backend/.env.production`
   - Add volume mounts:
     - `./logs` → `/app/logs`
     - `./firebaseServiceAccountKey.json` → `/app/firebaseServiceAccountKey.json` (read-only)
   - Deploy

#### Option B: Using GitHub Repository

1. **In Easypanel:**
   - Create a new service
   - Select "GitHub Repository"
   - Connect your Vidyamrit repository
   - Set Dockerfile path: `./Dockerfile`
   - Set build context: `.` (root)
   - Set port to `5001`
   - Add environment variables from `backend/.env.production`
   - Add volume mounts for logs and Firebase key
   - Deploy

### 6. Health Check

The application includes a health check endpoint at `/api/health`. You can verify the deployment:

```bash
curl http://localhost:5001/api/health
```

Or in production:

```bash
curl https://your-production-domain.com/api/health
```

## Application Architecture

- **Frontend (PWA):** Built with Vite/React, served as static files from `/app/public`
- **Backend (API):** Node.js/Express server serving:
  - API endpoints at `/api/*`
  - Frontend static files at `/*` (all non-API routes)
  - Handles client-side routing for React Router

## Port Configuration

- **Container Port:** 5001
- **Host Port:** 5001 (configurable in docker-compose.yml)

## Volumes

- **Logs:** `./backend/logs` → `/app/logs` (for persistent logging)
- **Firebase Key:** `./backend/firebaseServiceAccountKey.json` → `/app/firebaseServiceAccountKey.json` (read-only)

## Network

The application uses a Docker bridge network named `vidyamrit-network`.

## Troubleshooting

### Build Issues

1. **Dependencies failing:**
   ```bash
   # Clear Docker cache and rebuild
   docker build --no-cache -t vidyamrit-app:latest .
   ```

2. **TypeScript compilation errors:**
   - Check `backend/tsconfig.json` configuration
   - Ensure all TypeScript files are valid

3. **Frontend build errors:**
   - Verify `pwa/.env.production` is properly configured
   - Check Vite configuration in `pwa/vite.config.ts`

### Runtime Issues

1. **Container won't start:**
   ```bash
   docker-compose logs app
   ```

2. **MongoDB connection failed:**
   - Verify `MONGO_URI` in `.env.production`
   - Ensure MongoDB is accessible from Docker container

3. **Frontend not loading:**
   - Check if `public` directory exists in container:
     ```bash
     docker exec -it vidyamrit-app ls -la /app/public
     ```
   - Verify NODE_ENV=production is set

4. **API requests failing:**
   - Check CORS configuration in `backend/.env.production`
   - Verify frontend is using correct `VITE_BACKEND_URL`

## Security Notes

- Never commit `.env.production` files to version control
- Keep `firebaseServiceAccountKey.json` secure
- Use environment variables for sensitive data
- Regularly update dependencies for security patches

## Updating the Application

1. Pull latest changes from repository
2. Rebuild the Docker image:
   ```bash
   docker build -t vidyamrit-app:latest .
   ```
3. Restart containers:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

## Monitoring

- View real-time logs: `docker-compose logs -f app`
- Check container status: `docker-compose ps`
- View resource usage: `docker stats vidyamrit-app`

## Backup

Important files to backup regularly:
- MongoDB database
- `backend/.env.production`
- `backend/firebaseServiceAccountKey.json`
- `backend/logs/` directory
