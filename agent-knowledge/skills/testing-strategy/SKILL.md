# Testing Strategy

**Tier:** POWERFUL  
**Category:** Engineering / Quality Assurance  
**Maintainer:** LMS Agent Team

---

## Overview

A comprehensive guide to testing the LMS Platform at various levels—Unit, Integration, and End-to-End.

## Core Capabilities

- **jest_unit_testing**: Writing fast, isolated tests for services and utilities.
- **nestjs_integration_testing**: Testing modules with real (or mocked) database connections.
- **playwright_e2e**: Validating complete user journeys across multiple apps.

## Testing Levels

1. **Unit Tests**: Focus on business logic in isolation. Use `ts-jest`.
2. **Integration Tests**: Focus on the boundary between services and Prisma.
3. **E2E Tests**: Use Playwright to test Login, Registration, and Course Management flows.

## Best Practices

- **Mocking**: Use `jest.mock()` for external APIs but prefer real database test instances for Prisma.
- **Coverage**: Aim for high coverage on critical logic (Auth, Payments, Enrollment).
- **Naming**: Tests should read like specifications: `describe("AuthService", () => { it("should register a new user") })`.
