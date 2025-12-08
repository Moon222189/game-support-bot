#!/bin/bash

# Activate virtual environment
python -m venv .venv
source .venv/bin/activate

# Install Python requirements
pip install -r requirements.txt

# Start the Python backend
python app.py &

# Start the Discord bot
node bot.js
