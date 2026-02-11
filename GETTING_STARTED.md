# 🚀 Getting Started with VetPro Platform

Welcome to VetPro - your AI-powered veterinary practice management solution!

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **npm** 10.x or higher (comes with Node.js)
- **Docker** and **Docker Compose** ([Download](https://www.docker.com/get-started))
- **PostgreSQL** 15+ (if not using Docker)
- **Git** ([Download](https://git-scm.com/))

## 🎯 Quick Start (5 minutes)

### Option 1: Automated Setup (Recommended)

```bash
# 1. Run the setup script
chmod +x setup.sh
./setup.sh

# 2. Edit environment variables
nano .env  # or use your preferred editor

# 3. Start everything with Docker
docker-compose up
```

That's it! Go to http://localhost:3000

### Option 2: Manual Setup

```bash
# 1. Setup environment
cp .env.example .env
# Edit .env with your API keys

# 2. Start database
docker-compose up -d postgres redis

# 3. Setup backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# 4. In a new terminal, setup frontend
cd frontend
npm install
npm run dev
```

## 🔑 Required API Keys

To use all features, you'll need:

### Essential (Core Features):
- **OpenAI API Key** - For AI voice transcription and report generation
  - Get it at: https://platform.openai.com/api-keys
  - Monthly cost estimate: €50-200 depending on usage
  - Add to `.env`: `OPENAI_API_KEY=sk-...`

### Optional (Enhanced Features):
- **SendGrid** - Email notifications and newsletters
  - Free tier: 100 emails/day
  - Get it at: https://signup.sendgrid.com/
  
- **Twilio** - SMS reminders and phone assistant
  - Free trial available
  - Get it at: https://www.twilio.com/try-twilio
  
- **Stripe** - Payment processing
  - Test mode available for development
  - Get it at: https://dashboard.stripe.com/register
  
- **AWS S3** - File storage (X-rays, photos, documents)
  - Free tier: 5GB storage
  - Get it at: https://aws.amazon.com/s3/

## 🎨 First Login

1. Open browser to http://localhost:3000
2. Login with default credentials:
   - **Email**: admin@vetpro.com
   - **Password**: admin123
3. **⚠️ Change password immediately in Settings!**

## 📚 Key Features to Try

### 1. Dashboard Overview
- View today's appointments
- Check room status
- Monitor inventory alerts
- See revenue metrics

### 2. Create a Client & Pet
1. Click "Clients" in sidebar
2. Click "+ New Client"
3. Fill in client details
4. Add a pet profile with:
   - Name, species, breed
   - Date of birth
   - Upload a photo

### 3. Schedule an Appointment
1. Click "Calendar" in sidebar
2. Click a time slot
3. Select client and pet
4. Choose appointment type
5. Assign veterinarian

### 4. AI Voice Documentation (Demo Mode)
Since you might not have microphones set up yet:
1. Go to Appointments
2. Click "Start Consultation"
3. Try the text input demo mode
4. Type: "Dog has ear infection, prescribing Otomax"
5. Watch AI auto-generate:
   - Diagnosis
   - Prescription
   - Draft invoice

### 5. Invoice Approval Workflow
1. After consultation, go to checkout
2. Review AI-generated draft invoice
3. Edit if needed (add/remove items)
4. Click "Approve"
5. Watch automatic actions:
   - Inventory deduction
   - Label printing (simulated)
   - Invoice finalization

### 6. Inventory Management
1. Go to "Inventory"
2. Add some products/medications
3. Set minimum stock levels
4. Create a test low-stock alert
5. See auto-generated purchase order

## 🔧 Configuration

### Database Connection

Edit `.env`:
```env
DATABASE_URL="postgresql://vetpro:password@localhost:5432/vetpro"
```

For Docker:
```env
DATABASE_URL="postgresql://vetpro:vetpro_secure_password_change_me@postgres:5432/vetpro"
```

### AI Configuration

**Voice Recognition:**
```env
OPENAI_API_KEY="sk-..."
# Model for transcription (Whisper)
VOICE_MODEL="whisper-1"
# Model for text generation (GPT-4)
TEXT_MODEL="gpt-4-turbo-preview"
```

**Cost Optimization:**
- Use `whisper-1` for transcription (~$0.006/minute)
- Use `gpt-4` for reports (~$0.03/1K tokens)
- Expected monthly cost for medium clinic: €100-300

### Email Configuration

**SendGrid:**
```env
SENDGRID_API_KEY="SG...."
EMAIL_FROM="noreply@vetpro.com"
```

**Templates:**
- Appointment confirmations
- Reminders
- Lab results
- Invoices

### Payment Configuration

**Stripe (Test Mode):**
```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

Test cards:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

### Slovak eKasa (CHUD) Configuration

```env
EKASA_API_URL="https://your-ekasa-provider.sk/api"
EKASA_API_KEY="..."
EKASA_BUSINESS_ID="12345678"
```

Contact your eKasa provider for API credentials.

## 📱 Mobile Setup

### Progressive Web App (PWA)
The frontend works as a PWA:
1. Open on mobile browser
2. Click "Add to Home Screen"
3. Use like a native app

### Native Apps (Optional)
React Native apps available in `/mobile` directory.

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps

# Check logs
docker logs vetpro-db

# Restart database
docker-compose restart postgres
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Prisma Issues
```bash
# Regenerate Prisma client
cd backend
npx prisma generate

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

### Node Modules Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 🔐 Security Checklist

Before going to production:

- [ ] Change default admin password
- [ ] Update `.env` with strong secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Enable two-factor authentication
- [ ] Review GDPR compliance settings
- [ ] Configure rate limiting
- [ ] Set up monitoring/alerts

## 📊 Performance Optimization

### Database
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_appointments_date ON appointments(scheduled_start);
CREATE INDEX idx_clients_search ON clients USING gin(to_tsvector('simple', first_name || ' ' || last_name));
```

### Caching
Redis is included for:
- Session storage
- Frequently accessed data
- Real-time updates

### File Storage
For production, use AWS S3 or Cloudflare R2:
- Automatic backups
- CDN delivery
- Scalable storage

## 📈 Monitoring

### Application Logs
```bash
# View backend logs
docker logs -f vetpro-backend

# View database logs
docker logs -f vetpro-db
```

### Health Checks
- Backend: http://localhost:5000/health
- Database: Check with `docker ps`

### Metrics (Optional)
Add monitoring tools:
- **Sentry** - Error tracking
- **Datadog** - Performance monitoring
- **LogRocket** - Session replay

## 🎓 Learning Resources

### Documentation
- [Full API Documentation](./docs/API.md)
- [Database Schema](./database/schema.sql)
- [Workflow Guide](./docs/WORKFLOW.pdf)

### Video Tutorials
1. System Overview (5 min)
2. Patient Management (10 min)
3. AI Voice Features (15 min)
4. Billing & Invoicing (8 min)
5. Inventory Management (12 min)

### Support
- **Documentation**: https://docs.vetpro.com
- **Email**: support@vetpro.com
- **Community**: https://community.vetpro.com

## 🚢 Deployment

### Production Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for:
- AWS deployment
- Google Cloud deployment
- DigitalOcean deployment
- SSL/HTTPS setup
- Domain configuration
- Backup strategies

### Environment-Specific Configuration

**Development:**
```env
NODE_ENV=development
LOG_LEVEL=debug
```

**Production:**
```env
NODE_ENV=production
LOG_LEVEL=info
```

## ✅ Next Steps

1. **Customize Settings**
   - Clinic name and logo
   - Business hours
   - Service pricing
   - Email templates

2. **Import Data**
   - Existing client list
   - Pet records
   - Inventory items
   - Staff profiles

3. **Train Staff**
   - Dashboard navigation
   - Appointment scheduling
   - Invoice workflow
   - Voice documentation

4. **Go Live!**
   - Start with limited features
   - Gradually enable AI features
   - Monitor and optimize
   - Collect feedback

## 💡 Tips & Best Practices

### Daily Operations
- Review dashboard every morning
- Check inventory alerts
- Approve pending purchase orders
- Monitor appointment no-shows

### AI Usage
- Review AI-generated invoices carefully
- Correct voice transcription errors
- Train AI with feedback
- Monitor AI costs monthly

### Data Management
- Back up database daily
- Archive old records yearly
- Export data quarterly
- Audit user access logs

### Client Communication
- Send appointment reminders
- Follow up after visits
- Request reviews from happy clients
- Send educational newsletters

---

**Need Help?** Contact support@vetpro.com or check the documentation at https://docs.vetpro.com

**Found a Bug?** Report it on our issue tracker or email bugs@vetpro.com

**Have Feedback?** We'd love to hear from you! feedback@vetpro.com

---

© 2026 VetPro. All rights reserved.
