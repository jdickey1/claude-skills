---
name: security-audit
description: Comprehensive cybersecurity audit for web applications. USE WHEN reviewing apps for vulnerabilities, hardening security, auditing auth/API/DB/infra, or performing penetration-style code review. Follows OWASP Top 10, NIST 800-53, and real-world red team methodologies.
version: 1.0.0
effort: high
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

**Automated baseline:** Run `/quick-security-scan {project}` first for instant header checks.

- [ ] Security headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy) — `/quick-security-scan` covers these
- [ ] Directory listing enabled
- [ ] Default credentials or debug modes in production
- [ ] Unnecessary HTTP methods enabled
- [ ] Source maps exposed in production (`curl https://{domain}/_next/static/*.js.map`)
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

**Delegate to vps-ops tools for automated checks:**
- `/post-deploy-verify {project}` — PM2 health, port binding, public URL, logs
- `/quick-security-scan {project}` — security headers across all projects
- `/email-security-audit {project}` — SPF/DKIM/DMARC/CAA verification (uses MCP tools)
- `dns_check_propagation({domain}, "CAA")` — verify CAA records for cert issuance

**Manual checks (not yet automated):**
- [ ] File permissions on sensitive files (.env, deploy scripts, SSH keys)
- [ ] Process running as root unnecessarily
- [ ] Database user privilege scope (principle of least privilege)
- [ ] Firewall rules / exposed ports (`ss -tlnp` + compare to port-check.sh)
- [ ] SSL/TLS configuration (cert expiry, protocol versions)
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

## Confidence Levels

Every finding MUST include a confidence level:

| Level | Definition | Evidence Required |
|-------|-----------|-------------------|
| **CONFIRMED** | Attack chain traced end-to-end; exploitable | Code path shown, input→output demonstrated |
| **LIKELY** | Vulnerable pattern detected but not exhaustively traced | Code pattern identified, similar to known CVE |
| **POSSIBLE** | Suspicious pattern, may be false positive | Pattern match only, needs manual verification |

**Rules:**
- CRITICAL severity requires CONFIRMED or LIKELY confidence — never POSSIBLE
- POSSIBLE findings are capped at MEDIUM severity
- If you can't demonstrate the attack chain, downgrade confidence

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

## Binary Audit Checks

**EVAL 1: Evidence-backed findings**
Question: Does every finding include file:line evidence?
Pass: All findings point to specific code locations with line numbers
Fail: Any finding is theoretical without code evidence

**EVAL 2: Confidence assigned**
Question: Does every finding include a confidence level (CONFIRMED/LIKELY/POSSIBLE)?
Pass: All findings explicitly state confidence
Fail: Any finding lacks confidence level

**EVAL 3: Attack chain described**
Question: Does every HIGH+ finding describe the attack chain?
Pass: CRITICAL and HIGH findings show input→vulnerability→impact
Fail: Any HIGH+ finding just names the vulnerability without showing exploitation path

**EVAL 4: Remediation specific**
Question: Does every finding include a specific fix?
Pass: All findings have code-level remediation ("change X to Y on line Z")
Fail: Any finding says "fix this" without showing how

**EVAL 5: No phantom findings**
Question: Are all findings verified against actual code, not assumptions?
Pass: Every finding references code that exists in the codebase
Fail: Any finding references code patterns that don't exist

---

## Audit Execution Order

**Phase 0 (Quick Baseline — run first, 30 seconds):**
```
/quick-security-scan {project}
```
Gets instant security header status. Identifies obvious misconfigurations before deep audit.

**Parallelizable phases (launch as subagents for 3-4x speedup):**

| Subagent | Phases | Tools |
|----------|--------|-------|
| Infrastructure | 7 (infra) | `/post-deploy-verify`, `/email-security-audit`, MCP tools |
| Dependencies | 6 (deps) | `npm audit`, lock file check |
| Secrets | 5 (secrets) | grep patterns across codebase |
| App Security | 1-4, 8 (main audit) | Code review, input tracing |

