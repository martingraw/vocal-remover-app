@echo off
echo Setting up Simple Vocal Remover...

:: Install Node.js dependencies
echo Installing Node.js dependencies...
call npm install

:: Check if Netlify CLI is installed
where netlify >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing Netlify CLI globally...
    call npm install -g netlify-cli
)

:: Install function dependencies
echo Installing function dependencies...
cd netlify\functions
call npm install
cd ..\..

:: Install Spleeter
echo Installing Spleeter...
pip install spleeter

echo.
echo Setup complete!
echo.
echo To run the application locally:
echo 1. Run 'netlify dev'
echo 2. Open your browser to http://localhost:8888
echo.
echo Note: The first time you process audio, Spleeter will download the model files (~80MB).
