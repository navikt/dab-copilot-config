---
applyTo: "**/*graphql*.kt,**/graphql/**/*.kt"
---
# GraphQL Development (Backend)

Use these patterns for Kotlin backend repos with GraphQL.

## Structure
- Keep resolvers in dedicated graphql/query or graphql/mutation packages.
- Keep schema-related types close to resolver domain.
- Prefer small resolvers delegating to services.

## Runtime and auth
- Enforce auth checks in resolvers for protected operations.
- Validate principal/claims before data access.
- Avoid leaking sensitive fields by default.
- Add audit logging for lookups on person data (who looked up what, when, and purpose when available), following repo and legal requirements.

## Data access
- Use existing transaction/repository patterns in the repo.
- Avoid N+1 lookups; batch or prefetch where appropriate.
- Keep resolver logic thin; move business rules to domain/service layer.

## Testing
- Prefer repository-local test conventions.
- For integration tests, use embedded dependencies when repo standard says so.
- Test both happy-path and authorization/validation failures.

## Boundaries
### ✅ Always
- Follow existing GraphQL patterns in the target repo before adding new ones.
- Keep schema changes backward compatible unless explicitly agreed.

### ⚠️ Ask First
- Breaking schema changes (field removals/renames)
- New sensitive fields in GraphQL responses

### 🚫 Never
- Bypass auth checks in resolvers
- Put heavy business logic directly inside resolvers
