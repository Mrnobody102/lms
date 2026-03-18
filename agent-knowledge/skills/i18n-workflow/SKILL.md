# i18n Workflow

**Tier:** POWERFUL  
**Category:** Engineering / Productivity  
**Maintainer:** LMS Agent Team

---

## Overview

Standard procedure for managing and extending multi-language support (Internationalization) using `next-intl` throughout the Monorepo.

## Core Capabilities

- **locale_key_management**: Keeping `vi.json` and `en.json` files synchronized.
- **localized_navigation**: Using utility hooks (`useRouter`, `Link`) from the i18n config instead of default Next.js ones.
- **dynamic_message_resolution**: Handling error messages and dynamic strings flexibly.

## Language Files

- Path: `src/messages/`.
- Must update both Vietnamese (`vi.json`) and English (`en.json`) simultaneously.
- Variable syntax: `t("key", { variable: value })`.

## Best Practices

1. **Static Assets**: Ensure `favicon.ico` and fonts are not blocked by the i18n middleware (usually kept in `public/`).
2. **Context Scope**: Use clear scopes in `useTranslations("Scope")` to avoid key collisions.
3. **Locale-aware routing**: Avoid hardcoding `/vi/about`; use the `Link` component wrapped by `next-intl`.
