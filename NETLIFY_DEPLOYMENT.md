# Deploying to Netlify

This guide will walk you through deploying the Simple Vocal Remover application to Netlify.

## Prerequisites

- A GitHub account
- A Netlify account (you can sign up for free at [netlify.com](https://netlify.com))

## Deployment Steps

### 1. Push your code to GitHub

1. Create a new repository on GitHub
2. Initialize your local repository and push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/simple-vocal-remover.git
git push -u origin main
```

### 2. Connect to Netlify

1. Log in to your Netlify account
2. Click "New site from Git"
3. Select GitHub as your Git provider
4. Authorize Netlify to access your GitHub account
5. Select your repository

### 3. Configure Build Settings

Configure the following build settings:

- **Build command**: `npm install`
- **Publish directory**: `.`
- **Functions directory**: `netlify/functions`

### 4. Environment Variables

No environment variables are required for basic functionality.

### 5. Deploy

Click "Deploy site" to start the deployment process.

### 6. Install Spleeter on Netlify

After deployment, you'll need to install Spleeter on Netlify:

1. Go to Site settings > Build & deploy > Environment
2. Add a build hook to install Spleeter during the build process
3. Add the following to your build command:

```
pip install spleeter && npm install
```

## Troubleshooting

### Function Timeout

If your function times out during processing:

1. Go to Site settings > Functions
2. Increase the function timeout (up to 26 seconds on the free plan)

### File Size Limitations

Netlify has a 10MB limit for function payloads. If you need to process larger files, consider:

1. Compressing the audio before uploading
2. Using a different deployment platform with higher limits

## Limitations

- The free tier of Netlify has a 100GB bandwidth limit per month
- Function execution is limited to 125,000 invocations per month on the free tier
- Function timeout is limited to 26 seconds on the free tier

## Additional Resources

- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Netlify CLI Documentation](https://docs.netlify.com/cli/get-started/)
