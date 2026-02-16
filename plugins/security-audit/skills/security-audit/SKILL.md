---
name: security-audit
description: Comprehensive cybersecurity audit for web applications. USE WHEN reviewing apps for vulnerabilities, hardening security, auditing auth/API/DB/infra, or performing penetration-style code review. Follows OWASP Top 10, NIST 800-53, and real-world red team methodologies.
---

# Security Audit - Hardened Cybersecurity Review

**Performs elite-level security audits** modeled on the methodologies of top penetration testers, red teamers, and application security engineers. This is not a surface-level scan - it traces data flows, identifies logic flaws, and catches the subtle vulnerabilities that automated tools miss.

---

## Audit Philosophy

**Think like an attacker, report like a defender.**

1. **Assume breach** - Every input is hostile. Every boundary is a target.
2. **Follow the data** - Trace every user-controlled value from entry to storage to output.
3. **Question trust boundaries** - Where does client trust end and server validation begin?
4. **Chain weaknesses** - A "low" finding + another "low" = a critical exploit chain.
5. **Prove it or drop it** - Every finding must include the vulnerable code path, not just theory.

---

## Audit Scope & Checklist

### TIER 1: CRITICAL (Must Audit First)

#### A1 - Authentication & Session Management
- [ ] Password hashing algorithm and cost factor (bcrypt 12+ rounds, argon2id preferred)
- [ ] Session token entropy (minimum 128 bits / 32 bytes crypto.randomBytes)
- [ ] Session fixation prevention (regenerate on login/privilege change)
- [ ] Session expiration and absolute timeout (not just idle)
- [ ] Credential stuffing protection (rate limiting on login endpoints)
- [ ] Password reset flow (token expiry, single-use, no user enumeration)
- [ ] JWT implementation flaws (alg:none, weak secrets, missing expiry, token size)
- [ ] Cookie security flags (HttpOnly, Secure, SameSite=Lax minimum)
- [ ] Account lockout / brute force protection
- [ ] Multi-factor authentication presence for admin/sensitive operations

#### A2 - Injection Attacks
- [ ] SQL injection via string concatenation or template literals in queries
- [ ] SQL injection via dynamic ORDER BY, LIMIT, table/column names
- [ ] NoSQL injection (if applicable)
- [ ] Command injection via exec/spawn/system calls
- [ ] XSS - Reflected, Stored, DOM-based (check innerHTML usage and unescaped rendering)
- [ ] Server-Side Template Injection (SSTI)
- [ ] Header injection (CRLF in response headers)
- [ ] Path traversal in file operations

#### A3 - Authorization & Access Control
- [ ] Broken Object Level Authorization (BOLA/IDOR) - Can user A access user B's data?
- [ ] Broken Function Level Authorization - Can regular users access admin endpoints?
- [ ] Missing authorization checks on API routes (every route must verify permissions)
- [ ] Privilege escalation paths (horizontal and vertical)
- [ ] Direct object reference in URLs without ownership validation
- [ ] Mass assignment / over-posting (accepting unvalidated fields from request body)

#### A4 - Sensitive Data Exposure
- [ ] Secrets in source code or version control (.env committed, hardcoded API keys)
- [ ] Secrets in client-side bundles (NEXT_PUBLIC_ prefix leaking sensitive values)
- [ ] Error messages leaking stack traces, DB schemas, or internal paths
- [ ] API responses returning more data than the client needs (over-fetching)
- [ ] PII in logs, URLs, or query parameters
- [ ] Missing encryption at rest for sensitive fields (passwords, tokens, PII)
- [ ] Database connection strings with embedded passwords

### TIER 2: HIGH (Must Audit)

#### B1 - API Security
- [ ] Missing rate limiting on sensitive endpoints (login, register, password reset, payments)
- [ ] Missing input validation and sanitization on all API inputs
- [ ] Missing Content-Type validation (accepting unexpected content types)
- [ ] CORS misconfiguration (wildcard origins, credentials with wildcard)
- [ ] Missing CSRF protection on state-changing operations
- [ ] API versioning exposing deprecated/vulnerable endpoints
- [ ] Webhook signature verification (Stripe, GitHub, etc.)
- [ ] Request size limits (prevent DoS via large payloads)

#### B2 - Cryptographic Failures
- [ ] Weak or deprecated hashing (MD5, SHA1 for security purposes)
- [ ] Predictable tokens (Math.random, Date.now, sequential IDs)
- [ ] Missing HMAC verification on signed URLs/tokens
- [ ] Hardcoded encryption keys or IVs
- [ ] Improper use of crypto APIs (ECB mode, no padding, reused nonces)

