#!/bin/bash

# Files to keep
keep_files=(
  "index.html"
  "styles.css"
  "app.js"
  "netlify.toml"
  "netlify/functions/process-audio.js"
  "netlify/functions/package.json"
  ".gitignore"
  "README.md"
  "package.json"
  "cleanup.sh"
)

# Check if a file should be kept
should_keep() {
  local file="$1"
  for keep_file in "${keep_files[@]}"; do
    if [[ "$file" == "$keep_file" ]]; then
      return 0
    fi
  done
  return 1
}

# Remove unnecessary files
echo "Removing unnecessary files..."

# List all files (excluding directories and hidden files)
for file in $(find . -type f -not -path "*/\.*" -not -path "*/node_modules/*" -not -path "*/venv/*"); do
  # Remove leading ./
  file=${file#./}
  
  if ! should_keep "$file"; then
    echo "Removing: $file"
    rm "$file"
  else
    echo "Keeping: $file"
  fi
done

# Remove unnecessary directories
echo "Removing unnecessary directories..."
directories_to_remove=(
  "output"
  "pretrained_models"
  "venv"
)

for dir in "${directories_to_remove[@]}"; do
  if [ -d "$dir" ]; then
    echo "Removing directory: $dir"
    rm -rf "$dir"
  fi
done

echo "Cleanup complete!"
