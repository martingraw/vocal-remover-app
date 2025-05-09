# Simple Vocal Remover

A web application that uses Spleeter to separate vocals from music tracks.

## Features

- Upload audio files to separate vocals from instrumentals
- Download the separated tracks (vocals and instrumental)
- Simple, user-friendly interface
- Serverless architecture for easy deployment

## Technology Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Netlify Functions (serverless)
- Audio Processing: Spleeter (2stems model)

## Deployment

This application is designed to be deployed on Netlify:

1. Clone this repository
2. Connect your GitHub repository to Netlify
3. Deploy with the following settings:
   - Build command: `npm install`
   - Publish directory: `.`
   - Functions directory: `netlify/functions`

## Local Development

To run this application locally:

1. Install the Netlify CLI:
   ```
   npm install -g netlify-cli
   ```

2. Install dependencies:
   ```
   npm install
   cd netlify/functions
   npm install
   ```

3. Install Spleeter:
   ```
   pip install spleeter
   ```

4. Start the development server:
   ```
   netlify dev
   ```

5. Open your browser to `http://localhost:8888`

## Limitations

- File size is limited to 10MB due to serverless function constraints
- Processing time may vary depending on file size and complexity
- Spleeter's 2stems model provides good but not perfect separation

## License

MIT
