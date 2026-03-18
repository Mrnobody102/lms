# NextJS Standards

**Tier:** POWERFUL  
**Category:** Engineering / Frontend  
**Maintainer:** LMS Agent Team

---

## Overview

Guidelines for developing modern, performant, and maintainable frontend applications using Next.js 15, React Server Components, and Tailwind CSS.

## Core Capabilities

- **rsc_optimization**: Utilizing React Server Components for better performance and smaller client-side bundles.
- **app_router_patterns**: Mastering the App Router for complex layouts and nested routing.
- **state_management**: Using Zustand for global client-side state and URL params for UI state.
- **i18n_integration**: Seamlessly integrating `next-intl` for multilingual support.

## Project Structure

- `app/[locale]`: Locale-prefixed dynamic routing.
- `components/ui`: Atomic UI elements (often shared via `@repo/ui`).
- `features/[feature-name]`: Domain-driven component organization.
- `lib/`: Utility functions and API clients.

## Performance

1. Use `next/image` for optimized images.
2. Prefer Server Components by default; use `"use client"` only when interactive state is required.
3. Implement `loading.tsx` and `error.tsx` for all main routes.

## Design

- Adhere to the Glassmorphism and Modern Premium UI design language established in the project.
- Ensure 100% responsiveness using Tailwind breakpoints.
