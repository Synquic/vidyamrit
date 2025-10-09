# 📚 Vidyamrit - Educational Assessment & Learning Management System

[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)](https://mongodb.com/)
[![Firebase](https://img.shields.io/badge/Auth-Firebase-orange)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-purple)](https://web.dev/progressive-web-apps/)

> A comprehensive Progressive Web Application (PWA) for educational institutions to conduct baseline assessments, manage student progress, and organize learning cohorts with adaptive testing algorithms.

## 🎯 Project Overview

**Vidyamrit** is an advanced educational management platform designed to revolutionize how schools conduct assessments and track student learning progress. The system implements sophisticated adaptive testing algorithms to accurately determine student knowledge levels across different subjects (Hindi, Mathematics, English) and automatically organizes students into appropriate learning cohorts.

### 🔑 Key Features

#### 🏫 **Multi-Role Management System**

- **Super Admin**: Full system control, manages schools and school administrators
- **School Admin**: Manages mentors, students, and cohorts within their institution
- **Mentor**: Conducts assessments and tracks student progress

#### 📊 **Adaptive Assessment Engine**

- **Intelligent Level Detection**: Advanced algorithms that adapt question difficulty based on student responses
- **Multi-Subject Support**: Comprehensive assessments for Hindi, Mathematics, and English
- **Real-time Progress Tracking**: Live assessment progress with detailed analytics
- **Automatic Cohort Assignment**: Students automatically placed in appropriate learning groups

#### 👥 **Student Management**

- **Comprehensive Profiles**: Complete student information including demographics, contact details, and academic history
- **Knowledge Level Tracking**: Historical assessment data with level progression
- **Cohort Participation**: Automatic and manual cohort assignment capabilities
- **Progress Analytics**: Detailed reports on student performance and growth

#### 🎓 **Cohort Management**

- **Automatic Creation**: System creates cohorts based on assessment results
- **Level-based Grouping**: Students grouped by knowledge levels for targeted learning
- **Flexible Management**: Add/remove students, track participation dates
- **Performance Monitoring**: Cohort-wide analytics and progress tracking

## 🏗️ Architecture Overview

### **Frontend (PWA)**

```
📱 Progressive Web App
├── ⚛️  React 19 with TypeScript
├── 🎨 Tailwind CSS + Radix UI Components
├── 🔥 Firebase Authentication
├── 🔄 React Query for State Management
├── 🌐 Multi-language Support (i18n)
├── 📱 PWA Features (Offline Support, Install Prompt)
└── 🚀 Vite Build System
```

### **Backend (API)**

```
🔧 Node.js + Express Server
├── 🗄️  MongoDB with Mongoose ODM
├── 🔐 Firebase Admin SDK Authentication
├── 📝 Winston Logging System
├── 🛡️  Role-based Access Control
├── ⚡ TypeScript for Type Safety
└── 🔄 RESTful API Architecture
```

## 🧠 Assessment Algorithm Features

### **Adaptive Testing Logic**

- **Smart Question Selection**: Dynamically adjusts question difficulty based on performance
- **Streak Detection**: Tracks correct/incorrect answer patterns
- **Level Stabilization**: Ensures accurate level determination through consistency checks
- **Oscillation Prevention**: Detects and handles level fluctuations for stable assessment
- **Performance Thresholds**: Configurable criteria for level advancement/regression

### **Multi-Level Assessment Structure**

#### **Hindi Assessment Levels**

1. **Level 1**: Akshar Recognition (अ, क, ग, म, न...)
2. **Level 2**: 2 Akshar Blending (रम, कब, नम...)
3. **Level 3**: 3-4 Akshar Words (कमल, पतंग, बकरी...)
4. **Level 4**: Sentence Reading without Matras
5. **Level 5**: Sentence Reading with Matras
6. **Level 6**: Paragraph Reading
7. **Level 7**: Story Reading
8. **Level 8**: Poetry Reading

#### **Mathematics Assessment Levels**

1. **Level 1**: Number Recognition (1-20)
2. **Level 2**: Basic Addition (Single digits)
3. **Level 3**: Subtraction Fundamentals
4. **Level 4**: Advanced Addition/Subtraction
5. **Level 5**: Multiplication Tables
6. **Level 6**: Division Operations
7. **Level 7**: Fractions and Decimals
8. **Level 8**: Advanced Problem Solving

## 🔐 Security & Authentication

### **Firebase Integration**

- **Secure Authentication**: Email/password with Firebase Auth
- **JWT Token Validation**: Server-side token verification
- **Role-based Access**: Fine-grained permissions system
- **Session Management**: Secure session handling with automatic refresh

### **Data Protection**

- **Input Validation**: Comprehensive request validation
- **Error Handling**: Centralized error management with logging
- **CORS Configuration**: Secure cross-origin request handling
- **Environment Variables**: Secure configuration management

## 📱 Progressive Web App Features

### **PWA Capabilities**

- **Offline Support**: Core functionality available without internet
- **Install Prompt**: Native app-like installation experience
- **Background Sync**: Automatic data synchronization when online
- **Push Notifications**: Assessment reminders and progress updates
- **Responsive Design**: Optimized for all device sizes

### **Performance Optimizations**

- **Code Splitting**: Lazy loading for optimal bundle sizes
- **Service Worker**: Caching strategies for faster load times
- **Image Optimization**: Automatic image compression and formats
- **Bundle Analysis**: Optimized asset delivery

## 🎨 User Interface Features

### **Modern Design System**

- **Radix UI Components**: Accessible, customizable components
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **Dark/Light Themes**: System preference detection and manual toggle
- **Responsive Layout**: Mobile-first design approach
- **Micro-interactions**: Smooth animations and transitions

### **Accessibility Features**

- **WCAG Compliance**: Meets accessibility standards
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels and semantics
- **High Contrast**: Support for visual accessibility needs

## 🔄 API Endpoints Overview

### **Authentication & Users**

```
POST   /api/users/register     - User registration
GET    /api/users/me          - Get current user profile
```

### **School Management**

```
GET    /api/schools           - List all schools
POST   /api/schools           - Create new school
PUT    /api/schools/:id       - Update school
DELETE /api/schools/:id       - Delete school
```

### **Student Management**

```
GET    /api/students          - List students (with filters)
POST   /api/students          - Create new student
GET    /api/students/:id      - Get student details
PUT    /api/students/:id      - Update student
DELETE /api/students/:id      - Delete student
GET    /api/students/:id/level - Get student level history
```

### **Assessment System**

```
GET    /api/assessments       - List all assessments
POST   /api/assessments       - Create new assessment
GET    /api/assessments/:id   - Get assessment details
```

### **Cohort Management**

```
GET    /api/cohorts           - List cohorts
POST   /api/cohorts           - Create cohort
PUT    /api/cohorts/:id       - Update cohort
POST   /api/cohorts/add-student - Add student to cohort
POST   /api/cohorts/add-to-default - Auto-assign to default cohort
```

### **Question Sets**

```
GET    /api/question-sets     - List question sets
POST   /api/question-sets     - Create question set
PUT    /api/question-sets/:id - Update question set
```

## 🚀 Getting Started

### **Prerequisites**

- Node.js 18+ and npm/yarn
- MongoDB instance (local or cloud)
- Firebase project with Authentication enabled

### **Backend Setup**

```bash
cd backend

# Install dependencies
npm install

# Environment configuration
cp .env.example .env
# Configure MongoDB URI, Firebase credentials, CORS origins

# Start development server
npm run dev

# Bootstrap super admin (first time only)
npm run bootstrapSuperAdmin
```

### **Frontend Setup**

```bash
cd pwa

# Install dependencies
npm install

# Environment configuration
cp .env.example .env
# Configure Firebase config, API URL

# Start development server
npm run dev

# Build for production
npm run build
```

### **Environment Variables**

#### **Backend (.env)**

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vidyamrit
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
FIREBASE_ADMIN_SDK_PATH=./firebaseServiceAccountKey.json
```

#### **Frontend (.env)**

```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

## 📊 Database Schema

### **Core Models**

#### **User Model**

- Role-based user system (Super Admin, School Admin, Mentor)
- Firebase UID integration
- School association
- Comprehensive profile information

#### **Student Model**

- Complete demographic information
- Guardian/contact details
- Knowledge level history with timestamps
- Cohort participation tracking
- Assessment performance analytics

#### **Assessment Model**

- Subject-specific assessments
- Level determination results
- Mentor assignment
- Timestamp and progress tracking

#### **School Model**

- Institution information
- Address and contact details
- Administrator associations

#### **Cohort Model**

- Level-based student groupings
- Mentor assignments
- Student participation tracking
- Performance analytics

## 📈 Assessment Flow

### **Complete Assessment Process**

1. **Student Selection**: Mentor selects student for assessment
2. **Subject Choice**: Choose from Hindi, Math, or English
3. **Adaptive Testing**:
   - System presents questions based on estimated level
   - Difficulty adjusts based on correct/incorrect responses
   - Advanced algorithms prevent oscillation
4. **Level Determination**: Final level calculated using multiple factors
5. **Result Storage**: Assessment results saved with timestamp
6. **Cohort Assignment**: Student automatically placed in appropriate cohort
7. **Progress Tracking**: Historical data updated for analytics

### **Algorithm Intelligence**

- **Streak Analysis**: Tracks consecutive correct/incorrect answers
- **Stability Verification**: Ensures consistent performance at each level
- **Oscillation Detection**: Prevents infinite level switching
- **Performance Weighting**: Recent performance weighted higher
- **Confidence Scoring**: Assessment accuracy confidence levels

## 🔧 Development Features

### **Code Quality**

- **TypeScript**: Full type safety across frontend and backend
- **ESLint**: Comprehensive linting rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality assurance

### **Testing Strategy**

- **Unit Tests**: Component and function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete user flow testing
- **Performance Tests**: Load and stress testing

### **Monitoring & Logging**

- **Winston Logging**: Comprehensive server-side logging
- **HTTP Request Logging**: Morgan middleware for request tracking
- **Error Tracking**: Centralized error handling and logging
- **Performance Monitoring**: Response time and throughput tracking

## 🌟 Key Innovations

### **Educational Technology**

- **Adaptive Learning**: Personalized assessment difficulty
- **Real-time Analytics**: Live progress tracking and insights
- **Automated Grouping**: AI-driven cohort formation
- **Multi-modal Assessment**: Support for various question types

### **Technical Innovations**

- **PWA Architecture**: Modern web app with native app features
- **Real-time Updates**: Live data synchronization
- **Offline Capability**: Core functionality without internet
- **Responsive Design**: Optimal experience across all devices

## 🏆 Impact & Benefits

### **For Educational Institutions**

- **Efficient Assessment**: Reduced time for level determination
- **Data-Driven Insights**: Comprehensive student analytics
- **Resource Optimization**: Better teacher-student matching
- **Progress Tracking**: Long-term learning outcome monitoring

### **For Educators**

- **Streamlined Workflow**: Intuitive assessment interface
- **Detailed Analytics**: Student performance insights
- **Automated Administration**: Reduced manual work
- **Professional Development**: Data-driven teaching strategies

### **For Students**

- **Personalized Learning**: Level-appropriate content delivery
- **Progress Visibility**: Clear learning trajectory
- **Engaging Experience**: Interactive assessment interface
- **Fair Evaluation**: Unbiased, algorithm-driven assessment

## 🔮 Future Roadmap

### **Planned Features**

- **AI-Powered Insights**: Machine learning for predictive analytics
- **Advanced Reporting**: Comprehensive dashboard with insights
- **Mobile Apps**: Native iOS and Android applications
- **Integration APIs**: Third-party learning management system integration
- **Advanced Analytics**: Predictive modeling for student outcomes
- **Gamification**: Achievement badges and progress rewards

### **Technical Enhancements**

- **Microservices**: Scalable architecture migration
- **Real-time Collaboration**: Live assessment collaboration
- **Advanced Security**: Enhanced data protection measures
- **Performance Optimization**: Further speed and efficiency improvements

## 👥 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and contribute to the project.

### **Development Process**

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request with detailed description

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support & Contact

- **Project Author**: [ashutosh7i](https://github.com/ashutosh7i)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: [Project Wiki](https://github.com/your-repo/wiki)

---

**Built with ❤️ for educational excellence by the Vidyamrit team**
