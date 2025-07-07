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

The core prediction uses species-specific quadratic formulas from Figure 1. These formulas give egg density as a function of days before hatching:

**Arctic Skua (*Stercorarius parasiticus*)**:
```
DE = -0.00007345×DBH² + 0.008618×DBH + 0.8719
```

**Great Skua (*Stercorarius skua*)**:
```
DE = -0.00010000×DBH² + 0.008442×DBH + 0.8843
```

To find DBH from the measured DE, we solve the quadratic equation using the quadratic formula:
```
DBH = (-b ± √(b² - 4a(c - DE))) / (2a)
```

Where:
- **DE** = Egg density (g/cm³) = mass / volume
- **Volume** = KV × length × breadth² (converted from mm³ to cm³)
- **KV** = Egg-shape constant (default: 0.507)
- **DBH** = Days Before Hatching
- **a, b, c** = Species-specific coefficients from the formulas above

## ✨ Features

- **🎯 Species-Specific Predictions**: Supports both Arctic and Great Skua species with dedicated formulas
- **📊 Real-time Calculations**: Instant DBH predictions as you input measurements
- **🗺️ Location Tracking**: Optional GPS coordinates and site name recording
- **📝 Research Notes**: Field for researcher observations and notes
- **📈 Confidence Scoring**: Reliability assessment for each prediction
- **🔄 Session Management**: Track multiple measurements in research sessions
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices
- **💾 Data Persistence**: PostgreSQL database with Drizzle ORM
- **🔄 Event Sourcing Architecture**: Built with Flowcore for true event-driven design
- **📝 Complete Audit Trail**: All data changes tracked through immutable events

## 🚀 Development Environment Setup

### Prerequisites

- **Node.js** 20+ and **npm**/**yarn**
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

# Flowcore Configuration (required for event sourcing)
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

**Event Sourcing Architecture**: OvoTime implements true event sourcing where Flowcore handles all data persistence. The application uses an event-driven architecture where:

- 🔄 API routes publish events to Flowcore (no direct database writes)
- 📊 Transformers process events and update PostgreSQL read models
- 📝 Complete audit trail of all data changes through events

**Note**: Flowcore is required for the application to function, as all database writes are handled through event processing.

Set up your Flowcore account:

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

Test the event-sourced application:

1. **Database**: Check that the app loads without database errors
2. **Flowcore**: Verify events are being published and processed
3. **Measurements**: Try submitting a measurement (events → transformers → database)
4. **Sessions**: Navigate to `/sessions` to view session management
5. **Health Check**: Visit `/api/health` to verify all services

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
echo $FLOWCORE_API_KEY

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
- **PostgreSQL** - Primary database with connection pooling
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
4. **Submit**: Get instant DBH prediction with confidence score
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

## 🧪 Testing

OvoTime includes a comprehensive test suite to ensure calculation accuracy and reliability for scientific research.

### Test Coverage

The application includes extensive testing for all calculation functions:

- **Unit Tests**: 370+ lines of tests covering all formula calculations
- **Formula Accuracy**: Validates quadratic equation solving for both species
- **Sample Data Validation**: Tests against realistic field measurements
- **Error Handling**: Comprehensive validation of edge cases and invalid inputs
- **Confidence Scoring**: Tests for prediction reliability algorithms

### Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode during development
yarn test:watch

# Run tests with coverage report
yarn test:coverage

# Test specific calculation functions
yarn test src/lib/calculations
```

### Test Data

The test suite includes sample data based on realistic Skua egg measurements:

```typescript
// Example test data for Arctic Skua
{
  length: 72.3,      // mm
  breadth: 50.2,     // mm  
  mass: 91.89,       // g
  kv: 0.507,         // standard constant
  expectedDensity: 0.9972 // g/cm³
}
```

### Formula Validation

Tests verify that:
- Calculated DBH values fall within expected ranges (0-35 days)
- Reverse calculations match original density values
- Both quadratic equation roots are handled correctly
- Species-specific formulas produce different results
- Confidence scores reflect measurement quality

### Scientific Accuracy

The test suite includes validation against peer-reviewed research:
- Formula coefficients match published research
- Calculation results are mathematically consistent
- Error handling prevents invalid scientific predictions
- Edge cases are properly identified and handled

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
    length: number    // mm (60-85 for Skua species)
    breadth: number   // mm (40-60 for Skua species)
    mass: number      // g (70-120 for Skua species)
    kv: number        // typically 0.507 for Skua species
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
  tbh: number           // Days Before Hatching (DBH)
  eggDensity: number    // g/cm³
  eggVolume: number     // cm³
  confidence: number    // 0-1 reliability score
  speciesType: 'arctic' | 'great'
      formula: {
      name: string        // Species-specific formula name
      version: string     // Formula version (2.1 for quadratic equation solving)
      coefficients: {     // Quadratic coefficients a, b, c
        a: number
        b: number
        c: number
      }
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

1. **Aldará, J., Hammer, S., Thorup, K., & Snell, K. R. S.** (2024). [Determining hatch dates for skuas: an egg density calibration curve](https://www.seabirdgroup.org.uk/journals/seabird-32/seabird-32-84.pdf). *Seabird*, 32, 84-95.
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
