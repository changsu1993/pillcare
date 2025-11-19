# PillCare Project - Installed Agents

**Total Installed:** 16 specialized agents
**Installation Date:** 2025-11-19

## 📋 How to Use Agents

In Claude Code, simply mention the agent name or ask for their expertise:

```
"Hey @mobile-developer, create the medication reminder screen"
"@security-auditor, review the authentication code"
"@product-strategist, analyze our market positioning"
```

---

## Phase 1: Planning & Design (3 agents)

### 1. Product Strategist
**File:** `agents/product-strategist.md`
**Model:** Opus
**Use for:**
- Market analysis (TAM/SAM sizing, competitive landscape)
- Product positioning and differentiation strategy
- Feature prioritization (impact vs. effort)
- Go-to-market strategy for elderly care market
- Growth strategy and expansion planning

**Example prompts:**
- "Analyze the elderly medication management market"
- "Create a product roadmap for Q1-Q2"
- "What's our competitive advantage vs. existing apps?"

---

### 2. UI/UX Designer
**File:** `agents/ui-ux-designer.md`
**Model:** Sonnet
**Use for:**
- User research and elderly user persona creation
- Wireframes for parent app (large buttons, high contrast)
- Design system for accessibility (WCAG compliance)
- Prototyping medication reminder flows
- Usability testing with elderly users

**Example prompts:**
- "Design the medication reminder notification screen"
- "Create a design system for elderly users"
- "How should we handle medication logging UX?"

---

### 3. Business Analyst
**File:** `agents/business-analyst.md`
**Model:** Sonnet
**Use for:**
- User needs analysis (elderly patients + caregivers)
- Requirements documentation
- User journey mapping
- Success metrics definition (adherence rates, engagement)

**Example prompts:**
- "What are the key pain points for elderly medication users?"
- "Define success metrics for MVP launch"

---

## Phase 2: Core Development (5 agents)

### 4. Mobile Developer
**File:** `agents/mobile-developer.md`
**Model:** Sonnet
**Specialization:** React Native, Flutter, cross-platform
**Use for:**
- React Native component architecture
- Push notification implementation (FCM)
- Offline-first data synchronization
- Deep linking for medication reminders
- iOS/Android platform-specific features
- Performance optimization for older devices

**Example prompts:**
- "Create a medication list component with offline sync"
- "Implement local push notifications for medication times"
- "Optimize app performance for devices 3+ years old"

---

### 5. Frontend Developer
**File:** `agents/frontend-developer.md`
**Model:** Sonnet
**Specialization:** React, TypeScript, accessibility
**Use for:**
- Reusable React components with TypeScript
- State management (Context API, Zustand)
- Accessibility (WCAG AAA compliance for elderly users)
- Responsive design (mobile-first)
- Performance optimization (lazy loading, memoization)

**Example prompts:**
- "Build an accessible medication schedule calendar"
- "Create a high-contrast theme for elderly users"
- "Implement voice navigation for the parent app"

---

### 6. Backend Architect
**File:** `agents/backend-architect.md`
**Model:** Sonnet
**Use for:**
- RESTful API design (medication CRUD, user management)
- Microservice boundary definition (notification service, user service)
- Database schema design with Supabase/PostgreSQL
- Caching strategies (Redis for medication schedules)
- Security (JWT authentication, rate limiting)

**Example prompts:**
- "Design the medication reminder API endpoints"
- "How should we structure the family connection system?"
- "Design a scalable notification service architecture"

---

### 7. Database Architect
**File:** `agents/database-architect.md`
**Model:** Opus
**Use for:**
- Entity-relationship modeling (users, medications, logs, family connections)
- PostgreSQL schema design with Supabase
- Indexing strategies for medication queries
- Data migration planning
- HIPAA-compliant audit trails

**Example prompts:**
- "Design the medication database schema with relationships"
- "How should we handle recurring medication schedules?"
- "Create an audit trail for medication changes"

---

### 8. Fullstack Developer
**File:** `agents/fullstack-developer.md`
**Model:** Opus
**Use for:**
- End-to-end feature implementation
- Frontend + backend integration
- Authentication systems (JWT, OAuth2)
- API design with TypeScript types
- Complete user flows (signup → medication → notifications)

**Example prompts:**
- "Implement the complete medication logging feature"
- "Build the family invitation system end-to-end"
- "Create authentication with email and social login"

---

## Phase 3: Testing & Security (5 agents)

### 9. Test Engineer
**File:** `agents/test-engineer.md`
**Model:** Sonnet
**Use for:**
- Test pyramid strategy (unit, integration, E2E)
- Jest unit tests for React components
- Playwright E2E tests
- Accessibility testing (screen reader compatibility)
- CI/CD test automation

**Example prompts:**
- "Write tests for the medication reminder notification"
- "Create E2E test for the medication logging flow"
- "Test accessibility with screen readers"

---

