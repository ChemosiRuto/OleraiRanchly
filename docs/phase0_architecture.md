# OleraiRanchly Phase 0: Technical Architecture

## 1. Monorepo Folder Structure

We'll use a Turborepo monorepo with the following structure:

```
olerai-ranchly/
├── apps/
│   ├── web/                  # Next.js frontend (PWA)
│   └── api/                  # NestJS backend
├── packages/
│   ├── ui/                   # Shared React components (if any)
│   ├── types/                # Shared TypeScript types
│   ├── utils/                # Shared utility functions
│   └── config/               # Shared configurations (eslint, typescript, etc.)
├── .turbo/
├── docs/
├── scripts/
└── package.json              # Root package.json for workspace management
```

## 2. Data Model (ERD)

### Entities and Relationships

```mermaid
erDiagram
    USER ||..|{ LIVESTOCK : owns
    USER ||..|{ HEALTH_EVENT : records
    USER ||..|{ MARKET_LISTING : creates
    USER ||..|{ FINANCE_RECORD : has
    USER ||..|{ NOTIFICATION : receives
    USER }|..|{ ROLE : has
    
    LIVESTOCK ||..|{ HEALTH_EVENT : has
    LIVESTOCK ||..|{ MARKET_LISTING : listed_in
    LIVESTOCK }|..|{ BREED : has
    
    VET ||..|{ HEALTH_EVENT : performs
    AGRO_SUPPLIER ||..|{ MARKET_LISTING : supplies
    
    USER {
        string id PK
        string email
        string passwordHash
        string firstName
        string lastName
        string phone
        string location
        string farmName
        datetime createdAt
        datetime updatedAt
        boolean isVerified
        string avatarUrl
    }
    
    ROLE {
        string id PK
        string name
        string description
    }
    
    LIVESTOCK {
        string id PK
        string userId FK
        string breedId FK
        string tagNumber
        string name
        enum gender
        decimal weight
        decimal height
        date dateOfBirth
        date acquisitionDate
        string motherId
        string fatherId
        string imageUrl
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    BREED {
        string id PK
        string name
        string species
        string description
    }
    
    HEALTH_EVENT {
        string id PK
        string livestockId FK
        string userId FK
        string vetId FK
        enum type
        string description
        decimal cost
        date date
        string nextDueDate
        string prescription
        boolean isFollowUpRequired
        datetime createdAt
    }
    
    MARKET_LISTING {
        string id PK
        string livestockId FK
        string userId FK
        string agroSupplierId FK
        enum listingType
        string title
        string description
        decimal price
        string location
        boolean isAvailable
        datetime listedAt
        datetime expiresAt
        datetime soldAt
    }
    
    FINANCE_RECORD {
        string id PK
        string userId FK
        enum type
        string description
        decimal amount
        date date
        string referenceNumber
        string status
        datetime createdAt
    }
    
    NOTIFICATION {
        string id PK
        string userId FK
        string title
        string body
        enum type
        boolean isRead
        datetime createdAt
    }
```

### Key Points:
- **User**: Central entity with role-based access control (Farmer, Veterinarian, Agro-chemist, Admin)
- **Livestock**: Core asset, linked to user (owner) and breed
- **Health Event**: Veterinary treatments, vaccinations, check-ups
- **Market Listing**: For buying/selling livestock and products
- **Finance Record**: Transactions, loans, insurance, SACCO contributions
- **Notification**: System alerts and messages

## 3. API Endpoint Outline (RESTful)

### Authentication
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- POST `/api/auth/refresh-token`
- GET `/api/auth/profile`

### Users
- GET `/api/users/me`
- PUT `/api/users/me`
- GET `/api/users/:id` (admin/veterinarian only)
- GET `/api/users` (admin only, with filters)

