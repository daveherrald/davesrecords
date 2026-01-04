# Code Review

Review recent changes for issues before committing.

## Context
```bash
git diff
```

## Instructions

Run these review checks in parallel using subagents:

1. **Security Review**: Check for security issues - exposed secrets, SQL injection, XSS, auth bypasses, information leakage in error messages
2. **Type Safety**: Verify TypeScript types are correct, no `any` types where avoidable, proper null handling
3. **Taxonomy Compliance**: Ensure terminology aligns with docs/taxonomy.md (Release not Album, etc.)
4. **API Consistency**: Check API responses follow existing patterns, proper error handling, correct status codes

After the parallel reviews complete, summarize:
- Critical issues (must fix)
- Warnings (should consider)
- Suggestions (nice to have)

If no issues found, say so clearly.
