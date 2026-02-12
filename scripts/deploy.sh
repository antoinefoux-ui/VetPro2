#!/bin/bash

echo "🚀 Deploying VetPro Platform..."

# Build and deploy
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Deployment complete!"
