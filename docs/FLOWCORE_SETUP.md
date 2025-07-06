# Flowcore Event Sourcing Setup Guide

⚠️ **CRITICAL**: Flowcore is MANDATORY for Ovotime. The application implements true event sourcing and cannot function without Flowcore.

This guide walks you through setting up Ovotime with Flowcore event sourcing for deployment on Vercel, following the [official Flowcore documentation](https://docs.flowcore.io/guides/5-minute-tutorial/5-min-tutorial/#understanding-flowcore-concepts).

## 🏗️ Architecture Overview

Ovotime implements **TRUE EVENT SOURCING** where Flowcore is the ONLY way data enters the system:

**🚨 Without Flowcore, the application CANNOT:**
- Save any measurements
- Create any sessions
- Generate any predictions
- Store any data whatsoever

**✅ Event Sourcing Architecture:**
1. **Event Store**: Flowcore stores all events as the single source of truth
2. **Read Models**: PostgreSQL database stores derived/projected data for queries  
3. **Event Sourcing**: All state changes are captured as events (NO direct database writes)
4. **CQRS**: Command Query Responsibility Segregation separates writes (events) from reads (projections)
5. **Pathways**: Uses @flowcore/pathways library for event handling and processing

**Data Flow:** Commands → Events (Flowcore) → Transformers → Database

## 📋 Prerequisites

- **Flowcore Account**: Sign up at [flowcore.io](https://flowcore.io)
- **Vercel Account**: For deployment
- **PostgreSQL Database**: For read models (see database options below)

## 🗄️ Database Options for Vercel

### Option 1: Vercel Postgres (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Create a new Postgres database
vercel postgres create ovotime-db

# Get connection string
vercel env pull .env.local
```

### Option 2: Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Add to environment variables

## 🔧 Environment Variables

Create a `.env.local` file in your project root:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@hostname:5432/database_name"

# Flowcore Configuration
FLOWCORE_TENANT="ovotime"
FLOWCORE_API_KEY="your-flowcore-api-key"
FLOWCORE_API_SECRET="your-flowcore-api-secret"
FLOWCORE_API_URL="https://api.flowcore.io"
FLOWCORE_TENANT_URL="https://ovotime.flowcore.io"

# Application Configuration
OVOTIME_API_KEY="your-secure-api-key-for-webhook-authentication"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret"

# Optional
NODE_ENV="production"
LOG_LEVEL="info"
```

## 🔐 Flowcore Setup

### 1. Install Flowcore CLI

```bash
# Install Flowcore CLI
npm install -g @flowcore/cli

# Login to Flowcore (opens browser)
flowcore login
```

### 2. Create API Key

Generate an API key for your application:

```bash
flowcore auth new key --tenant ovotime ovotime-app-key
```

Save this API key securely - you'll use it in `FLOWCORE_API_KEY`.

### 3. Create Data Core, Flow Types, and Event Types

Use Flowcore CLI to create your event architecture:

```bash
# Create data core
flowcore create data-core ovotime-research-data --description "Ovotime Research Data"

# Create flow types  
flowcore create flow-type measurements --data-core ovotime-research-data
flowcore create flow-type predictions --data-core ovotime-research-data
flowcore create flow-type sessions --data-core ovotime-research-data

# Create event types (examples)
flowcore create event-type measurement.submitted.v0 --flow-type measurements --schema measurement-schema.json
flowcore create event-type prediction.calculated.v0 --flow-type predictions --schema prediction-schema.json
# ... continue for all event types
```

### 4. Test Local Development

Use the `flowcore.yaml` for local development:

```bash
# Start local proxy (in separate terminal)
flowcore scenario local -f flowcore.local.development.yaml -s now -e http://localhost:3000/api/flowcore/transformer -H 'X-Secret: 1234'
```

## 🚀 Vercel Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Migration

```bash
# Run database migrations
npm run db:migrate

# Or with Drizzle
npx drizzle-kit push:pg
```

### 3. Deploy to Vercel

```bash
# Deploy to Vercel
vercel deploy

# Set environment variables
vercel env add DATABASE_URL
vercel env add FLOWCORE_TENANT
vercel env add FLOWCORE_API_KEY
vercel env add FLOWCORE_API_SECRET
vercel env add OVOTIME_API_KEY

# Deploy production
vercel deploy --prod
```

## 📊 Event Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │   Flowcore      │
│   (Next.js)     │───▶│   (Commands)    │───▶│   (Events)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Read Models   │◀───│   Transformers  │◀───│   Proxy         │
│   (PostgreSQL)  │    │   (Event→DB)    │    │   Transformer   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 Event Types

### Measurement Events

- `measurement-submitted`: Raw measurement data received
- `measurement-validated`: Measurement passed validation
- `measurement-rejected`: Measurement failed validation

### Prediction Events

- `prediction-requested`: Prediction calculation requested
- `prediction-calculated`: Prediction successfully calculated
- `prediction-failed`: Prediction calculation failed

### Session Events

- `session-started`: Research session began
- `session-measurement-added`: Measurement added to session
- `session-completed`: Research session completed
- `session-exported`: Session data exported

## 🔧 Local Development

### 1. Start PostgreSQL

```bash
# Using Docker
docker run --name ovotime-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Or use your preferred PostgreSQL setup
```

### 2. Run Migrations

```bash
npm run db:migrate
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Test Event Processing

```bash
# Test the transformer health endpoint
curl http://localhost:3000/api/flowcore/transformer

# Test measurement submission (triggers events)
curl -X POST http://localhost:3000/api/measurements \
  -H "Content-Type: application/json" \
  -d '{
    "measurements": {
      "length": 45.2,
      "breadth": 32.1,
      "mass": 28.5,
      "kv": 0.507
    },
    "speciesType": "arctic",
    "location": {
      "siteName": "Test Site"
    }
  }'
```

## 🧪 Testing Flowcore Integration

### 1. Verify Event Publishing

Check your Flowcore console to see if events are being published:

1. Go to your Flowcore dashboard
2. Navigate to Data Core → ovotime-research-data
3. Check event streams for incoming events

### 2. Test Transformer Webhook

```bash
# Test transformer endpoint directly
curl -X POST https://your-app.vercel.app/api/flowcore/transformer \
  -H "X-Secret: your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "measurements/measurement.submitted.v0",
    "eventId": "test-event-id",
    "payload": {
      "measurementId": "test-measurement-id",
      "speciesType": "arctic",
      "measurements": {
        "length": 45.2,
        "breadth": 32.1,
        "mass": 28.5,
        "kv": 0.507
      },
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }'
```

## 📈 Database Schema

The application uses the following tables for read models:

- `measurements`: Egg measurement data
- `predictions`: TBH prediction results
- `sessions`: Research session data
- `session_exports`: Export history
- `validation_errors`: Error tracking
- `event_log`: Event audit trail

## 🔍 Monitoring & Debugging

### 1. Check Event Processing

```bash
# Check event logs
vercel logs --app your-app-name

# Query event log table
SELECT * FROM event_log ORDER BY created_at DESC LIMIT 10;
```

### 2. Verify Database State

```bash
# Check measurements table
SELECT COUNT(*) FROM measurements;

# Check predictions table
SELECT COUNT(*) FROM predictions;
```

### 3. Monitor Flowcore Events

1. Use Flowcore console to monitor event streams
2. Check transformer execution logs
3. Verify event ordering and processing

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check firewall settings
   - Ensure database is accessible from Vercel

2. **Flowcore Authentication**
   - Verify API keys are correct
   - Check tenant name matches
   - Ensure proper permissions

3. **Event Processing Delays**
   - Check transformer retry policies
   - Verify webhook endpoint accessibility
   - Review event ordering

### Debug Commands

```bash
# Test database connection
npm run db:test

# Check pathways initialization
npm run pathways:init

# Verify environment variables
vercel env ls
```

## 🎯 Best Practices

1. **Event Sourcing**
   - Never modify events after they're stored
   - Use event versioning for schema changes
   - Implement proper event replay mechanisms

2. **Error Handling**
   - Always publish failure events
   - Implement retry logic for transient failures
   - Log all errors for debugging

3. **Performance**
   - Use appropriate database indexes
   - Implement proper pagination
   - Monitor event processing latency

4. **Security**
   - Rotate API keys regularly
   - Use HTTPS for all communications
   - Validate all incoming events

## 📚 Additional Resources

- [Flowcore Documentation](https://docs.flowcore.io)
- [Vercel Documentation](https://vercel.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Event Sourcing Patterns](https://martinfowler.com/eaaDev/EventSourcing.html)

## 🤝 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review Flowcore and Vercel logs
3. Verify environment variables
4. Test with curl commands provided above

For additional support, consult the respective documentation for Flowcore and Vercel. 