### 10. Security Auditor
**File:** `agents/security-auditor.md`
**Model:** Opus
**Use for:**
- OWASP Top 10 vulnerability scanning
- HIPAA compliance verification
- Authentication/authorization review (JWT, OAuth2)
- Data encryption validation (at rest and in transit)
- SQL injection prevention
- API security headers

**Example prompts:**
- "Audit the medication API for security vulnerabilities"
- "Ensure HIPAA compliance for PHI storage"
- "Review authentication implementation for weaknesses"

---

### 11. Code Reviewer
**File:** `agents/code-reviewer.md`
**Model:** Sonnet
**Use for:**
- Code quality assessment
- Naming conventions verification
- Error handling review
- Performance optimization suggestions
- Test coverage analysis

**Example prompts:**
- "Review the medication reminder service code"
- "Check for code duplication in React components"
- "Analyze error handling in the backend API"

---

### 12. Debugger
**File:** `agents/debugger.md`
**Model:** Sonnet
**Use for:**
- Root cause analysis for bugs
- Stack trace interpretation
- Systematic debugging methodology
- Fix validation and testing

**Example prompts:**
- "Debug: Medication notifications not firing on iOS"
- "Why is the medication list not syncing offline?"
- "Fix: App crashes when adding new medication"

---

### 13. React Performance Optimizer
**File:** `agents/react-performance-optimizer.md`
**Model:** Sonnet
**Use for:**
- Concurrent React features (startTransition, Suspense)
- Rendering optimization (React.memo, useMemo, useCallback)
- Bundle size reduction (code splitting, lazy loading)
- Core Web Vitals improvement
- Memory leak detection

**Example prompts:**
- "Optimize the medication list rendering for 100+ items"
- "Reduce initial app bundle size"
- "Fix memory leak in notification listener"

---

## Phase 4: DevOps & Deployment (3 agents)

### 14. Cloud Architect
**File:** `agents/cloud-architect.md`
**Model:** Opus
**Use for:**
- HIPAA-compliant cloud infrastructure (AWS/GCP/Azure)
- Infrastructure as Code (Terraform)
- Supabase production setup
- Cost optimization (FinOps)
- Disaster recovery planning
- VPC design and security

**Example prompts:**
- "Design HIPAA-compliant AWS architecture for PillCare"
- "Set up Supabase production environment with backups"
- "Estimate monthly cloud costs for 10,000 users"

---

### 15. Deployment Engineer
**File:** `agents/deployment-engineer.md`
**Model:** Sonnet
**Use for:**
- CI/CD pipeline setup (GitHub Actions)
- Docker containerization
- Expo/EAS Build configuration
- App Store and Play Store deployment automation
- Environment variable management
- Zero-downtime deployment strategies

**Example prompts:**
- "Set up GitHub Actions for automated app builds"
- "Configure EAS Build for iOS and Android"
- "Automate TestFlight beta deployments"

---

### 16. DevOps Engineer
**File:** `agents/devops-engineer.md`
**Model:** Sonnet
**Use for:**
- Complete DevOps pipeline setup
- Kubernetes orchestration (if needed)
- Monitoring and logging (Sentry, LogRocket)
- Secrets management
- Infrastructure automation

**Example prompts:**
- "Set up error monitoring with Sentry"
- "Configure production logging for backend services"
- "Implement health checks for API endpoints"

---

## 🎯 Quick Reference: When to Use Which Agent

### Planning Phase
- **Product decisions** → Product Strategist
- **User research** → Business Analyst
- **Interface design** → UI/UX Designer

### Development Phase
- **Mobile app features** → Mobile Developer
- **Frontend components** → Frontend Developer
- **Backend APIs** → Backend Architect
- **Database design** → Database Architect
- **Full features** → Fullstack Developer

### Quality Assurance Phase
- **Writing tests** → Test Engineer
- **Code review** → Code Reviewer
- **Performance issues** → React Performance Optimizer
- **Bugs** → Debugger
- **Security** → Security Auditor

### Deployment Phase
- **Cloud setup** → Cloud Architect
- **CI/CD** → Deployment Engineer
- **Production operations** → DevOps Engineer

---

## 💡 Pro Tips

1. **Combine agents for complex tasks:**
   - "Let's get @ui-ux-designer to design the screen, then @mobile-developer to implement it"

2. **Use agents for validation:**
   - After writing code: "@code-reviewer, check this implementation"
   - Before deployment: "@security-auditor, scan for vulnerabilities"

3. **Leverage specialized knowledge:**
   - Each agent has deep expertise in their domain
   - They can provide best practices, code templates, and architectural guidance

4. **Sequential workflows:**
   - Design (@ui-ux-designer) → Implement (@mobile-developer) → Test (@test-engineer) → Review (@code-reviewer)

---

**Last Updated:** 2025-11-19
**Claude Code Version:** Latest
**Template Source:** https://github.com/davila7/claude-code-templates
