import os
import subprocess
import tempfile
import shutil
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS # Import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
# Initialize CORS: allow requests to /process/ from your Netlify app's origin.
# This will also handle preflight OPTIONS requests.
CORS(app, resources={r"/process/": {"origins": "https://vocal-remover-tool.netlify.app"}})

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'output_stems'
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'ogg', 'flac', 'm4a'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
# Output folder will be created by Spleeter per processing run

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Spleeter API is running."}), 200

@app.route('/process/', methods=['POST']) # Added trailing slash to match client request
def process_audio_route():
    # NOTE: The frontend sends JSON data (Content-Type: application/json) with 'file' as a base64 string.
    # The current code expects multipart/form-data ('audio' in request.files).
    # This will need to be changed in the next step if CORS is resolved.
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    base64_audio_data_url = data.get('file')
    model_name = data.get('modelName', '2stems') # Default to 2stems if not provided

    if not base64_audio_data_url:
        return jsonify({"error": "No audio data in 'file' field"}), 400
    
    if not model_name: # Should default, but good to check
        return jsonify({"error": "No model name in 'modelName' field"}), 400

    try:
        # The frontend sends a data URL: "data:audio/wav;base64,ENCODED_STRING"
        # We need to strip the prefix to get the pure base64 string.
        header, encoded_data = base64_audio_data_url.split(',', 1)
        audio_bytes = base64.b64decode(encoded_data)
    except Exception as e:
        app.logger.error(f"Base64 decoding error: {str(e)}")
        return jsonify({"error": "Invalid base64 audio data", "details": str(e)}), 400

    # Use a generic filename for the temporary input file, Spleeter handles various formats.
    # It's good practice to infer extension if possible, but Spleeter is robust.
    # For simplicity, we'll use a generic name. The actual format is in the audio_bytes.
    filename = "input_audio.tmp" # Generic temp filename
    
    # Use a temporary directory for each request to handle concurrent requests
    # and ensure cleanup. Spleeter creates a subdirectory named after the input file.
    with tempfile.TemporaryDirectory() as processing_dir:
        input_file_path = os.path.join(processing_dir, filename)
        spleeter_output_dir = os.path.join(processing_dir, "spleeter_out")
        os.makedirs(spleeter_output_dir, exist_ok=True)
        
        # Correctly write the decoded audio bytes to the temporary file
        with open(input_file_path, 'wb') as f:
            f.write(audio_bytes)

        try:
            spleeter_command = [
                'spleeter', 'separate',
                '-p', f'spleeter:{model_name}',
                '-o', spleeter_output_dir,
                input_file_path
            ]
            app.logger.info(f"Running Spleeter: {' '.join(spleeter_command)}")
            
            # Increased timeout for Spleeter processing
            process = subprocess.run(spleeter_command, capture_output=True, text=True, check=True, timeout=300) # 5 minutes timeout
            app.logger.info(f"Spleeter stdout: {process.stdout}")
            app.logger.error(f"Spleeter stderr: {process.stderr}")

        except subprocess.CalledProcessError as e:
            app.logger.error(f"Spleeter error: {e.stderr}")
            return jsonify({"error": "Spleeter processing failed", "details": e.stderr}), 500
        except subprocess.TimeoutExpired:
            app.logger.error("Spleeter command timed out")
            return jsonify({"error": "Spleeter processing timed out"}), 500
        except Exception as e:
            app.logger.error(f"An unexpected error occurred: {str(e)}")
            return jsonify({"error": "An unexpected error occurred during processing", "details": str(e)}), 500

        # Determine expected stems
        # Spleeter creates a subdirectory inside spleeter_output_dir named after the input file (without extension)
        input_filename_no_ext = os.path.splitext(filename)[0]
        actual_stems_path = os.path.join(spleeter_output_dir, input_filename_no_ext)

        stems_to_collect = {}
        if model_name == '2stems':
            stems_to_collect = {'vocals': 'vocals.wav', 'accompaniment': 'accompaniment.wav'}
        elif model_name == '4stems':
            stems_to_collect = {'vocals': 'vocals.wav', 'drums': 'drums.wav', 'bass': 'bass.wav', 'other': 'other.wav'}
        elif model_name == '5stems':
            stems_to_collect = {'vocals': 'vocals.wav', 'drums': 'drums.wav', 'bass': 'bass.wav', 'piano': 'piano.wav', 'other': 'other.wav'}
        else:
            return jsonify({"error": f"Unknown model: {model_name}"}), 400

        processed_stems_data = {}
        for stem_key, stem_filename in stems_to_collect.items():
            stem_file_path = os.path.join(actual_stems_path, stem_filename)
            if os.path.exists(stem_file_path):
                with open(stem_file_path, 'rb') as f:
                    processed_stems_data[stem_key] = base64.b64encode(f.read()).decode('utf-8')
            else:
                # This case should ideally be caught by Spleeter's error or entrypoint.sh checks
                app.logger.error(f"Expected stem file not found: {stem_file_path}")
                # Optionally, return an error or an empty string for this stem
                # For now, let's assume Spleeter guarantees output if it doesn't error.
                # If it can fail silently, more robust checking is needed.

        if not processed_stems_data:
             return jsonify({"error": "No stems processed or found"}), 500
             
        return jsonify({"stems": processed_stems_data, "modelUsed": model_name})

if __name__ == '__main__':
    # For local testing, not for production on Render (Render uses Gunicorn or similar)
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)), debug=True)
