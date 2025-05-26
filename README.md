# FRY Diagnosis Tool - Frontend Application

A comprehensive React/Vite frontend for the FRY Sight Words Diagnosis Tool, providing advanced speech recognition, real-time teacher-student interactions, and comprehensive assessment capabilities for educational environments.

## 🌟 Features

### 📚 Educational Capabilities

- **Speech Recognition Testing** - Advanced pronunciation assessment with confidence scoring
- **Real-time Teacher Monitoring** - Live dashboard for tracking student practice sessions
- **Interactive Testing Rooms** - Socket.IO-powered teacher-student communication
- **QR Code Authentication** - Streamlined student login system
- **Comprehensive Assessment** - Multiple test types (recognition, pronunciation, reading, spelling)
- **Adaptive Learning** - AI-driven word difficulty adjustment based on student performance
- **Progress Tracking** - Detailed analytics and performance visualization

### 🎤 Speech Recognition System

- **Browser Speech API Integration** - Chrome/Edge optimized speech recognition
- **Fuzzy Word Matching** - Advanced similarity algorithms for pronunciation assessment
- **Confidence Scoring** - Real-time speech recognition confidence metrics
- **Pronunciation Feedback** - Immediate audio feedback and correction guidance
- **Response Time Tracking** - Performance metrics for reading fluency assessment

### 👩‍🏫 Teacher Dashboard

- **Live Student Monitoring** - Real-time view of active practice sessions
- **Session Management** - Start/stop testing sessions with individual students
- **Performance Analytics** - Comprehensive progress tracking and reporting
- **Word Level Management** - FRY sight word level progression tracking
- **Assessment History** - Detailed historical performance data

### 👨‍🎓 Student Interface

- **Practice Mode** - Self-paced learning with immediate feedback
- **Testing Interface** - Structured assessments with teacher guidance
- **Voice Settings** - Customizable speech synthesis options
- **Progress Visualization** - Personal achievement tracking and goal setting

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern web browser (Chrome/Edge recommended for speech features)
- Backend API server running (see backend README)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd fry-diagnosis-tool/fry-dt-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Configuration

Create environment files for different deployment stages:

**`.env.development`**

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
VITE_PORT=3003
VITE_REACT_APP_ENCRYPTKEY=your-encryption-key
```

**`.env.production`**

```env
VITE_API_URL=https://your-api-domain.com
VITE_SOCKET_URL=https://your-api-domain.com
VITE_PORT=3000
VITE_REACT_APP_ENCRYPTKEY=your-production-encryption-key
```

## 🏗️ Architecture

### Technology Stack

- **React 18** - Modern React with hooks and functional components
- **Vite** - Fast build tool with HMR and optimized bundling
- **Socket.IO Client** - Real-time bidirectional communication
- **React Router** - SPA routing and navigation
- **Web Speech API** - Browser-native speech recognition and synthesis
- **CryptoJS** - Client-side encryption for QR code authentication

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Chat/           # Real-time chat functionality
│   ├── FlashCard/      # Word display and practice cards
│   ├── QrCodeReader/   # QR code authentication
│   ├── StudentPractice/ # Student self-practice interface
│   ├── StudentTesting/ # Structured testing interface
│   ├── TeacherDashboard/ # Teacher monitoring and control
│   ├── TeacherTesting/ # Teacher testing management
│   ├── VoiceSettings/  # Speech synthesis configuration
│   └── ...
├── contexts/           # React context providers
│   ├── AuthContext.jsx # Authentication state management
│   └── PerformanceContext.jsx # Performance tracking
├── hooks/              # Custom React hooks
│   ├── useSpeechRecognition.js # Speech-to-text functionality
│   ├── useSpeechSynthesis.js # Text-to-speech functionality
│   └── useSocket.js    # Socket.IO connection management
├── pages/              # Main application pages
│   ├── auth/          # Authentication pages
│   ├── Landing/       # Home page
│   ├── Profile/       # User profile management
│   └── Study/         # Study mode interface
├── services/           # API and business logic
│   ├── apiService.js  # HTTP API communication
│   ├── authService.js # Authentication services
│   ├── fryWordService.js # FRY word list management
│   └── profileService.js # User profile operations
└── assets/            # Static resources
    ├── FryWordList.json # Complete FRY sight word database
    └── images/         # UI assets and icons
```

## 🎯 Core Components

### Speech Recognition System

