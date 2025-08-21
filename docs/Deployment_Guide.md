# ODIADEV Voice AI Assistant - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the ODIADEV Voice AI Assistant, a Nigerian-focused voice constitutional AI assistant with Text-to-Speech capabilities.

## System Architecture

### Components
1. **Frontend**: Static HTML/CSS/JavaScript with Vercel serverless functions
2. **TTS Backend**: Flask-based Nigerian voice synthesis service
3. **AI Integration**: Claude API for conversational AI
4. **Authentication**: API key-based access control

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript, Vercel
- **Backend**: Python Flask, gTTS, pyttsx3
- **AI**: Anthropic Claude API
- **Deployment**: Manus deployment platform

## Prerequisites

### Required Accounts
1. **Anthropic Account**: For Claude API access
2. **Deployment Platform**: Manus or similar
3. **Domain**: For production deployment (optional)

### Required API Keys
1. **Anthropic API Key**: `sk-ant-api03-...`
2. **TTS Service Key**: Custom generated key
3. **ODIADEV API Keys**: Generated for user access

## Deployment Steps

### Step 1: Prepare Environment

```bash
# Clone or extract the project files
mkdir odiadev-voice-assistant
cd odiadev-voice-assistant

# Create directory structure
mkdir -p frontend/{api,public}
mkdir -p tts-backend/src
```

### Step 2: Configure Frontend

1. **Place Frontend Files**:
   - `index.html` in `frontend/`
   - `app.js` in `frontend/public/`
   - `styles.css` in `frontend/public/`
   - API files in `frontend/api/`

2. **Configure Environment Variables**:
   ```bash
   # Create .env.production
   ANTHROPIC_API_KEY=your_anthropic_api_key
   TTS_SERVICE_URL=your_tts_backend_url
   TTS_SERVICE_KEY=your_tts_service_key
   VALID_API_KEYS=comma_separated_odiadev_keys
   ```

3. **Deploy Frontend**:
   ```bash
   cd frontend
   # Deploy to your platform
   vercel deploy --prod
   ```

### Step 3: Configure TTS Backend

1. **Prepare Backend Files**:
   ```bash
   cd tts-backend
   
   # Create virtual environment
   python3 -m venv venv
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

2. **Configure Environment**:
   ```bash
   # Create .env file
   TTS_SERVICE_KEY=your_secure_key
   ENABLE_LOGGING=true
   PORT=10000
   ```

3. **Deploy Backend**:
   ```bash
   # Ensure proper structure
   mkdir -p src
   mv app.py src/
   mv main.py src/
   
   # Deploy to your platform
   ```

### Step 4: Generate API Keys

```bash
# Run the key generator
node generate-keys.js