**Sequential execution (if not parallelizing):**

1. **Reconnaissance** - Map all routes, endpoints, middleware, and data flows
2. **Authentication audit** - Review every auth mechanism and session handler
3. **Input tracing** - Follow every user input from request to database/output
4. **Authorization testing** - Verify access controls on every protected resource
5. **Secrets scan** - Check for leaked credentials, keys, tokens in code and config
6. **Dependency review** - Assess third-party package risk
7. **Infrastructure check** - Review deployment, permissions, and configuration (delegate to vps-ops where possible)
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

---

## Escalation Protocol

**STOP and ask the user before proceeding when:**
- A CRITICAL finding with CONFIRMED confidence requires immediate production changes
- Remediation for a finding would break existing functionality or require downtime
- Scope needs to expand beyond the originally agreed target (e.g., discovering a connected service that also needs review)
- Unclear whether active exploitation testing is authorized (e.g., testing auth bypass, injecting payloads)
- Two findings interact to create a potential exploit chain — confirm severity escalation before reporting as combined CRITICAL
- A false positive rate for a category exceeds 50% — reassess methodology before continuing

**Do NOT escalate (handle autonomously):**
- Adding findings at any severity with supporting evidence
- Downgrading confidence when evidence is insufficient
- Skipping checklist items that don't apply to the target stack

## Completion Status

When the audit is complete, report:

```
AUDIT COMPLETE: {project}
═══════════════════════════
Scope: {files/routes/endpoints reviewed}
Findings: {count by severity — CRITICAL: N, HIGH: N, MEDIUM: N, LOW: N, INFO: N}
Confidence: {count by level — CONFIRMED: N, LIKELY: N, POSSIBLE: N}
Coverage: {checklist tiers completed — T1: ✓/✗, T2: ✓/✗, T3: ✓/✗}
Top risk: {one-sentence summary of highest-severity finding}
Remediation: {count of findings with specific code fixes provided}
═══════════════════════════
```

## Verification of Claims

- **Every finding must cite a file path and line number.** No theoretical findings.
- **Severity requires evidence threshold:** CRITICAL needs CONFIRMED or LIKELY confidence with a demonstrated attack chain. POSSIBLE findings are capped at MEDIUM.
- **"Not found" claims must show search evidence:** If reporting a vulnerability class is absent, cite the grep/search commands used to verify.
- **External references (OWASP, CWE, CVE) must be specific:** Cite the exact ID (e.g., CWE-89), not just "OWASP Top 10."
- **Remediation code must be tested or clearly marked as untested.** Never present a fix as verified unless you confirmed it compiles/runs.

---

## Gotchas
- **CONFIRMED requires a full exploit path** — Finding vulnerable code isn't enough. Trace: user input → vulnerable function → impact. If any link is missing, downgrade to LIKELY or POSSIBLE.
- **CRITICAL severity requires CONFIRMED or LIKELY confidence** — Never combine CRITICAL severity with POSSIBLE confidence. If evidence is insufficient, cap at MEDIUM.
- **Don't report absence as vulnerability** — "Missing CSRF protection" without reading the form submission code is a phantom finding. CSRF may be handled via SameSite cookies or framework middleware. Read the code path before reporting.

## Learning

When this skill runs, append observations to `.learnings.jsonl`:

```json
{"timestamp": "ISO-8601", "skill": "security-audit", "event_type": "user_correction", "context": "Finding rated CRITICAL was actually mitigated by WAF — downgraded to INFO"}
{"timestamp": "ISO-8601", "skill": "security-audit", "event_type": "edge_case", "context": "SQL injection in ORM-wrapped query — pattern matched but not exploitable"}
```

Track these patterns:
- False positive rate by confidence level (especially POSSIBLE findings)
- Which checklist items produce the most actionable findings?
- OWASP category distribution — are reports over-weighted toward certain categories?
- How often does the user override severity or confidence ratings?
