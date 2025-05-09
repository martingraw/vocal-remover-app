#!/bin/bash

echo "Setting up Simple Vocal Remover..."

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Install Netlify CLI if not already installed
if ! command -v netlify &> /dev/null; then
    echo "Installing Netlify CLI globally..."
    npm install -g netlify-cli
fi

# Install function dependencies
echo "Installing function dependencies..."
cd netlify/functions
npm install
cd ../..

# Install Spleeter
echo "Installing Spleeter..."
pip install spleeter

echo "Setup complete!"
echo ""
echo "To run the application locally:"
echo "1. Run 'netlify dev'"
echo "2. Open your browser to http://localhost:8888"
echo ""
echo "Note: The first time you process audio, Spleeter will download the model files (~80MB)."
