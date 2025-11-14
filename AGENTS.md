# AGENTS

This file provides guidance to AI Agents for building high-quality React Native applications with modern patterns, hooks, and best practices following the official React documentation at https://react.dev and React Native documentation at https://reactnative.dev/

## Project Context
- `react` version 19.1.0
- `react-native` version 0.81.5
- `expo` version 54.0.23
- `typescript` version 5.9.2 for type safety
- Follow React and React Native's official style guide and best practices

## Development Standards

### Architecture
- Use functional components with hooks as the primary pattern
- Implement component composition over inheritance
- Organize components by feature for scalability
- Separate presentational and container components clearly
- Use custom hooks for reusable stateful logic
- Implement proper component hierarchies with clear data flow

### Imports and exports
- There should not be index files that only serve the purpose of reexporting other modules of the folder or its sub folders
- Prefer named imports over namespaces (e.g. `import { useState } from "react"` instead of using `React.useState`)
- Import React types directly (e.g. `import { type FC } from "react"`) instead of using the namespace prefix (avoid `React.FC`)

### TypeScript Integration
- Use TypeScript interfaces for props, state, and component definitions
- Leverage React and React-Native's built-in types (`FC`, `PropsWithChildren`, etc.) by importing them directly
- Use `type` imports for types when possible (e.g. `import { type FC } from "react"`)

### Component Design
- Keep components small and focused on a single concern
- Use descriptive and consistent naming conventions
- Design components to be testable and reusable

### State Management
- Use `useState` for simple local component state
- Use `useReducer` for more complex local component state
- Leverage `useContext` for sharing simple state across component trees
- Use `@tanstack/react-query` for server state management

### Hooks and Effects
- Use `useEffect` with proper dependency arrays
- Implement cleanup functions in effects to avoid memory leaks
- Create custom hooks for for sharing reusable logic across components
- Follow the rules of hooks (only call at the top level)
- Use `useRef` for accessing DOM elements and storing mutable values

### Styling & Theming
- This project uses [@shopify/restyle](https://github.com/Shopify/restyle) for a type-safe, consistent theming approach throughout the application.
- Components should be responsive with a mobile-first approach
- Breakpoints should be used to manage layout across different devices

### Internationalization (i18n)
- This project uses [react-i18next](https://react.i18next.com/) for type-safe translations throughout the application
- Components should access the translations via the `useTranslation` hook and all text content should be located in the `src/i18n/locales` translation files
- When migrating components from the `/legacy` folder any text must be added to the translation files

### Accessibility
- Leverage the react native accessibility APIs (https://reactnative.dev/docs/accessibility) to support assitive technologies
- Implement proper ARIA attributes and roles
- Provide alt text for images and descriptive text for icons
- Implement proper color contrast ratios
- Code with screen readers and accessibility tools in mind

### Testing
- Use Jest as test runner and assertion library
- Write unit tests for business logic
- Write component tests using React Testing Library
- Test component behavior, not implementation details
- Mock external dependencies and API calls appropriately
- Ensure accessibility features are included in testing specs

## File & Directory Rules
- The `/legacy` directory is **read-only**.  
  - It should only be **referenced** for understanding existing logic or data structures.
  - The AI **must not modify, move, or create files** in `/legacy`.
- All **new code** (components, screens, hooks, utils, etc.) should be created inside the `/app` directory.

## Documentation
- Comments for components and functions should be concise. Comments should not exceed 3 lines in most cases.
