// api/tts.js - CORRECT FORMAT for ODIADEV TTS Service
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
    const ttsServiceKey = process.env.TTS_SERVICE_KEY;
    
    if (!ttsServiceUrl || !ttsServiceKey) {
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

    // Make the request with correct headers
    const response = await fetch(ttsUrl, {
      method: 'GET',
      headers: {
        'x-api-key': ttsServiceKey  // Use x-api-key, not Authorization
      }
    });

    console.log(`TTS Response status: ${response.status}`);
    console.log(`TTS Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TTS service error: ${response.status} - ${errorText}`);
      
      // Fallback to browser TTS
      return res.status(503).json({ 
        error: 'TTS service unavailable', 
        fallback: true,
        message: errorText,
        status: response.status
      });
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    
    console.log(`Audio buffer size: ${audioBuffer.byteLength} bytes`);

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      throw new Error('Empty audio response');
    }

    // Check if response is actually audio (not HTML error)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      const htmlContent = new TextDecoder().decode(audioBuffer);
      console.error('Received HTML instead of audio:', htmlContent.substring(0, 200));
      
      return res.status(503).json({ 
        error: 'TTS service returned HTML error', 
        fallback: true,
        response: htmlContent.substring(0, 200)
      });
    }

    // Set proper headers for audio
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    res.setHeader('Cache-Control', 'no-store');
    
    console.log(`Successfully serving ${audioBuffer.byteLength} bytes of audio`);
    
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