**`useSpeechRecognition` Hook**

- Browser Speech API integration
- Real-time transcript processing
- Confidence scoring and word matching
- Response time measurement
- Cross-browser compatibility detection

```javascript
const {
  isListening,
  transcript,
  confidence,
  startListening,
  stopListening,
  checkWordMatch,
  browserSupport
} = useSpeechRecognition({
  continuous: false,
  interimResults: true,
  lang: 'en-US'
})
```

### Real-time Communication

**Socket.IO Integration**

- Teacher-student session management
- Live progress monitoring
- Real-time word delivery and response collection
- Session state synchronization

```javascript
// Join testing room
socket.emit('join_room', {
  username: user.name,
  room: roomCode,
  user: user
})

// Listen for test words
socket.on('test_word_received', (data) => {
  setCurrentWord(data.word)
  setTestType(data.testType)
})
```

### Authentication & Security

**QR Code Authentication**

- Encrypted student credentials
- Streamlined classroom login
- Secure token-based session management

```javascript
// Generate encrypted QR code
const qrValue = [
  CryptoJS.AES.encrypt(JSON.stringify(student.name), encryptKey).toString(),
  CryptoJS.AES.encrypt(JSON.stringify(password), encryptKey).toString()
].join(',')
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with HMR
npm run build            # Production build
npm run build:staging    # Staging environment build
npm run build:analyze    # Build with bundle analysis
npm run preview          # Preview production build

# Testing
npm run test             # Run unit tests with Vitest
npm run test:ui          # Interactive test UI
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # ESLint code checking
npm run lint:check       # Check without fixing
npm run optimize         # Run build optimizations
```

### Build Optimization

The application includes advanced build optimizations:

- **Code Splitting** - Automatic vendor and feature-based chunking
- **Tree Shaking** - Dead code elimination
- **Asset Optimization** - Image compression and efficient caching
- **Bundle Analysis** - Size analysis and optimization recommendations

```javascript
// Vite configuration highlights
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          socket: ['socket.io-client'],
          speech: ['react-speech-kit']
        }
      }
    }
  }
})
```

## 🎮 Usage Guide

### For Teachers

1. **Setup Testing Session**

   - Log in with teacher credentials
   - Navigate to Teacher Dashboard
   - Create or join a testing room
   - Select students and word levels

2. **Monitor Student Progress**

   - View real-time speech recognition sessions
   - Track pronunciation confidence scores
   - Observe response times and accuracy
   - Provide immediate feedback

3. **Manage Assessments**
   - Start/stop individual or group tests
   - Send specific words for pronunciation
   - Review detailed performance analytics
   - Export progress reports

### For Students

1. **Join Session**

   - Scan QR code or manual login
   - Wait for teacher to start session
   - Ensure microphone permissions are granted

2. **Practice Mode**

   - Select appropriate word level
   - Practice pronunciation with immediate feedback
   - Track personal progress and achievements
   - Use adaptive difficulty settings

3. **Testing Mode**
   - Wait for words from teacher
   - Speak clearly into microphone
   - Receive real-time feedback
   - Complete assessment sequences

## 📱 Browser Compatibility

### Recommended Browsers

- **Chrome 88+** - Full speech recognition support
- **Edge 88+** - Complete feature compatibility
- **Safari 15+** - Limited speech recognition
- **Firefox** - Basic functionality (no speech recognition)

### Speech Recognition Support

```javascript
// Browser detection
const browserSupport = {
  hasWebkitSpeechRecognition: !!window.webkitSpeechRecognition,
  hasSpeechRecognition: !!window.SpeechRecognition,
  supported: !!(window.webkitSpeechRecognition || window.SpeechRecognition)
}
```

## 🚀 Deployment

### Production Build

```bash
# Create optimized production build
npm run build:production

# Preview production build locally
npm run preview

# Serve static files
npm run serve
```

### Docker Deployment

```dockerfile
# Multi-stage build for optimized container
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment Variables

| Variable                    | Description             | Default                 |
| --------------------------- | ----------------------- | ----------------------- |
| `VITE_API_URL`              | Backend API endpoint    | `http://localhost:3000` |
| `VITE_SOCKET_URL`           | Socket.IO server URL    | `http://localhost:3000` |
| `VITE_PORT`                 | Development server port | `3003`                  |
| `VITE_REACT_APP_ENCRYPTKEY` | QR code encryption key  | Required                |

