// api/tts.js - TTS with authentication fallback
const { validKey, getKey } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate user API key
  const userApiKey = getKey(req);
  const validKeys = process.env.VALID_API_KEYS || '';
  
  if (!validKey(validKeys, userApiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  try {
    const { text, voice = 'nigerian-english', speed = 1.0 } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 1000) {
      return res.status(400).json({ error: 'Text too long (max 1000 characters)' });
    }

    // Get backend service details
    const ttsServiceUrl = process.env.TTS_SERVICE_URL;
    
    if (!ttsServiceUrl) {
      return res.status(503).json({ 
        error: 'TTS service not configured',
        fallback: true 
      });
    }

    // Map voice names to your service format
    let serviceVoice = 'female'; // default
    if (voice.includes('male') || voice.includes('man')) {
      serviceVoice = 'male';
    } else if (voice.includes('female') || voice.includes('woman') || voice.includes('nigerian')) {
      serviceVoice = 'female';
    }

    // URL encode the text
    const encodedText = encodeURIComponent(text);
    const encodedVoice = encodeURIComponent(serviceVoice);

    // Build the correct URL with parameters
    const ttsUrl = `${ttsServiceUrl}/speak?text=${encodedText}&voice=${encodedVoice}`;

    console.log(`Calling TTS service: ${ttsUrl}`);

    // Try multiple authentication methods
    const authMethods = [
      // Method 1: User API key
      { 'x-api-key': userApiKey },
      // Method 2: Service key
      { 'x-api-key': process.env.TTS_SERVICE_KEY },
      // Method 3: No auth
      {},
      // Method 4: Bearer token
      { 'Authorization': `Bearer ${userApiKey}` },
      // Method 5: Different header name
      { 'api-key': userApiKey }
    ];

    let audioBuffer = null;
    let successMethod = null;

    for (const [index, headers] of authMethods.entries()) {
      try {
        console.log(`Trying auth method ${index + 1}:`, Object.keys(headers));
        
        const response = await fetch(ttsUrl, {
          method: 'GET',
          headers: headers
        });

        console.log(`Auth method ${index + 1} response: ${response.status}`);

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          
          // Check if it's actually audio (not JSON error)
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            if (buffer && buffer.byteLength > 100) { // Audio files are usually larger than 100 bytes
              audioBuffer = buffer;
              successMethod = index + 1;
              console.log(`SUCCESS with auth method ${index + 1}: ${buffer.byteLength} bytes`);
              break;
            }
          }
        }
        
      } catch (error) {
        console.log(`Auth method ${index + 1} error:`, error.message);
      }
    }

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      console.error('All authentication methods failed');
      
      // Fallback to browser TTS
      return res.status(503).json({ 
        error: 'TTS service unavailable', 
        fallback: true,
        message: 'All authentication methods failed',
        triedMethods: authMethods.length
      });
    }

    // Set proper headers for audio
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    res.setHeader('Cache-Control', 'no-store');
    
    console.log(`Successfully serving ${audioBuffer.byteLength} bytes using auth method ${successMethod}`);
    
    // Send the audio data
    res.status(200).send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('TTS proxy error:', error);
    return res.status(500).json({ 
      error: 'TTS synthesis failed',
      fallback: true,
      message: error.message 
    });
  }
};