# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Angular 22 (standalone components, signals, zoneless, built-in control flow) + Angular CDK Drag & Drop. UI components from Trazo (`@ivantm0/trazo`, Stencil web components) consumed with `CUSTOM_ELEMENTS_SCHEMA`. Persistence in `localStorage`; no backend. Tests with Playwright + axe. Deploy target: Netlify.

## Users

Iván Terol, front-end developer, organising his own day-to-day tasks. Secondary audience: recruiters and tech leads reviewing his portfolio, who open the live app and the repo.

## Product Purpose

A personal kanban board that works offline in the browser: capture a task in seconds, move it across columns, find it again. Success: Iván actually uses it, and a reviewer sees a real Angular app built on his own design system.

## Positioning

Built entirely on Trazo, Iván's own component library: the app is the proof that the design system holds up inside a real product.

## Capabilities and Constraints

- One board with three fixed columns: Por hacer, En curso, Hecho.
- Tasks: title (required), description, priority (baja/media/alta), optional label.
- Search and priority filter.
- Drag and drop between and within columns, with a full keyboard alternative.
- Data lives only in the visitor's browser (`localStorage`).
- Interface language: Spanish.
- Out of scope for v1: multiple boards, custom columns, accounts, sync.

## Brand Commitments

Trazo's tokens and components are the visual authority (colors, type, spacing, radii, motion, light/dark themes). The app must not hard-code colors outside them.

## Product Principles

- Capture is instant: creating a task never takes more than a title.
- Every pointer action has a keyboard equivalent.
- The board is the interface; chrome stays quiet.
- Nothing is lost by accident: destructive actions can be undone.

## Accessibility & Inclusion

WCAG 2.2 AA, verified with axe in light and dark themes; respects `prefers-reduced-motion`.
