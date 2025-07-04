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

## 🚀 Quick Start for Developers

### Prerequisites

- **Node.js** 18+ and **npm**/**yarn**
- **PostgreSQL** database (local or remote)
- **Git** for version control

### Installation

```bash
# Clone the repository
git clone https://github.com/flowcore-io/ovotime.git
cd ovotime

# Install dependencies
yarn install
# or npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials
```

### Database Setup

```bash
# Generate database schema
yarn db:generate

# Run migrations
yarn db:migrate

# (Optional) Open Drizzle Studio to view database
yarn db:studio
```

### Development Server

```bash
# Start the development server
yarn dev

# Open http://localhost:3000 in your browser
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
