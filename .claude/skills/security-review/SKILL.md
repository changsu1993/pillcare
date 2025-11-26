---
name: security-review
description: Security audit for healthcare data protection
version: 1.0.0
permissions:
  - bash
  - file:read
---

# Security Review for Healthcare App

Security audit focused on protecting sensitive health data.

## Security Checks

### 1. Dependency Vulnerabilities
```bash
npm audit --production
```
- Known CVEs in dependencies
- Severity classification
- Update recommendations

### 2. Code Security Scan

**Secrets Detection**
- Hardcoded API keys
- Embedded passwords
- Exposed tokens in code

**Data Exposure**
- Console.log of sensitive data
- Health information in error messages
- Medication data in analytics

**Input Validation**
- User input sanitization
- SQL injection prevention (Supabase)
- XSS prevention

### 3. Authentication & Authorization
- Supabase token storage
- Session management
- Role-based access (parent vs child)
- Family connection verification

### 4. Data Protection
- Medication data handling
- Personal health information (PHI)
- AsyncStorage security
- Network transmission (HTTPS)

### 5. Privacy Compliance
- Data minimization
- User consent flows
- Data deletion capability
- Privacy policy alignment

## Output

| Severity | Action Required |
|----------|-----------------|
| Critical | Fix immediately, block release |
| High | Fix before next release |
| Medium | Fix in next sprint |
| Low | Add to backlog |

## References
- OWASP Mobile Top 10
- HIPAA Guidelines (future consideration)
- React Native Security Best Practices
