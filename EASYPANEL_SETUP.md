# Easypanel Deployment - Quick Setup Guide

## Step-by-Step Instructions

### 1. Prerequisites
- [ ] MongoDB connection URI ready
- [ ] Firebase service account key file ready (`firebaseServiceAccountKey.json`)
- [ ] Email credentials (for notifications)
- [ ] Domain configured (optional but recommended)

### 2. Create New Service in Easypanel

1. Go to your Easypanel dashboard
2. Click "Create Service" → "App"
3. Select "GitHub Repository"
4. Authorize and select your Vidyamrit repository
5. Select branch: `main` (or your deployment branch)

### 3. Configure Build Settings

| Setting | Value |
|---------|-------|
| Build Method | `Dockerfile` |
| Dockerfile Path | `./Dockerfile` |
| Build Context | `.` |

### 4. Configure Runtime Settings

#### Port Configuration
- **Port**: `5001`

#### Environment Variables

Add these environment variables (click "Add Environment Variable"):

```env
NODE_ENV=production
PORT=5001
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/vidyamrit
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./firebaseServiceAccountKey.json
LOGGER_PATH=./logs
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
CORS_ORIGIN=https://your-domain.com
```

**Important Environment Variable Notes:**
- `MONGO_URI`: Use your actual MongoDB connection string
- `MAIL_USER` & `MAIL_PASS`: Gmail app password (not regular password)
- `CORS_ORIGIN`: Your production domain (will be auto-assigned by Easypanel if not using custom domain)

### 5. Configure Mounts

#### Mount 1: Logs Directory
- **Type**: Volume
- **Mount Path**: `/app/logs`
- **Volume Name**: `vidyamrit-logs`

#### Mount 2: Firebase Service Account Key
- **Type**: File
- **Mount Path**: `/app/firebaseServiceAccountKey.json`
- **Content**: Paste your entire `firebaseServiceAccountKey.json` content

**To get the Firebase key content:**
```bash
cat backend/firebaseServiceAccountKey.json
```

Then copy the entire JSON and paste into Easypanel.

### 6. Deploy

1. Click "Deploy" button
2. Wait for build to complete (typically 2-5 minutes)
3. Monitor build logs for any errors

### 7. Verify Deployment

Once deployed, Easypanel will provide you with a URL. Test these endpoints:

1. **Health Check:**
   ```bash
   curl https://your-app.easypanel.host/api/health
   ```
   Should return: `{"status":"ok"}`

2. **Frontend:**
   Visit `https://your-app.easypanel.host` in browser
   You should see the Vidyamrit landing page

3. **API:**
   ```bash
   curl https://your-app.easypanel.host/api/
   ```

### 8. Configure Custom Domain (Optional)

1. In Easypanel service settings, go to "Domains"
2. Add your custom domain (e.g., `vidyamrit.com`)
3. Update DNS records as instructed by Easypanel
4. Update `CORS_ORIGIN` environment variable to include your custom domain:
   ```
   CORS_ORIGIN=https://vidyamrit.com,https://www.vidyamrit.com
   ```
5. Redeploy the service

### 9. Common Issues & Solutions

#### Build Fails with "firebaseServiceAccountKey.json not found"
- ✅ **Solution**: This is expected. The key should NOT be in the Docker image
- Make sure you've added it as a File mount in step 5

#### Container starts but health check fails
- Check environment variables are correct
- Verify MongoDB connection string
- Check logs in Easypanel dashboard

#### Frontend loads but API calls fail
- Update `VITE_BACKEND_URL` in frontend `.env.production`
- Should be the same as your deployment URL
- Rebuild and redeploy

#### Cannot connect to MongoDB
- Whitelist Easypanel IP addresses in MongoDB Atlas
- Or use `0.0.0.0/0` (allow all) for testing
- Verify connection string includes username and password

### 10. Updating Your Deployment

When you push changes to your GitHub repository:

1. **Automatic Deployment** (if enabled):
   - Easypanel will automatically rebuild and deploy
   - Monitor the build logs

2. **Manual Deployment**:
   - Go to your service in Easypanel
   - Click "Rebuild" or "Redeploy"
   - Wait for build to complete

### 11. Monitoring

#### View Logs
1. Go to your service in Easypanel dashboard
2. Click "Logs" tab
3. Filter by "Application" or "Build" logs

#### View Metrics
1. Click "Metrics" tab
2. Monitor CPU, Memory, Network usage

#### Access Shell
1. Click "Shell" tab
2. Explore container filesystem
3. Useful commands:
   ```bash
   # Check if public directory exists (frontend build)
   ls -la /app/public

   # Check logs
   tail -f /app/logs/combined.log

   # Verify environment
   env | grep NODE_ENV
   ```

### 12. Backup Strategy

**Important files to backup:**
- Database: MongoDB should have automated backups
- Environment variables: Export from Easypanel
- Firebase key: Keep secure copy locally

**Easypanel automatic backups:**
- Logs volume: `vidyamrit-logs`
- Check Easypanel backup settings

### Support & Troubleshooting

If you encounter issues:

1. **Check build logs** in Easypanel for build-time errors
2. **Check application logs** for runtime errors
3. **Verify all environment variables** are set correctly
4. **Test locally** with Docker first:
   ```bash
   docker build -t vidyamrit-test .
   docker run -p 5001:5001 --env-file backend/.env.production vidyamrit-test
   ```

For more detailed information, see [DEPLOYMENT.md](./DEPLOYMENT.md)
