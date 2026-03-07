# Templates and Quick Reference

## Error & Exception Registry Template

```
METHOD/CODEPATH          | WHAT CAN GO WRONG           | EXCEPTION TYPE
-------------------------|-----------------------------|-----------------
[method]                 | [failure scenario]          | [specific type]
```

```
EXCEPTION TYPE               | HANDLED?  | HANDLER ACTION         | USER SEES
-----------------------------|-----------|------------------------|------------------
[type]                       | Y/N       | [action or --]         | [message or 500]
```

## Failure Modes Registry Template

```
CODEPATH | FAILURE MODE   | HANDLED? | TEST? | USER SEES?     | LOGGED?
---------|----------------|----------|-------|----------------|--------
[path]   | [how it fails] | Y/N      | Y/N   | Error / Silent | Y/N
```

**CRITICAL GAP** = HANDLED: N + TEST: N + USER SEES: Silent

## Data Flow Tracing Template

```
INPUT --> VALIDATION --> TRANSFORM --> PERSIST --> OUTPUT
  |            |              |            |           |
  v            v              v            v           v
[nil?]    [invalid?]    [exception?]  [conflict?]  [stale?]
[empty?]  [too long?]   [timeout?]    [dup key?]   [partial?]
[wrong    [wrong type?] [OOM?]        [locked?]    [encoding?]
 type?]
```

## Interaction Edge Cases Template

```
INTERACTION          | EDGE CASE              | HANDLED? | HOW?
---------------------|------------------------|----------|--------
[interaction]        | [edge case]            | Y/N      | [mechanism]
```

## Mode Comparison Table

```
                 EXPANSION       HOLD SCOPE      REDUCTION
Scope            Push UP         Maintain        Push DOWN
10x check        Mandatory       Optional        Skip
Platonic ideal   Yes             No              No
Delight opps     5+ items        Note if seen    Skip
Complexity Q     "Big enough?"   "Too complex?"  "Bare minimum?"
Taste calibrate  Yes             No              No
Temporal interr  Full (hr 1-6)   Key decisions   Skip
Observ standard  "Joy to operate" "Can debug?"   "See if broken?"
Deploy standard  Infra as scope  Safe + rollback Simplest possible
Error map        Full + chaos    Full            Critical paths only
Phase 2/3        Map it          Note it         Skip
```

## Completion Summary — Standard

```
- Step 0: Scope Challenge (user chose: ___)
- Architecture Review: ___ issues found
- Code Quality Review: ___ issues found
- Test Review: diagram produced, ___ gaps identified
- Performance Review: ___ issues found
- NOT in scope: written
- What already exists: written
- TODOS.md updates: ___ items proposed to user
- Failure modes: ___ critical gaps flagged
```

## Completion Summary — Mega

```
+====================================================================+
|            MEGA PLAN REVIEW -- COMPLETION SUMMARY                  |
+====================================================================+
| Mode selected        | EXPANSION / HOLD / REDUCTION                |
| System Audit         | [key findings]                              |
| Step 0               | [mode + key decisions]                      |
| Section 1  (Arch)    | ___ issues found                            |
| Section 2  (Errors)  | ___ error paths mapped, ___ GAPS            |
| Section 3  (Security)| ___ issues found, ___ High severity         |
| Section 4  (Data/UX) | ___ edge cases mapped, ___ unhandled        |
| Section 5  (Quality) | ___ issues found                            |
| Section 6  (Tests)   | Diagram produced, ___ gaps                  |
| Section 7  (Perf)    | ___ issues found                            |
| Section 8  (Observ)  | ___ gaps found                              |
| Section 9  (Deploy)  | ___ risks flagged                           |
| Section 10 (Future)  | Reversibility: _/5, debt items: ___         |
+--------------------------------------------------------------------+
| NOT in scope         | written (___ items)                          |
| What already exists  | written                                     |
| Dream state delta    | written                                     |
| Error/exception reg  | ___ methods, ___ CRITICAL GAPS              |
| Failure modes        | ___ total, ___ CRITICAL GAPS                |
| TODOS.md updates     | ___ items proposed                          |
| Delight opportunities| ___ identified (EXPANSION only)             |
| Diagrams produced    | ___ (list types)                            |
| Stale diagrams found | ___                                         |
| Unresolved decisions | ___ (listed below)                          |
+====================================================================+
```
