#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

echo "--- Entrypoint script started ---"
echo "Input directory (/app/input):"
ls -la /app/input

# Check if input file exists, with a small delay and retry
if [ ! -f /app/input/input.mp3 ]; then
    echo "Input file /app/input/input.mp3 not immediately found. Waiting 1 second..."
    sleep 1
    ls -la /app/input # Check again
    if [ ! -f /app/input/input.mp3 ]; then
        echo "Error: Input file still not found at /app/input/input.mp3 after delay."
        exit 1
    fi
fi
echo "Input file /app/input/input.mp3 found."

# Run Spleeter
echo "Starting Spleeter separation with model: spleeter:${SPLEETER_MODEL}..."
spleeter separate -p spleeter:${SPLEETER_MODEL} -o /app/output /app/input/input.mp3 || { echo "Spleeter command failed for model ${SPLEETER_MODEL}"; exit 1; }

echo "Spleeter command finished for model ${SPLEETER_MODEL}."

echo "Output directory (/app/output):"
ls -la /app/output
echo "Output subdirectory (/app/output/input):"
ls -la /app/output/input || echo "Output subdirectory /app/output/input not found or empty"

# Check if expected output files exist based on the model
echo "Checking for output files for model spleeter:${SPLEETER_MODEL}..."
OUTPUT_DIR="/app/output/input" # Spleeter creates a subdirectory named after the input file

if [ "${SPLEETER_MODEL}" = "2stems" ]; then
    if [ ! -f "${OUTPUT_DIR}/vocals.wav" ] || \
       [ ! -f "${OUTPUT_DIR}/accompaniment.wav" ]; then
        echo "Error: Expected 2stems output files (vocals.wav, accompaniment.wav) not found."
        exit 1
    fi
    echo "Found: vocals.wav, accompaniment.wav"
elif [ "${SPLEETER_MODEL}" = "4stems" ]; then
    if [ ! -f "${OUTPUT_DIR}/vocals.wav" ] || \
       [ ! -f "${OUTPUT_DIR}/drums.wav" ] || \
       [ ! -f "${OUTPUT_DIR}/bass.wav" ] || \
       [ ! -f "${OUTPUT_DIR}/other.wav" ]; then
        echo "Error: Expected 4stems output files (vocals, drums, bass, other) not found."
        exit 1
    fi
    echo "Found: vocals.wav, drums.wav, bass.wav, other.wav"
elif [ "${SPLEETER_MODEL}" = "5stems" ]; then
    if [ ! -f "${OUTPUT_DIR}/vocals.wav" ] || \
       [ ! -f "${OUTPUT_DIR}/drums.wav" ] || \
       [ ! -f "${OUTPUT_DIR}/bass.wav" ] || \
       [ ! -f "${OUTPUT_DIR}/piano.wav" ] || \
       [ ! -f "${OUTPUT_DIR}/other.wav" ]; then
        echo "Error: Expected 5stems output files (vocals, drums, bass, piano, other) not found."
        exit 1
    fi
    echo "Found: vocals.wav, drums.wav, bass.wav, piano.wav, other.wav"
else
    echo "Error: Unknown SPLEETER_MODEL: ${SPLEETER_MODEL}"
    exit 1
fi

echo "Separation complete! All expected stem files found."
echo "--- Entrypoint script finished successfully ---"
