const axios = require('axios');
const FormData = require('form-data');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const spleeterApiUrl = process.env.SPLEETER_API_URL;
  if (!spleeterApiUrl) {
    console.error('SPLEETER_API_URL environment variable is not set.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error: Spleeter API URL not set.' })
    };
  }

  try {
    const requestBody = JSON.parse(event.body);
    const base64AudioDataWithPrefix = requestBody.file; // This is "data:audio/mpeg;base64,xxxx"
    const modelName = requestBody.modelName || '2stems'; // Default model

    if (!base64AudioDataWithPrefix || !base64AudioDataWithPrefix.startsWith('data:audio/')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid file format or no file data provided.' })
      };
    }

    // Extract mime type and base64 data
    const parts = base64AudioDataWithPrefix.split(';base64,');
    if (parts.length !== 2) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Malformed base64 audio data.' }) };
    }
    const mimeType = parts[0].split(':')[1];
    const audioBase64 = parts[1];
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // Create FormData to send to the Python API
    const formData = new FormData();
    formData.append('audio', audioBuffer, {
        filename: `upload.${mimeType.split('/')[1] || 'mp3'}`, // e.g., upload.mp3 or upload.wav
        contentType: mimeType,
    });
    formData.append('model', modelName);

    console.log(`Forwarding request to Spleeter API: ${spleeterApiUrl}/process for model: ${modelName}`);

    const response = await axios.post(`${spleeterApiUrl}/process`, formData, {
      headers: {
        ...formData.getHeaders(), // Important for multipart/form-data
      },
      timeout: 330000, // 5.5 minutes (Spleeter API has 5 min timeout in Gunicorn)
    });

    // Forward the response from the Spleeter API
    return {
      statusCode: response.status, // Use status from Spleeter API
      body: JSON.stringify(response.data),
    };

  } catch (error) {
    console.error('Error in Netlify function:', error.message);
    if (error.response) {
      console.error('Spleeter API Error Response Data:', error.response.data);
      console.error('Spleeter API Error Response Status:', error.response.status);
      return {
        statusCode: error.response.status || 500,
        body: JSON.stringify({ 
          error: 'Error from Spleeter API', 
          details: error.response.data 
        })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'An error occurred while communicating with the Spleeter service.',
        details: error.message
      })
    };
  }
};
