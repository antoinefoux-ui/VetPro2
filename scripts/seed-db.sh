#!/bin/bash

cd backend
npx prisma db seed
echo "✅ Database seeded"