# Output will be:
# User 1: odiadev_dd33d8a0b47477b5169ed988943cf247
# User 2: odiadev_401072a625c891f1a6b01895ea55ae2a
# ...
```

### Step 5: Configure CORS

Update the TTS backend CORS settings to include your frontend domain:

```python
CORS(app, origins=[
    'https://your-frontend-domain.com',
    'https://gpt.odia.dev',
    'http://localhost:3000'  # For development
])
```

## Testing Procedures

### Local Testing

1. **Start TTS Backend**:
   ```bash
   cd tts-backend
   python3 app.py
   ```

2. **Test Health Endpoint**:
   ```bash
   curl http://localhost:10000/health
   ```

3. **Test TTS Synthesis**:
   ```bash
   curl -X POST http://localhost:10000/api/synthesize \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_key" \
     -d '{"text": "Hello from ODIADEV AI", "voice": "nigerian-english"}' \
     --output test.mp3
   ```

4. **Start Frontend**:
   ```bash
   cd frontend
   python3 -m http.server 3000
   ```

### Production Testing

1. **Test Deployed TTS Backend**:
   ```bash
   curl https://your-backend-url/health
   ```

2. **Test Frontend Integration**:
   - Navigate to deployed frontend URL
   - Enter valid API key
   - Test voice input/output functionality
   - Verify AI chat responses

### Voice Functionality Testing

1. **Voice Input Testing**:
   - Click voice button
   - Speak clearly into microphone
   - Verify speech recognition accuracy
   - Check transcript display

2. **Voice Output Testing**:
   - Send text message
   - Verify AI response generation
   - Check TTS audio playback
   - Test Nigerian accent quality

## Configuration Files

### Frontend Vercel Configuration (`vercel.json`)

```json
{
  "version": 2,
  "builds": [
    {"src": "index.html", "use": "@vercel/static"},
    {"src": "public/**", "use": "@vercel/static"},
    {"src": "api/**/*.js", "use": "@vercel/node"}
  ],
  "routes": [
    {"src": "/api/(.*)", "dest": "/api/$1"},
    {"src": "/public/(.*)", "dest": "/public/$1"},
    {"src": "/(.*)", "dest": "/index.html"}
  ],
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic-api-key",
    "TTS_SERVICE_URL": "@tts-service-url",
    "TTS_SERVICE_KEY": "@tts-service-key",
    "VALID_API_KEYS": "@valid-api-keys"
  }
}
```

### TTS Backend Requirements (`requirements.txt`)

```
Flask==2.3.3
flask-cors==4.0.0
flask-limiter==3.5.0
gunicorn==21.2.0
pyttsx3==2.90
gtts==2.4.0
python-dotenv==1.0.0
Werkzeug==2.3.7
```

## Security Considerations

### API Key Management
- Use environment variables for all sensitive keys
- Implement proper API key rotation
- Monitor API usage and implement rate limiting

### CORS Configuration
- Restrict CORS to specific domains in production
- Avoid wildcard origins in production
- Implement proper preflight handling

### Authentication
- Validate API keys on every request
- Implement request logging for security monitoring
- Use HTTPS for all production endpoints

## Troubleshooting

### Common Issues

1. **404 Errors on API Endpoints**:
   - Ensure Vercel serverless functions are properly configured
   - Check API route configuration in `vercel.json`
   - Verify environment variables are set

2. **CORS Errors**:
   - Update backend CORS settings with frontend domain
   - Check preflight request handling
   - Verify headers configuration

3. **TTS Audio Issues**:
   - Check TTS service authentication
   - Verify audio format compatibility
   - Test with different browsers

4. **Voice Recognition Problems**:
   - Ensure HTTPS for production (required for microphone access)
   - Check browser permissions
   - Test with different devices

### Debug Commands

```bash
# Check TTS backend logs
curl -s https://your-backend-url/health | jq .

# Test API key validation
curl -X POST https://your-frontend-url/api/health \
  -H "X-API-Key: your_test_key"

# Verify environment variables
echo $ANTHROPIC_API_KEY
echo $TTS_SERVICE_URL
```

## Performance Optimization

### Frontend Optimization
- Enable gzip compression
- Implement caching headers
- Optimize image assets
- Minify CSS and JavaScript

### Backend Optimization
- Implement response caching
- Use connection pooling
- Optimize audio generation
- Monitor memory usage

### Voice Processing
- Implement audio compression
- Cache frequently used phrases
- Optimize speech recognition settings
- Use appropriate audio formats

## Monitoring and Maintenance

### Health Checks
- Monitor TTS backend health endpoint
- Check frontend availability
- Verify API response times
- Monitor error rates

### Logging
- Enable comprehensive logging
- Monitor API usage patterns
- Track error frequencies
- Implement alerting

### Updates
- Regular dependency updates
- Security patch management
- Feature enhancement deployment
- Performance monitoring

## Support and Documentation

### User Guide
- API key acquisition process
- Voice input instructions
- Troubleshooting common issues
- Feature documentation

### Developer Resources
- API documentation
- Code examples
- Integration guides
- Best practices

This deployment guide ensures successful setup and operation of the ODIADEV Voice AI Assistant with proper Nigerian voice synthesis and AI integration capabilities.