#### B3 - Server-Side Request Forgery (SSRF)
- [ ] User-controlled URLs fetched server-side without validation
- [ ] DNS rebinding potential on URL validation
- [ ] Internal service URLs accessible via user input
- [ ] RSS/feed/webhook URLs that could target internal networks

#### B4 - Security Misconfiguration
- [ ] Security headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy)
- [ ] Directory listing enabled
- [ ] Default credentials or debug modes in production
- [ ] Unnecessary HTTP methods enabled
- [ ] Source maps exposed in production
- [ ] Next.js specific: _next/data routes exposing server data
- [ ] PM2/process manager exposing management interfaces

### TIER 3: MEDIUM (Should Audit)

#### C1 - Dependency & Supply Chain
- [ ] Known vulnerable dependencies (check package.json versions)
- [ ] Outdated critical packages (Next.js, React, auth libraries)
- [ ] Lock file integrity (bun.lockb or package-lock.json present and committed)
- [ ] Post-install scripts in dependencies
- [ ] Typosquatting risk in dependency names

#### C2 - Business Logic Flaws
- [ ] Race conditions in financial transactions or resource allocation
- [ ] Time-of-check to time-of-use (TOCTOU) vulnerabilities
- [ ] Subscription/payment bypass paths
- [ ] Gift/coupon/promo code abuse potential
- [ ] Email verification bypass
- [ ] Rate/plan enforcement gaps (accessing premium features on free tier)

#### C3 - Infrastructure & Deployment
- [ ] File permissions on sensitive files (.env, deploy scripts, SSH keys)
- [ ] Process running as root unnecessarily
- [ ] Database user privilege scope (principle of least privilege)
- [ ] Firewall rules / exposed ports
- [ ] SSL/TLS configuration
- [ ] Backup encryption and access controls

---

## Severity Rating System

| Rating | Definition | Response Time |
|--------|-----------|---------------|
| **CRITICAL** | Active exploitation possible. Data breach, RCE, auth bypass. | Immediate fix required |
| **HIGH** | Exploitable with moderate effort. Privilege escalation, significant data leak. | Fix within 48 hours |
| **MEDIUM** | Requires specific conditions to exploit. Limited impact. | Fix within 1 week |
| **LOW** | Defense-in-depth improvement. Minimal direct risk. | Fix in next release cycle |
| **INFO** | Best practice recommendation. No direct vulnerability. | Consider for improvement |

---

## Output Format

For each finding, report:

```
### [SEVERITY] Finding Title

**Category:** [Checklist reference, e.g., A2 - Injection]
**File:** [file_path:line_number]
**Confidence:** [CONFIRMED / LIKELY / POSSIBLE]

**Description:**
What the vulnerability is and why it matters.

**Vulnerable Code:**
[Exact code snippet showing the issue]

**Attack Scenario:**
Step-by-step exploitation path.

**Remediation:**
[Fixed code or specific remediation steps]

**References:**
- OWASP/CWE/CVE link if applicable
```

---

## Audit Execution Order

1. **Reconnaissance** - Map all routes, endpoints, middleware, and data flows
2. **Authentication audit** - Review every auth mechanism and session handler
3. **Input tracing** - Follow every user input from request to database/output
4. **Authorization testing** - Verify access controls on every protected resource
5. **Secrets scan** - Check for leaked credentials, keys, tokens in code and config
6. **Dependency review** - Assess third-party package risk
7. **Infrastructure check** - Review deployment, permissions, and configuration
8. **Business logic** - Analyze payment flows, state machines, and race conditions
9. **Report generation** - Compile findings with severity, evidence, and remediation

---

## Red Team Mindset Rules

- **Never trust client-side validation** - Always verify server-side
- **Check the unhappy path** - Error handlers often leak more than success handlers
- **Test null/undefined/empty** - Edge cases in type coercion are goldmines
- **Look at what is NOT there** - Missing middleware, missing checks, missing headers
- **Read the ORM/query builder** - Parameterized != safe if you interpolate into it
- **Middleware order matters** - A misplaced auth check = no auth check
- **Follow the money** - Payment/subscription logic gets the deepest review
- **Check every redirect** - Open redirects enable phishing and token theft
- **Timestamps are not secrets** - Anything time-based is predictable
- **Do not just grep, trace** - Follow the actual execution path, not just keyword matches

---

## Supporting References

- **OWASP Top 10 (2021):** https://owasp.org/Top10/
- **OWASP API Security Top 10:** https://owasp.org/API-Security/
- **CWE Top 25:** https://cwe.mitre.org/top25/
- **NIST 800-53 Rev 5:** Security and Privacy Controls
- **Node.js Security Checklist:** https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html
