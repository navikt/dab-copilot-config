---
applyTo: "**/*.test.kt,**/*.spec.kt,**/*Test.kt,**/*Spec.kt,**/*Spek.kt"
---
# Testing Standards (Kotlin) — ao-oppfolgingskontor override

## Preferred style in this repo
- For new test files, prefer **Kotest** style.
- Existing JUnit5 `@Test` files are valid legacy style — keep file style consistent when editing.
- Use MockK for mocking (`every`/`coEvery`, `verify`/`coVerify`).

## Integration testing
- Prefer **embedded Postgres** and **embedded Kafka** in this repository.
- Do **not** default to Testcontainers here unless explicitly needed and agreed.
- Prioritize fast and deterministic tests suited for local dev and CI runtime.

## Boundaries
### ✅ Always
- Follow existing nearby test conventions before introducing new patterns.
- Cover success and failure paths.
- Keep tests fast and isolated.

### ⚠️ Ask First
- Introducing Testcontainers
- Framework-wide migration from JUnit5 to Kotest in existing files

### 🚫 Never
- Add slow integration infrastructure by default when embedded alternatives exist.
