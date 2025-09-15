#!/bin/bash

# Simple HeadlessX Test Script
echo "🧪 HeadlessX Quick Test - Testing all endpoints..."

API_BASE="http://localhost:3000"
TEST_URL="https://example.com"
GOOGLE_URL="https://google.com"

echo ""
echo "Testing JSON endpoint with example.com..."
curl -s -X POST "$API_BASE/api/render" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"$TEST_URL\"}" | head -5

echo ""
echo "Testing HTML endpoint with Google.com..."
curl -s -X POST "$API_BASE/api/html" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"$GOOGLE_URL\"}" | head -10

echo ""
echo "Testing Content endpoint..."
curl -s -X POST "$API_BASE/api/content" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"$TEST_URL\"}" | head -5

echo ""
echo "Testing PDF endpoint..."
curl -s -I "$API_BASE/api/pdf?url=$TEST_URL" | grep -E "(HTTP|Content-Type|Content-Length)"

echo ""
echo "Testing Screenshot endpoint..."
curl -s -I "$API_BASE/api/screenshot?url=$TEST_URL" | grep -E "(HTTP|Content-Type|Content-Length)"

echo ""
echo "✅ Quick test complete! If you see content above, HeadlessX is working!"
echo "💡 To start the server: npm start"
echo "📋 For full testing: bash scripts/test-api-endpoints.sh"