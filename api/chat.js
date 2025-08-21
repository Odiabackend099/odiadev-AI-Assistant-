// api/chat.js - CORRECT FORMAT for ODIADEV Chat Service
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
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Get backend service details
    const ttsServiceUrl = process.env.TTS_SERVICE_URL;
    const ttsServiceKey = process.env.TTS_SERVICE_KEY;
    
    // Try to use your ODIADEV agent service first
    if (ttsServiceUrl && ttsServiceKey) {
      try {
        console.log(`Calling ODIADEV agent: ${ttsServiceUrl}/agent`);
        
        const response = await fetch(`${ttsServiceUrl}/agent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ttsServiceKey
          },
          body: JSON.stringify({ text })
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.reply || data.response || 'I received your message.';
          
          console.log(`ODIADEV agent response: ${reply}`);
          return res.status(200).json({ reply });
        } else {
          console.log(`ODIADEV agent failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`ODIADEV agent error: ${error.message}`);
      }
    }

    // Fallback to Anthropic API
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';
    
    if (!anthropicKey) {
      // Ultimate fallback
      return res.status(200).json({ 
        reply: `I hear you saying: "${text}". I'm a Nigerian AI assistant ready to help!` 
      });
    }

    console.log('Using Anthropic API as fallback');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 512,
        system: 'You are ODIADEV AI assistant for Nigerian businesses. Keep replies concise, helpful, and friendly. Use simple Nigerian English.',
        messages: [{ role: 'user', content: text }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response.';

    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ 
      error: 'Failed to process request',
      message: error.message 
    });
  }
};