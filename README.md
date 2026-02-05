# FinBoard - Financial Dashboard

![FinBoard Dashboard](https://img.shields.io/badge/FinBoard-Financial%20Dashboard-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-blue)
![Firebase](https://img.shields.io/badge/Firebase-9-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

A comprehensive, customizable financial dashboard that aggregates real-time market data from multiple APIs into a single, intuitive interface. Built as a web development internship assignment to demonstrate full-stack development skills with modern technologies.

## 🌐 Live Demo

**https://finboard-psi-seven.vercel.app/**


## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation & Setup](#-installation--setup)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)
- [Component Details](#-component-details)
- [Data Flow](#-data-flow)
- [API Integration](#-api-integration)
- [State Management](#-state-management)
- [Authentication](#-authentication)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Future Enhancements](#-future-enhancements)
- [License](#-license)

## 🎯 Overview

FinBoard is a responsive web application that allows users to create personalized financial dashboards by adding widgets from various financial APIs. Users can track stocks and financial metrics in real-time, with drag-and-drop customization and secure API key management.

### Key Objectives
- Demonstrate full-stack development capabilities
- Showcase API integration skills
- Implement responsive UI/UX design
- Ensure data security and user privacy
- Provide real-time data visualization

## ✨ Features

### 🔐 Authentication & Security
- **Firebase Authentication**: Email/password signup and login
- **Protected Routes**: Automatic redirect to login for unauthorized access
- **API Key Vault**: Secure storage of user API keys in Firestore
- **User Session Management**: Persistent login state with context provider

### 📊 Dashboard Management
- **Responsive Grid Layout**: Drag-and-drop widget arrangement using react-grid-layout
- **Auto-save**: Layout changes automatically saved to Firestore
- **Real-time Sync**: Multiple device synchronization with live updates
- **Mobile Responsive**: Optimized for desktop, tablet, and mobile devices

### 🧩 Widget System
- **Multiple Widget Types**: Card, Chart, and Table views
- **API Providers**:
  - **Alpha Vantage**: Stock time series and historical data
  - **Finnhub**: Real-time stock quotes and financial data
  - **IndianAPI**: Indian stock market data with multiple widget types
- **Custom Widget Creation**: Wizard-based widget configuration
- **Widget Preview**: Live preview before adding to dashboard

### 🔧 Widget Wizard
- **Step-by-step Creation**: 3-step process for widget setup
- **API Endpoint Configuration**: Support for custom API endpoints
- **Data Mapping**: Visual JSON explorer for field mapping
- **Auto-detection**: Automatic provider detection and configuration
- **Provider-specific Forms**: Custom forms for different API providers

### 📱 User Interface
- **Sidebar Navigation**: Collapsible sidebar with user profile
- **Dark/Light Mode**: Toggle between themes using a theme toggle button in the top-right corner (via Tailwind CSS with CSS variables for seamless transitions)
- **Loading States**: Skeleton loaders and progress indicators
- **Error Handling**: Graceful error states with retry options
- **Toast Notifications**: User feedback for actions

### 🛠️ Developer Features
- **JSON Explorer**: Interactive exploration of API responses
- **API Response Debugging**: Console logging for troubleshooting
- **Type Safety**: Full TypeScript implementation
- **Modular Architecture**: Reusable components and utilities

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **React 18**: UI library with hooks
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Query (TanStack Query)**: Data fetching and caching
- **React Grid Layout**: Drag-and-drop grid system

### Backend & Services
- **Firebase Authentication**: User authentication
- **Firestore Database**: NoSQL database for user data
- **Vercel**: Deployment platform

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Lucide React**: Icon library

## 🏗️ Architecture

### High-Level Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client (Web)  │────▶│   Firebase      │────▶│ External APIs   │
│   Next.js/React │     │   Auth+Firestore│     │ (AlphaVantage,  │
└─────────────────┘     └─────────────────┘     │ Finnhub, etc.)  │
         │                                      └─────────────────┘
         ▼
┌─────────────────┐
│   State & Cache │
│   React Query   │
│   Context API   │
└─────────────────┘
```

### Data Flow
1. User authenticates via Firebase Auth
2. Dashboard loads user widgets from Firestore
3. Widgets fetch data from respective APIs using stored keys
4. Data is cached using React Query
5. UI updates with real-time data
6. Layout changes auto-save to Firestore

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Firebase account
- API keys from financial data providers

### Step-by-Step Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Piyushydv08/FinBoard.git
   cd finboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Get your Firebase configuration

4. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Optional: Pre-configured API keys for demo
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
   FINNHUB_API_KEY=your_finnhub_key
   INDIANAPI_API_KEY=your_indianapi_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open in browser**
   Navigate to `http://localhost:3000`

## ⚙️ Configuration

### Firebase Setup Details
1. **Authentication Setup**:
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable Email/Password provider
   - Set up authorized domains

2. **Firestore Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /apiKeys/{keyId} {
         allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
       }
     }
   }
   ```

### API Key Setup
| Provider | How to Get Key | Rate Limits | Free Tier |
|----------|---------------|-------------|-----------|
| Alpha Vantage | [alphavantage.co](https://www.alphavantage.co/support/#api-key) | 5 calls/min, 500/day | Yes |
| Finnhub | [finnhub.io](https://finnhub.io/register) | 60 calls/min | Yes |
| IndianAPI | [indianapi.in](https://indianapi.in) | Varies | Limited |

## 📁 Project Structure

```
finboard/
├── src/
│   ├── app/                          # Next.js 14 App Router
│   │   ├── (auth)/                   # Authentication group
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Login page
│   │   │   └── signup/
│   │   │       └── page.tsx          # Signup page
│   │   ├── dashboard/                # Dashboard group
│   │   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   │   ├── page.tsx              # Main dashboard page
│   │   │   └── settings/
│   │   │       └── page.tsx          # Settings page
│   │   └── page.tsx                  # Landing page
│   ├── components/                   # Reusable components
│   │   ├── widgets/                  # Widget components
│   │   │   ├── WidgetWizard.tsx      # Widget creation wizard
│   │   │   ├── WidgetRenderer.tsx    # Main widget renderer
│   │   │   ├── AlphaVantage/         # Alpha Vantage widgets
│   │   │   ├── Finnhub/              # Finnhub widgets
│   │   │   ├── IndianAPI/            # IndianAPI widgets
│   │   │   ├── JsonExplorer.tsx      # JSON data explorer
│   │   │   └── WidgetDeleteButton.tsx # Widget deletion
│   │   └── settings/
│   │       └── ApiKeyManager.tsx     # API key management
│   ├── context/                      # React Context providers
│   │   └── AuthContext.tsx           # Authentication context
│   ├── lib/                          # Utility libraries
│   │   ├── firebase.ts               # Firebase initialization
│   │   ├── api-utils.ts              # API request utilities
│   │   ├── utils.ts                  # General utilities
│   │   └── firestore/                # Firestore operations
│   │       ├── dashboard.ts          # Dashboard CRUD operations
│   │       └── apiKeys.ts            # API key CRUD operations
│   └── styles/                       # Global styles
│       └── globals.css               # Global CSS with Tailwind
├── public/                           # Static assets
├── .env.example                      # Environment variables template
├── tailwind.config.ts                # Tailwind configuration
├── next.config.js                    # Next.js configuration
├── package.json                      # Dependencies and scripts
└── README.md                         # This file
```

## 🧩 Component Details

### Core Components

#### 1. `WidgetWizard.tsx`
The widget creation wizard with three-step process:
- **Step 1**: API source selection and endpoint configuration
- **Step 2**: Data mapping using JSON explorer
- **Step 3**: Widget type and refresh interval configuration

**Key Features:**
- Provider-specific forms for Alpha Vantage, Finnhub, IndianAPI
- Live API response preview
- Interactive JSON explorer for data mapping
- Auto-suggestion for common API endpoints

#### 2. `WidgetRenderer.tsx`
Main component that renders widgets based on type and provider:
- Detects widget type from API endpoint or configuration
- Renders provider-specific widgets (AlphaVantageWidget, FinnhubWidget, etc.)
- Handles loading, error, and data states
- Manages API key retrieval and request building

#### 3. `IndianAPIWidget.tsx`
Comprehensive widget for Indian stock data with 8 view types:
- **Price Card**: Current price with BSE/NSE comparison
- **Financial Metrics**: Revenue, profit margins, EPS
- **Technical Chart**: Price trends across time periods
- **Peer Comparison**: Industry peer analysis
- **Company Profile**: Company details and management
- **News Feed**: Latest company news
- **Risk Meter**: Investment risk assessment
- **Shareholding Pattern**: Ownership distribution

#### 4. `IndianAPIWidgetPreview.tsx`
Preview interface for IndianAPI widgets with:
- Widget selector grid
- Live preview of selected widget
- Batch widget addition
- Company name extraction from API endpoint

#### 5. `IndianAPIWidgetSelector.tsx`
Visual widget selector for IndianAPI with:
- Grid layout of widget options
- Recommended widgets highlighting
- Selection summary
- Provider-specific icons

### Utility Components

#### `JsonExplorer.tsx`
Interactive JSON data explorer with:
- Collapsible tree view
- Path selection for data mapping
- Visual indication of selected paths
- Support for arrays and nested objects

#### `WidgetDeleteButton.tsx`
Confirmation dialog for widget deletion with:
- Double confirmation for destructive action
- Widget title display in confirmation
- Smooth animation transitions

## 🔄 Data Flow

### 1. User Authentication Flow
```
User → Login/Signup → Firebase Auth → Auth Context → Protected Route
```

### 2. Dashboard Loading Flow
```
User Access → Load User Data → Parse Widgets → Render Widgets → Fetch API Data
```

### 3. Widget Creation Flow
```
Start Wizard → Select API → Configure → Map Data → Preview → Save → Add to Dashboard
```

### 4. Data Fetching Flow
```
Widget Render → Get API Key → Build Request → Fetch API → Cache Data → Update UI
```

## 🔌 API Integration

### API Request Building (`lib/api-utils.ts`)

The `buildRequest` function handles provider-specific request configuration:

```typescript
// Example: Building a Finnhub request
const { url, headers } = buildRequest(
  "https://finnhub.io/api/v1/quote?symbol=AAPL",
  { provider: "Finnhub", key: "your_token" }
);
// Result: URL with token parameter, no Content-Type header to avoid CORS
```

### Provider-Specific Handling

| Provider | Key Location | Headers | CORS Handling |
|----------|-------------|---------|---------------|
| Finnhub | Query parameter | No Content-Type | Avoids preflight |
| Alpha Vantage | Query parameter | No Content-Type | Avoids preflight |
| IndianAPI | X-Api-Key header | Content-Type: application/json | Standard CORS |

### Error Handling Strategy

1. **Network Errors**: Retry with exponential backoff
2. **API Limits**: Rate limit detection and user notification
3. **Invalid Responses**: Fallback to cached data or placeholder
4. **Authentication Errors**: Redirect to login or key configuration

## 🗄️ State Management

### React Query for Server State
- **Queries**: API data fetching with caching
- **Mutations**: Data updates (save dashboard, add widget)
- **Optimistic Updates**: Immediate UI feedback
- **Auto-refetch**: Background data updates

### Context API for Global State
- **AuthContext**: User authentication state
- **ThemeContext**: UI theme preferences (planned)

### Local State Management
- **useState**: Component-level state
- **useReducer**: Complex state logic (if needed)
- **URL State**: Route parameters for sharing

## 🔐 Authentication

### Firebase Authentication Implementation

```typescript
// AuthContext.tsx - Key functions
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  // Login function
  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    setUser(result.user);
  };
  
  // Protected route wrapper
  return (
    <AuthContext.Provider value={{ user, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Protected Routes
```typescript
// ProtectedRoute.tsx
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return redirect('/login');
  
  return children;
}
```

## 🗃️ Database Schema

### Firestore Collections

#### 1. `users/{userId}`
```typescript
interface UserDocument {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  dashboard: DashboardConfig;
}

interface DashboardConfig {
  widgets: WidgetConfig[];
  layout: GridLayout[];
}
```

#### 2. `apiKeys/{keyId}`
```typescript
interface ApiKeyDocument {
  id: string;
  userId: string;
  provider: 'Alpha Vantage' | 'Finnhub' | 'IndianAPI' | 'Other';
  label: string;
  key: string; // Encrypted in production
  createdAt: Timestamp;
  lastUsed?: Timestamp;
}
```

### Widget Configuration Schema
```typescript
interface WidgetConfig {
  id: string; // UUID
  title: string;
  type: 'card' | 'chart' | 'table';
  apiEndpoint: string;
  selectedApiKeyId?: string;
  refreshInterval: number; // seconds
  dataMapping: Record<string, string>;
}
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**
   - Push code to GitHub/GitLab
   - Import project in Vercel dashboard

2. **Configure Environment Variables**
   - Add all `.env.local` variables in Vercel project settings
   - Set production Firebase credentials

3. **Deploy Settings**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "installCommand": "npm install"
   }
   ```

4. **Custom Domain** (Optional)
   - Configure in Vercel project settings
   - Update DNS records with domain provider

### Firebase Hosting Alternative

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase**
   ```bash
   firebase init hosting
   ```

3. **Build and Deploy**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## 🧪 Testing

### Test Categories

1. **Unit Tests** (Jest + React Testing Library)
   - Component rendering
   - Utility functions
   - State management

2. **Integration Tests**
   - Widget creation flow
   - API key management
   - Dashboard interactions

3. **End-to-End Tests** (Cypress)
   - User authentication
   - Widget addition and removal
   - Layout persistence

### Running Tests
```bash
# Unit tests
npm test

# E2E tests
npm run cypress:open

# Test coverage
npm run test:coverage
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. CORS Errors with Finnhub/Alpha Vantage
**Problem**: Preflight request fails due to Content-Type header
**Solution**: Use `buildRequest` utility which removes Content-Type for GET requests

#### 2. Firebase Authentication Errors
**Problem**: "auth/network-request-failed"
**Solution**: 
- Check Firebase project configuration
- Verify authorized domains in Firebase console
- Ensure internet connectivity

#### 3. API Rate Limiting
**Problem**: API returns 429 Too Many Requests
**Solution**:
- Implement request throttling
- Cache API responses
- Upgrade API plan or use multiple keys

#### 4. Widget Layout Issues
**Problem**: Widgets overlap or don't save position
**Solution**:
- Clear localStorage and refresh
- Check Firestore rules for write permissions
- Verify react-grid-layout configuration

#### 5. IndianAPI Widgets Not Rendering Correctly
**Problem**: All widgets show same data
**Solution**:
- Ensure `widgetType` is passed from dataMapping
- Check widget configuration in Firestore
- Verify API key has necessary permissions

### Debug Mode
Enable debug logging by setting in `.env.local`:
```env
NEXT_PUBLIC_DEBUG=true
```

## 🚀 Future Enhancements

### Short-term Goals
1. **Export/Import Dashboard**: Share dashboard configurations
2. **Widget Templates**: Pre-configured widget templates
3. **Advanced Charts**: More chart types and indicators
4. **Notifications**: Price alerts and threshold notifications

### Medium-term Goals
1. **Multi-user Dashboards**: Team collaboration features
2. **Advanced Analytics**: Technical indicators and analysis
3. **Mobile App**: React Native mobile application
4. **WebSocket Support**: Real-time data streams

### Long-term Vision
1. **AI-powered Insights**: Predictive analytics
2. **Portfolio Integration**: Connect to brokerage accounts
3. **Marketplace**: Share and sell widget configurations
4. **Enterprise Features**: Role-based access, audit logs

## 📝 License

MIT License

Copyright (c) 2024 FinBoard

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **Firebase Team** for backend services
- **API Providers** for financial data
- **Open Source Community** for libraries and tools

## 📞 Contact & Support

For issues, questions, or contributions:
- **GitHub Issues**: [Create an issue](https://github.com/Piyushydv08/FinBoard/issues)
- **Email**: piyushydv011@gmail.com
---

**Built with ❤️ for the web development internship assignment**

*This project demonstrates proficiency in: Full-stack development, API integration, UI/UX design, State management, Authentication systems, Database design, and Deployment strategies.*