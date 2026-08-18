# ADR 0001: MVP Architecture

## Decision

Use a Next.js full-stack modular monolith with TypeScript, PostgreSQL, Prisma, Tailwind CSS, Docker Compose, and mock payment.

## Context

The MVP is for a Thai fashion marketplace with a small team and early validation goal. It needs customer, seller, and admin flows without microservice overhead.

## Consequences

- Faster iteration and simpler deployment.
- Stronger discipline needed around module boundaries.
- Backend can be extracted later if traffic or integration complexity demands it.
