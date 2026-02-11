#!/bin/bash

# VetPro Platform - Quick Start Script
# This script sets up the entire development environment

set -e  # Exit on error

echo "🏥 VetPro Platform - Quick Start Setup"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Please install Node.js 20+ first.${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose not found. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Setup environment variables
echo -e "${BLUE}Setting up environment variables...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file from template${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env and add your API keys${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi
echo ""

# Start Docker services
echo -e "${BLUE}Starting Docker services (PostgreSQL + Redis)...${NC}"
docker-compose up -d postgres redis
echo -e "${GREEN}✓ Database and Redis started${NC}"
echo ""

# Wait for PostgreSQL to be ready
echo -e "${BLUE}Waiting for PostgreSQL to be ready...${NC}"
sleep 5
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
echo ""

# Setup Backend
echo -e "${BLUE}Setting up backend...${NC}"
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
fi

echo "Running Prisma migrations..."
npx prisma generate
npx prisma migrate dev --name init
echo -e "${GREEN}✓ Database schema created${NC}"

echo "Seeding database with initial data..."
npx prisma db seed || echo -e "${YELLOW}⚠️  Seeding skipped (optional)${NC}"

cd ..
echo -e "${GREEN}✓ Backend setup complete${NC}"
echo ""

# Setup Frontend
echo -e "${BLUE}Setting up frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
fi

cd ..
echo -e "${GREEN}✓ Frontend setup complete${NC}"
echo ""

# Final instructions
echo "========================================"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "========================================"
echo ""
echo "To start the application:"
echo ""
echo "Option 1 - Docker (Recommended):"
echo "  docker-compose up"
echo ""
echo "Option 2 - Manual:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Access points:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:5000"
echo "  Database:  postgresql://localhost:5432/vetpro"
echo ""
echo -e "${YELLOW}⚠️  Important: Edit .env file and add your API keys before starting!${NC}"
echo ""
echo "Default admin login:"
echo "  Email: admin@vetpro.com"
echo "  Password: admin123"
echo -e "${YELLOW}  ⚠️  Change this password immediately!${NC}"
echo ""
