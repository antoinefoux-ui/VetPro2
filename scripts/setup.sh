#!/bin/bash

echo "🚀 Setting up VetPro Platform..."

# Backend setup
cd backend
echo "📦 Installing backend dependencies..."
npm install
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
cd ..

# Frontend setup
cd frontend
echo "📦 Installing frontend dependencies..."
npm install
cd ..

echo "✅ Setup complete!"
echo "Run 'docker-compose up' to start the application"