## 🔒 Security Features

### Client-Side Security

- **Encrypted QR Codes** - AES encryption for student authentication
- **JWT Token Management** - Secure session handling
- **Input Validation** - Client-side data sanitization
- **CSRF Protection** - Cross-site request forgery prevention

### Privacy Considerations

- **Microphone Permissions** - Explicit user consent required
- **Local Storage Management** - Secure token storage practices
- **Speech Data Handling** - No audio data persistence
- **Student Data Protection** - COPPA/FERPA compliance considerations

## 📊 Performance Features

### Real-time Monitoring

- **Speech Recognition Metrics** - Confidence scores and response times
- **Session Analytics** - Live participant tracking
- **Performance Alerts** - Automatic issue detection
- **Resource Monitoring** - Memory and CPU usage tracking

### Optimization Features

- **Lazy Loading** - Component-based code splitting
- **Memoization** - React performance optimizations
- **Virtual Scrolling** - Efficient large list rendering
- **Image Optimization** - Compressed assets and WebP support

## 🧪 Testing

### Test Coverage

- **Unit Tests** - Component and hook testing with Vitest
- **Integration Tests** - API service and Socket.IO testing
- **Speech Recognition Tests** - Mock browser API testing
- **Accessibility Tests** - WCAG compliance verification

```bash
# Run comprehensive test suite
npm run test:coverage

# Interactive testing interface
npm run test:ui
```

## 🔧 Troubleshooting

### Common Issues

**Speech Recognition Not Working**

- Ensure Chrome or Edge browser
- Check microphone permissions
- Verify HTTPS in production
- Test browser speech API support

**Socket Connection Failures**

- Verify backend server is running
- Check CORS configuration
- Confirm Socket.IO server settings
- Test network connectivity

**QR Code Authentication Issues**

- Verify encryption key configuration
- Check camera permissions
- Ensure QR code is readable
- Test with different lighting conditions

### Performance Issues

- Check browser developer tools
- Monitor memory usage
- Verify network latency
- Review console error messages

### Debug Mode

```javascript
// Enable debug logging
localStorage.setItem('debug', 'socket.io-client:*')

// Performance monitoring
localStorage.setItem('performanceMonitoring', 'true')
```

## 📚 API Integration

### Backend Communication

The frontend integrates with the backend API for:

- User authentication and authorization
- Student profile management
- Assessment data storage and retrieval
- Progress tracking and analytics
- Real-time session coordination

### Service Layer

```javascript
// Example API service usage
import * as profileService from './services/profileService'

// Get student progress
const progress = await profileService.getStudentProgress(studentId)

// Submit assessment
await profileService.addAssessment(profileId, assessmentData)

// Monitor speech sessions
const sessions = await profileService.getActiveSpeechSessions(teacherId)
```

## 🤝 Contributing

### Development Guidelines

- Follow React best practices and hooks patterns
- Use TypeScript for new components when possible
- Implement comprehensive error handling
- Add unit tests for new functionality
- Follow accessibility guidelines (WCAG 2.1)

### Code Style

- ESLint configuration for consistent formatting
- Prettier integration for code formatting
- Component naming conventions
- Structured CSS modules organization

## 📖 Additional Resources

### Documentation

- [Backend API Documentation](../fry-dt-backend/README.md)
- [Deployment Guide](../FINAL-DEPLOYMENT-GUIDE.md)
- [Speech Recognition Guide](../TEACHER-SPEECH-RECOGNITION-GUIDE.md)
- [Project Completion Summary](../PROJECT-COMPLETION-SUMMARY.md)

### Educational Resources

- [FRY Sight Words Information](https://www.readingrockets.org/article/fry-sight-words)
- [Web Speech API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [React Best Practices](https://react.dev/learn)

## 📞 Support

For technical support, deployment assistance, or feature requests:

- **Documentation**: Review comprehensive guides in the project root
- **Issues**: Check troubleshooting section and common solutions
- **Performance**: Monitor real-time metrics and performance alerts
- **Security**: Follow security best practices and guidelines

---

**Version**: 1.0.0  
**Last Updated**: May 2025  
**License**: Educational Use  
**Author**: Jan Horak

This frontend application represents a complete educational technology solution for FRY sight word assessment, combining modern web technologies with advanced speech recognition capabilities to create an engaging and effective learning environment for students and teachers.
