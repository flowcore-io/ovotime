# 🥚 OvoTime

**A Scientific Tool for Skua Egg Hatching Time Prediction**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-blue)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-Open%20Source-green)](#contributing)

OvoTime is a specialized scientific application designed to predict the hatching time of Arctic and Great Skua eggs based on morphometric measurements. Built on peer-reviewed research from the Faroe Islands, this tool provides field researchers with accurate predictions to support ornithological studies and conservation efforts.

## 🔬 Scientific Background

This application implements the mathematical models described in **"Seabird 32-84"** research, which studied Arctic (*Stercorarius parasiticus*) and Great Skua (*Stercorarius skua*) populations in the Faroe Islands. The predictive algorithm uses egg measurements to calculate Time Before Hatching (TBH) using established morphometric relationships.

### Formula Implementation

The core prediction formula calculates TBH using:
```
TBH = (-0.2412 + √(0.05818 + 0.3175(0.8746 - DE))) / -0.1588
```

Where:
- **DE** = Egg density (g/cm³) = mass / volume
- **Volume** = KV × length × breadth² (converted from mm³ to cm³)
- **KV** = Egg-shape constant (default: 0.507)

## ✨ Features

- **🎯 Species-Specific Predictions**: Supports both Arctic and Great Skua species
- **📊 Real-time Calculations**: Instant TBH predictions as you input measurements
- **🗺️ Location Tracking**: Optional GPS coordinates and site name recording
- **📝 Research Notes**: Field for researcher observations and notes
- **📈 Confidence Scoring**: Reliability assessment for each prediction
- **🔄 Session Management**: Track multiple measurements in research sessions
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices
- **💾 Data Persistence**: PostgreSQL database with Drizzle ORM
- **🔄 Event-Driven Architecture**: Built with Flowcore Pathways for scalability

## 🚀 Development Environment Setup

### Prerequisites

- **Node.js** 18+ and **npm**/**yarn**
- **Docker** and **Docker Compose** for local PostgreSQL
- **Git** for version control
- **Flowcore Account** (required for event sourcing architecture)

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/flowcore-io/ovotime.git
cd ovotime

# Install dependencies
yarn install
# or npm install
```

### 2. Environment Configuration

```bash
# Copy the environment example file
cp env.example .env.local

# Edit .env.local with your configuration
```

Update `.env.local` with your settings:

```env
# Database Configuration
DATABASE_URL=postgresql://ovotime:ovotime_dev@localhost:5432/ovotime

# Flowcore Configuration (optional)
FLOWCORE_TENANT=ovotime
FLOWCORE_API_KEY=your-flowcore-api-key-here
FLOWCORE_API_URL=https://webhook.api.flowcore.io

# Application Configuration
OVOTIME_API_KEY=your-secure-random-key-here
NODE_ENV=development
```

### 3. Database Setup with Docker

Start the local PostgreSQL database:

```bash
# Start PostgreSQL and Adminer (database UI)
docker-compose up -d

# Verify the database is running
docker-compose ps
```

This will start:
- **PostgreSQL** on port `5432`
- **Adminer** (database UI) on port `8080` at http://localhost:8080

#### Database Management

```bash
# Generate database schema
yarn db:generate

# Run migrations to set up tables
yarn db:migrate

# (Optional) Open Drizzle Studio to view database
yarn db:studio

# View database in Adminer
# Go to http://localhost:8080
# Server: postgres, Username: ovotime, Password: ovotime_dev, Database: ovotime
```

### 4. Flowcore Integration (Required)

Ovotime uses event sourcing architecture with Flowcore. Set up your Flowcore account:

1. **Create Flowcore Account**:
   - Sign up at [Flowcore.io](https://flowcore.io)
   - Create a new tenant (e.g., "ovotime")

2. **Install Flowcore CLI**:
   ```bash
   npm install -g @flowcore/cli
   
   # Login to Flowcore (uses port 3000)
   flowcore login
   ```

3. **Create Data Core and Resources**:
   ```bash
   # Create all data cores, flow types, and event types from configuration
   flowcore data-core apply -f flowcore.yaml
   ```

4. **Generate API Key**:
   ```bash
   # Generate an API key for your application
   flowcore auth new key --tenant ovotime ovotime-app-key
   
   # Copy the generated key to FLOWCORE_API_KEY in .env.local
   ```

### 5. Start Development Server

```bash
# Start the Next.js development server
yarn dev

# Open http://localhost:3000 in your browser
```

### 6. Verify Setup

Test the application:

1. **Database**: Check that the app loads without database errors
2. **Measurements**: Try submitting a measurement through the UI
3. **Sessions**: Navigate to `/sessions` to view session management
4. **Health Check**: Visit `/api/health` to verify all services

### Development Workflow

```bash
# Start database
yarn docker:up

# Run migrations (if needed)
yarn db:migrate

# Start development server
yarn dev

# In separate terminal, start Flowcore local proxy
yarn flowcore:dev

# Make changes and test
# Database UI: http://localhost:8080
# App: http://localhost:3000
# Health: http://localhost:3000/api/health
```

### 📋 Available Scripts

#### **Development Scripts:**
```bash
yarn dev                    # Start Next.js development server
yarn flowcore:dev           # Start Flowcore local proxy (current events)
yarn flowcore:dev:backlog   # Start Flowcore local proxy (with backlog)
yarn docker:up              # Start PostgreSQL database
yarn docker:down            # Stop PostgreSQL database
yarn docker:logs            # View database logs
```

#### **Flowcore Management:**
```bash
yarn flowcore:setup         # Apply data core configuration
yarn flowcore:validate      # Validate flowcore.yaml configuration
yarn flowcore:status        # List existing data cores
```

#### **Database Management:**
```bash
yarn db:generate            # Generate database schema
yarn db:migrate             # Run database migrations
yarn db:push               # Push schema changes
yarn db:studio             # Open Drizzle Studio
```

#### **Testing:**
```bash
yarn test                   # Run tests
yarn test:watch            # Run tests in watch mode
yarn test:coverage         # Run tests with coverage
```

### Troubleshooting

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
yarn docker:logs

# Restart database
yarn docker:down && yarn docker:up

# Check database status
yarn docker:logs postgres
```

#### Flowcore Issues
```bash
# Check Flowcore configuration
yarn flowcore:validate

# Verify API key is set
echo $OVOTIME_API_KEY

# Test if data core exists
yarn flowcore:status

# Check local proxy connection
yarn flowcore:dev
```

#### Environment Variables
```bash
# Check if all required variables are set
grep -E "^[A-Z_]+=" .env.local

# Verify database URL format
echo $DATABASE_URL
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.3.5** - React framework with App Router
- **React 19** - UI library with modern hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Recharts** - Data visualization for prediction charts

### Backend
- **Next.js API Routes** - Serverless backend functions
- **Drizzle ORM** - Type-safe database operations
- **PostgreSQL** - Primary database (via Neon)
- **Zod** - Runtime type validation

### Architecture
- **Flowcore Pathways** - Event-driven architecture
- **UUID/Short-UUID** - Unique identifier generation
- **Event Sourcing** - Measurement and prediction tracking

## 📖 Usage

### Basic Workflow

1. **Select Species**: Choose Arctic or Great Skua
2. **Enter Measurements**:
   - Length (mm)
   - Breadth (mm) 
   - Mass (g)
   - KV value (optional, defaults to 0.507)
3. **Add Location** (optional): GPS coordinates or site name
4. **Submit**: Get instant TBH prediction with confidence score
5. **Review**: Check prediction details and research notes

### API Endpoints

```typescript
POST /api/measurements
// Submit new measurement data

GET /api/sessions
// Retrieve session history

POST /api/predictions
// Request prediction calculations
```

## 🤝 Contributing

We welcome contributions from the scientific community and developers! This project aims to support field research and ornithological studies worldwide.

### How to Contribute

#### 🔬 For Researchers
- **Validate Formulas**: Review and suggest improvements to calculation accuracy
- **Species Data**: Contribute data for additional seabird species
- **Field Testing**: Use the tool in field studies and report findings
- **Documentation**: Improve scientific methodology documentation

#### 💻 For Developers
- **Bug Reports**: Submit issues with detailed reproduction steps
- **Feature Requests**: Suggest new functionality for field research
- **Code Contributions**: Submit pull requests with improvements
- **Testing**: Add unit tests and integration tests

### Development Process

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/your-username/ovotime.git

# 3. Create a feature branch
git checkout -b feature/your-feature-name

# 4. Make your changes and commit
git commit -m "feat: add your feature description"

# 5. Push to your fork and submit a pull request
git push origin feature/your-feature-name
```

### Code Standards

- **TypeScript**: All code must be properly typed
- **ESLint**: Follow the configured linting rules
- **Testing**: Add tests for new functionality
- **Documentation**: Update docs for API changes

### Scientific Contributions

When contributing scientific formulas or calculations:

1. **Provide References**: Include peer-reviewed sources
2. **Validation Data**: Supply test cases with expected results
3. **Species Specificity**: Clearly define applicable species and conditions
4. **Units & Precision**: Specify measurement units and expected precision

## 📊 Data Schema

### Measurement Input
```typescript
interface MeasurementData {
  speciesType: 'arctic' | 'great'
  measurements: {
    length: number    // mm (10-100)
    breadth: number   // mm (10-80)  
    mass: number      // g (1-200)
    kv: number        // 0.1-1.0, default 0.507
  }
  location?: {
    latitude?: number     // -90 to 90
    longitude?: number    // -180 to 180
    siteName?: string     // max 255 chars
  }
  researcherNotes?: string // max 1000 chars
}
```

### Prediction Output
```typescript
interface PredictionResult {
  tbh: number           // Time Before Hatching (days)
  eggDensity: number    // g/cm³
  eggVolume: number     // cm³
  confidence: number    // 0-1 reliability score
  speciesType: 'arctic' | 'great'
  formula: {
    name: string
    version: string
    coefficients: Record<string, number>
  }
}
```

## 🧪 Testing

```bash
# Run unit tests
yarn test

# Run integration tests
yarn test:integration

# Run all tests with coverage
yarn test:coverage

# Test specific calculation functions
yarn test src/lib/calculations
```

## 📚 Scientific References

1. **"Seabird 32-84"** - Primary research paper for formula development
2. **Faroe Islands Skua Studies** - Baseline data and validation research
3. **Arctic Skua (*Stercorarius parasiticus*)** - Species-specific research
4. **Great Skua (*Stercorarius skua*)** - Species-specific research

> **Note**: This tool is designed for research purposes. Field researchers should validate predictions against observed hatching times and contribute feedback to improve accuracy.

## 🌍 Community & Support

- **Research Community**: Join discussions about field methodology
- **Technical Support**: GitHub Issues for bugs and feature requests
- **Scientific Validation**: Collaborate on accuracy improvements
- **Documentation**: Help improve user guides and API docs

## 📄 License

This project is open source and available for research and educational use. Please see the contributing guidelines for more information about usage and distribution.

---

**Built with ❤️ for the ornithological research community**

*Supporting field research and conservation efforts worldwide through open-source scientific tools.*