### Livestock
- GET `/api/livestock`
- POST `/api/livestock`
- GET `/api/livestock/:id`
- PUT `/api/livestock/:id`
- DELETE `/api/livestock/:id`
- GET `/api/livestock/:id/health-events`
- GET `/api/livestock/:id/market-listings`

### Health Events
- GET `/api/health-events`
- POST `/api/health-events`
- GET `/api/health-events/:id`
- PUT `/api/health-events/:id`
- DELETE `/api/health-events/:id`

### Market Listings
- GET `/api/market-listings`
- POST `/api/market-listings`
- GET `/api/market-listings/:id`
- PUT `/api/market-listings/:id`
- DELETE `/api/market-listings/:id`

### Finance
- GET `/api/finance`
- POST `/api/finance`
- GET `/api/finance/:id`

### Notifications
- GET `/api/notifications`
- PUT `/api/notifications/:id/read`
- DELETE `/api/notifications/:id`

### Roles & Permissions
- GET `/api/roles`
- POST `/api/roles` (admin)
- PUT `/api/roles/:id` (admin)
- DELETE `/api/roles/:id` (admin)

## 4. Offline-First Strategy (Frontend)

### Dexie.js IndexedDB Implementation
- Local storage for: User profile, Livestock records, Health events, Market listings, Finance records
- Background synchronization using Service Workers
- Conflict resolution: Last-write-wins with user confirmation for critical conflicts
- Queue system for offline actions that retry when online
- Selective sync: Users can choose what data to sync (e.g., only current year's records)

### Service Worker
- Cache static assets (App Shell)
- Cache API responses with stale-while-revalidate strategy
- Background sync for critical operations (e.g., adding a new livestock record)

## 5. Backend Module Breakdown (NestJS)

### Core Modules
1. **AuthModule** - JWT authentication, role-based access control
2. **UsersModule** - User management, profile, roles
3. **LivestockModule** - CRUD operations for livestock and breeding
4. **HealthModule** - Health events, vaccinations, treatments
5. **MarketModule** - Listings, transactions, search/filtering
6. **FinanceModule** - Transactions, loans, insurance, SACCO integration
7. **NotificationsModule** - In-app notifications, email/SMS integration
8. **RolesModule** - Role and permission management
9. **AnalyticsModule** - Reports, dashboards, data exports

### Shared Services
- **FileUploadService** - Handling image uploads (local/cloud)
- **EmailService** - Sending transactional emails
- **SMSService** - Integrating with local SMS providers (Africa's Talking)
- **PaymentService** - Mobile money integration (M-Pesa, Airtel Money)
- **GeolocationService** - Distance-based searches for vets/agro-chems

## 6. Database Schema Design (PostgreSQL/Prisma)

### Prisma Schema Highlights
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  firstName     String
  lastName      String
  phone         String?
  location      String?
  farmName      String?
  isVerified    Boolean  @default(false)
  avatarUrl     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  roles         Role[]   @manyToMany @relation("UserRoles")
  livestock     Livestock[]
  healthEvents  HealthEvent[]
  marketListings MarketListing[]
  financeRecords FinanceRecord[]
  notifications Notification[]
}

model Role {
  id        String   @id @default(uuid())
  name      String   @unique
  description String?
  users     User[]   @manyToMany @relation("UserRoles")
}

model Livestock {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  breedId     String?
  breed       Breed?   @relation(fields: [breedId], references: [id])
  tagNumber   String?
  name        String?
  gender      Gender
  weight      Float?
  height      Float?
  dateOfBirth DateTime?
  acquisitionDate DateTime?
  motherId    String?
  fatherId    String?
  imageUrl    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  healthEvents HealthEvent[]
  marketListings MarketListing[]
}

model Breed {
  id        String   @id @default(uuid())
  name      String
  species   String
  description String?
  livestock Livestock[]
}

model HealthEvent {
  id          String   @id @default(uuid())
  livestockId String
  livestock   Livestock @relation(fields: [livestockId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  vetId       String?
  vet         User?    @relation("VetHealthEvent", fields: [vetId], references: [id])
  type        HealthEventType
  description String?
  cost        Decimal?
  date        DateTime
  nextDueDate DateTime?
  prescription String?
  isFollowUpRequired Boolean @default(false)
  createdAt   DateTime @default(now())
}

model MarketListing {
  id            String   @id @default(uuid())
  livestockId   String
  livestock     Livestock @relation(fields: [livestockId], references: [id])
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  agroSupplierId String?
  agroSupplier  User?    @relation("AgroSupplierListing", fields: [agroSupplierId], references: [id])
  listingType   ListingType
  title         String
  description   String?
  price         Decimal
  location      String?
  isAvailable   Boolean  @default(true)
  listedAt      DateTime @default(now())
  expiresAt     DateTime?
  soldAt        DateTime?
}

model FinanceRecord {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  type          FinanceType
  description   String?
  amount        Decimal
  date          DateTime
  referenceNumber String?
  status        FinanceStatus
  createdAt     DateTime @default(now())
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String
  body      String
  type      NotificationType
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### Enums (examples)
```prisma
enum Gender {
  MALE
  FEMALE
}

enum HealthEventType {
  VACCINATION
  TREATMENT
  CHECK_UP
  BIRTH
  DEATH
}

enum ListingType {
  SALE
  AUCTION
  WANTED
}

enum FinanceType {
  INCOME
  EXPENSE
  LOAN
  INSURANCE
  SACCO_CONTRIBUTION
}

enum FinanceStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
}

enum NotificationType {
  SYSTEM
  MARKET
  HEALTH
  FINANCE
  MESSAGE
}
```

## 7. Queue System Plan (Redis/BullMQ)

### Use Cases
1. **Async Notifications** - Send emails/SMS without blocking API responses
2. **Report Generation** - Generate PDF/Excel reports in background
3. **Data Synchronization** - Sync local Dexie changes with backend when online
4. **Reminder System** - Schedule health event follow-ups, market listing expirations
5. **Image Processing** - Optimize and resize uploaded images

### Queue Names
- `notifications` - Email/SMS sending
- `reports` - Analytics report generation
- `sync` - Offline data synchronization
- `reminders` - Scheduled notifications
- `image-processing` - Image optimization

### Implementation
- Use BullMQ with Redis as the backing store
- Set up retry mechanisms with exponential backoff
- Dead letter queues for failed jobs
- Monitoring via Bull Board

## 8. Real-Time Features Plan (Socket.IO)

### Use Cases
1. **Live Chat** - Between farmers and vets/agro-chemists
2. **Real-Time Market Updates** - New listings, price changes
3. **Live Location Sharing** - For emergency vet consultations
4. **Collaborative Features** - Multiple users viewing same livestock record
5. **Live Notifications** - Instant alerts for bookings, messages

### Implementation
- Socket.IO server integrated with NestJS
- JWT authentication for socket connections
- Rooms based on user roles, locations, or specific entities (e.g., livestock ID)
- Fallback to polling for environments where WebSockets aren't supported
- Message persistence for critical communications

## 9. Development Environment Setup

### Docker Compose
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: olerai_ranchly
      POSTGRES_USER: olerai
      POSTGRES_PASSWORD: olerai_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  api:
    build: ./apps/api
    ports:
      - "3001:3000"
    environment:
      - DATABASE_URL=postgresql://olerai:olerai_secure_password@postgres:5432/olerai_ranchly
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./apps/api:/usr/src/app
      - /usr/src/app/node_modules
  
  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    depends_on:
      - api
    volumes:
      - ./apps/web:/usr/src/app
      - /usr/src/app/node_modules
  
volumes:
  postgres_data:
```

### Development Scripts
- `dev:api` - Start API in development mode
- `dev:web` - Start web app in development mode
- `dev` - Start both using concurrently
- `test:api` - Run API tests
- `test:web` - Run web app tests
- `lint` - Run ESLint on all packages
- `format` - Run Prettier on all packages

## 10. Testing Strategy

### Unit Testing
- **Backend** - Jest for service and controller tests
- **Frontend** - Jest + React Testing Library for component tests
- **Coverage Target** - 80%+ for critical modules

### Integration Testing
- **Backend** - Supertest for API endpoint tests
- **Frontend** - Cypress for critical user journeys
- **Database** - Testcontainers for PostgreSQL/Redis integration tests

### End-to-End Testing
- Cypress for full user flows:
  - User registration and onboarding
  - Adding livestock and health events
  - Creating market listings
  - Financial transactions
  - Offline functionality and sync

### Testing Tools
- Jest, React Testing Library, Cypress, Testcontainers
- GitHub Actions for CI/CD pipeline

## 11. Security Considerations

### Authentication & Authorization
- JWT tokens with HTTP-only cookies for secure storage
- Role-based access control (RBAC) with middleware
- Password hashing using bcrypt (cost factor 12)
- Rate limiting on auth endpoints (5 attempts per 15 minutes per IP)
- Account lockout after 5 failed attempts
- Secure password reset with time-limited tokens

### Data Protection
- HTTPS enforcement in production
- Input validation and sanitization (using class-validator and DTOs)
- SQL injection prevention (Prisma ORM protects against this)
- XSS prevention (React auto-escapes, sanitize user-generated content)
- CSRF protection for state-changing operations
- File upload validation (type, size, virus scanning)

### Privacy & Compliance
- GDPR-inspired data protection principles
- Data minimization - collect only necessary information
- Right to access and delete personal data
- Audit trail for sensitive operations (health records, financial transactions)
- Regular security assessments and penetration testing

### Infrastructure Security
- Container scanning for vulnerabilities
- Regular dependency updates (npm audit, dependabot)
- Environment-specific configuration (secrets management)
- Backup and disaster recovery procedures
- Logging and monitoring (ELK stack or similar)

## 12. Deployment Approach

### Staging Environment
- Mirror of production with sanitized data
- Automated deployment on push to `staging` branch
- Smoke tests after deployment
- Manual approval required for production promotion

### Production Deployment
- Blue-green deployment strategy
- Database migrations handled separately with rollback plans
- Feature flags for gradual rollout
- Health checks and automated rollback on failure
- CDN for static assets (Next.js built-in)
- SSL certificates via Let's Encrypt
- Monitoring: Application performance (New Relic/Datadog), error tracking (Sentry)
- Logging: Centralized logging with log retention and alerting

### CI/CD Pipeline
1. Code push to feature branch
2. Run unit and lint tests
3. Build Docker images
4. Push images to container registry
5. Deploy to staging on merge to main
6. Run integration and smoke tests
7. Manual approval for production
8. Deploy to production with blue-green strategy
9. Post-deployment validation and monitoring

### Environment Variables
- Separate `.env` files for development, staging, production
- Secrets management via Doppler/AWS Secrets Manager or similar
- Critical secrets never committed to repository

## 13. Third-Party Integrations Planned

### Payment Gateways
- M-Pesa API (Safaricom)
- Airtel Money API
- PayPal/Payoneer for international transactions

### Communication
- Africa's Talking for SMS and Voice
- SendGrid or AWS SES for email
- WhatsApp Business API for customer communication

### Mapping & Location
- Google Maps API or OpenStreetMap for location services
- Geocoding for address validation

### Analytics
- Google Analytics 4 for web analytics
- Mixpanel or Amplitude for product analytics
- Custom analytics dashboard in admin panel

### Verification & Trust
- Integration with Kenya Veterinary Board for vet verification
- Integration with livestock registration databases
- Government API integration for disease outbreak alerts

---
*This document serves as the Phase 0 architectural blueprint for OleraiRanchly. All subsequent development phases will adhere to this plan, with adjustments made only through formal change control processes.*