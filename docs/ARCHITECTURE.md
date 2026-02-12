# System Architecture

## Overview
VetPro is a full-stack veterinary practice management platform.

## Tech Stack
- **Backend**: Node.js, Express, TypeScript, Prisma
- **Frontend**: React, TypeScript, Vite, Tailwind
- **Database**: PostgreSQL
- **Real-time**: Socket.IO
- **Auth**: JWT

## Architecture Diagram
```
[Frontend] <-> [Backend API] <-> [Database]
                  |
                  v
        [External Services]
        - SendGrid (Email)
        - Twilio (SMS)
        - Stripe (Payments)
```
