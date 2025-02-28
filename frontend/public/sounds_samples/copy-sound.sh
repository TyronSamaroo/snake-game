#!/bin/bash

# Script to copy a sound sample to the sounds directory

SOURCE_SOUND=$1
DESTINATION_SOUND=$2

if [ -z "$SOURCE_SOUND" ] || [ -z "$DESTINATION_SOUND" ]; then
  echo "Usage: ./copy-sound.sh <source_sound> <destination_sound>"
  echo "Example: ./copy-sound.sh gameover3.mp3 gameover.mp3"
  exit 1
fi

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Set the source and destination paths
SOURCE_PATH="$SCRIPT_DIR/$SOURCE_SOUND"
DEST_DIR="$SCRIPT_DIR/../sounds"
DEST_PATH="$DEST_DIR/$DESTINATION_SOUND"

# Check if source file exists
if [ ! -f "$SOURCE_PATH" ]; then
  echo "Error: Source file $SOURCE_PATH does not exist"
  exit 1
fi

# Check if destination directory exists, create if not
if [ ! -d "$DEST_DIR" ]; then
  echo "Creating sounds directory..."
  mkdir -p "$DEST_DIR"
fi

# Copy the file
echo "Copying $SOURCE_SOUND to $DEST_PATH..."
cp "$SOURCE_PATH" "$DEST_PATH"

if [ $? -eq 0 ]; then
  echo "✅ Successfully copied sound file!"
  echo "Sound will now be used in your game."
else
  echo "❌ Failed to copy file. Please check permissions and try again."
fi 