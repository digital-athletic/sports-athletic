---
agent: agent
name: migrate-legacy-component
description: Migrates Flow/JS class component to TypeScript FC
argument-hint: Provide the legacy component code to be migrated.
---

Goal: Migrate a legacy React class component written in Flow / JS to a new functional component written in TypeScript (version 5.9.2) with hooks.

Requirements:
- The new component must use React hooks instead of class lifecycle methods.
- Reusable logic should be extracted into custom hooks where appropriate.
- The new component must be fully typed with TypeScript, including props and state.

Migration Guidelines:
- Any static text must be added to the translation files
- Any colors must be imported from the theme via the `useTheme` hook from `@src/theme/theme`
- Use the `<Box />` component from `@src/theme/Box` instead of `<View />` for layout containers
- Use `useResponsiveProp` from `@shopify/restyle` for responsive sizing based on screen size (phone/tablet/desktop breakpoints)
- Only expose props the original component had
- Keep the component API minimal and match the original prop signature
- Changes **must** adhere to the project's development standards as outlined in the AGENTS.md file