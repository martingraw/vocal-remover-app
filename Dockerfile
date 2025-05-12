FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install Python dependencies
COPY requirements_api.txt /app/
RUN pip install --no-cache-dir -r requirements_api.txt

# Create directories (uploads might be temporary, Spleeter handles its output structure)
RUN mkdir -p /app/uploads /app/output_stems /app/dummy_output

# Pre-download Spleeter 2stems model (or preferred default)
# This helps speed up the first API call if a common model is used.
# The API itself will download other models on demand.
RUN touch /app/dummy_input.mp3
RUN spleeter separate -p spleeter:2stems -o /app/dummy_output /app/dummy_input.mp3 || echo "Spleeter dummy run for model pre-download finished."
RUN rm /app/dummy_input.mp3 && rm -rf /app/dummy_output

# Copy application code
COPY spleeter_api.py /app/

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=spleeter_api.py
# Gunicorn will bind to 0.0.0.0. Port will be set by Render or hosting platform.
# ENV PORT=8080 (Usually set by hosting platform)

# Expose the port Gunicorn will run on (Render typically uses 10000 or sets PORT env var)
# This is more for documentation; Render will handle port mapping.
EXPOSE 8080 

# Run the Gunicorn server
# The number of workers can be tuned. Render might override this.
# Timeout is important for long Spleeter processes.
CMD gunicorn --bind 0.0.0.0:${PORT:-8080} --workers 1 --timeout 600 spleeter_api:app
