# Vercel Deployment Guide

Complete guide for deploying Ovotime to Vercel with Neon PostgreSQL database.

## 🎯 Quick Setup Overview

1. **Flowcore**: Set up Flowcore tenant and API key (REQUIRED)
2. **Database**: Set up Neon PostgreSQL (free tier) 
3. **Deploy**: Deploy to Vercel with environment variables
4. **Initialize**: Run database setup on first deployment
5. **Verify**: Test event-sourced functionality

## 🔄 Step 1: Set Up Flowcore (REQUIRED)

### Create Flowcore Account
1. Sign up at [flowcore.io](https://flowcore.io)
2. Create a tenant named "ovotime"
3. Generate API key for your application

### Install Flowcore CLI
```bash
npm install -g @flowcore/cli
flowcore login
```

### Create Resources
```bash
# Create data core and flow types
flowcore data-core apply -f flowcore.yaml

# Generate API key
flowcore auth new key --tenant ovotime ovotime-production-key
```

**⚠️ Critical:** Save your API key - you'll need it for `FLOWCORE_API_KEY`.

## 📊 Step 2: Set Up Neon Database

### Create Neon Project
1. Go to the Vercel dashboard → Storage tab (as shown in your screenshot)
2. Click "Create" next to **Neon** (Serverless Postgres)
3. Or go directly to [neon.tech](https://neon.tech) and sign up
4. Create a new project named "ovotime-production"

### Get Connection String
```bash
# Your Neon connection string will look like:
postgresql://username:password@hostname/database?sslmode=require

# Example:
postgresql://ovotime_user:abc123@ep-cool-name-123456.us-east-1.aws.neon.tech/ovotime_db?sslmode=require
```

### Free Tier Limits
- **Storage**: 512MB (sufficient for research data)
- **Compute**: 1 vCPU, shared
- **Connections**: Connection pooling included
- **Databases**: 1 database per project

## 🚀 Step 3: Deploy to Vercel

### Environment Variables
Set these in your Vercel project settings:

```env
# Database
DATABASE_URL=your-neon-connection-string-here

# Flowcore (REQUIRED for event sourcing)
FLOWCORE_TENANT=ovotime
FLOWCORE_API_KEY=your-flowcore-api-key
FLOWCORE_API_URL=https://webhook.api.flowcore.io

# Application
OVOTIME_API_KEY=your-secure-random-key
NODE_ENV=production
```

### Deployment Command
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from your project directory
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set environment variables when prompted
# - Choose production deployment
```

## 🔧 Step 4: Database Initialization

Your database will be automatically initialized on first request thanks to your existing `initializeDatabase()` function in `src/lib/startup.ts`.

### 🚨 **CRITICAL: Flowcore Configuration is REQUIRED**

**Ovotime implements TRUE EVENT SOURCING where Flowcore is MANDATORY.**

**⚠️ Application WILL NOT WORK without Flowcore because:**
- API routes ONLY publish events to Flowcore
- Transformers process events and write to database
- NO direct database writes from API routes
- All database state derives from events

**🏗️ Event-Sourced Architecture:**
1. **Commands** → API routes publish events to Flowcore
2. **Events** → Transformers process events and update database  
3. **Queries** → Read from database (read models)

**✅ You MUST configure Flowcore:**
```env
FLOWCORE_TENANT=ovotime
FLOWCORE_API_KEY=your-flowcore-api-key
FLOWCORE_API_URL=https://webhook.api.flowcore.io
```

**❌ Without Flowcore:** Application cannot save any data - events have nowhere to go and transformers won't run.

### Verify Database Setup
After deployment, visit your app's health endpoint:
```
https://your-app.vercel.app/api/health
```

This will trigger database initialization and show connection status.

### Manual Database Setup (if needed)
If you need to run database setup manually:

```bash
# Set your production DATABASE_URL locally
export DATABASE_URL="your-neon-connection-string"

# Run database initialization
npm run db:init

# Test connection
npm run db:test
```

## ✅ Step 5: Verification

### Test Core Functionality
1. **Home Page**: Visit your deployed app
2. **Sessions**: Create a new research session
3. **Measurements**: Add measurement data
4. **Predictions**: Verify TBH predictions work
5. **Database**: Check data persistence

### Check Health Status
```bash
# Application health
curl https://your-app.vercel.app/api/health

# Flowcore sync (if configured)
curl https://your-app.vercel.app/api/flowcore/sync
```

## 🔍 Monitoring & Troubleshooting

### Vercel Logs
```bash
# View deployment logs
vercel logs your-app-name

# Follow real-time logs
vercel logs your-app-name --follow
```

### Database Monitoring
- **Neon Console**: Monitor usage, connections, performance
- **Query Performance**: Check slow queries in Neon dashboard
- **Storage Usage**: Track growth toward 512MB limit

### Common Issues

1. **Connection Timeouts**
   - Neon auto-pauses after inactivity
   - First request may be slower (cold start)
   - Solution: Use connection pooling (already implemented)

2. **SSL Connection Errors**
   - Ensure `?sslmode=require` in connection string
   - Neon requires SSL connections

3. **Migration Issues**
   - Check Vercel function logs
   - Verify all environment variables are set
   - Ensure database URL format is correct

## 📈 Performance Optimization

### Connection Pooling
Your existing setup already uses optimal pooling:
```typescript
// Already configured in src/database/index.ts
export const pool = new Pool({
  connectionString,
  max: 10, // Good for serverless
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 30000,
})
```

### Serverless Best Practices
- **Cold Starts**: Database initialization only runs when needed
- **Connection Reuse**: Pool connections across function invocations
- **Error Handling**: Graceful degradation when services unavailable

## 🔄 CI/CD Integration

### Automatic Deployments
1. Connect your GitHub repository to Vercel
2. Enable automatic deployments for main branch
3. Environment variables persist across deployments

### Database Migrations
Your current schema uses `CREATE TABLE IF NOT EXISTS`, which is perfect for serverless deployments - no migration system needed.

## 🚨 Production Checklist

- [ ] Neon database created and accessible
- [ ] All environment variables configured in Vercel
- [ ] Database initializes successfully on first request
- [ ] Health endpoints return 200 status
- [ ] Core application features work end-to-end
- [ ] Monitoring and alerting configured
- [ ] Backup strategy documented (Neon handles automatic backups)

## 💰 Cost Management

### Free Tier Monitoring
- **Storage**: Monitor in Neon dashboard
- **Compute**: Auto-scales within free limits
- **Upgrade Path**: Paid plans start at $19/month if needed

### Optimization Tips
- Archive old research sessions to manage storage
- Use indexes efficiently (already implemented)
- Monitor query performance in Neon console

---

Your Ovotime research application is now ready for production use on Vercel with Neon PostgreSQL! 🎉 