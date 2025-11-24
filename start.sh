#!/bin/bash

echo "========================================"
echo "AI Data Annotation Platform - Startup"
echo "========================================"
echo ""

cd backend

echo "Checking Python installation..."
python3 --version
if [ $? -ne 0 ]; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

echo ""
echo "Installing dependencies..."
pip3 install -r requirements.txt

echo ""
echo "========================================"
echo "Starting the API server..."
echo "========================================"
echo "API will be available at: http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

python3 main.py
