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

### TypeScript Integration
- Use TypeScript interfaces for props, state, and component definitions
- Leverage React and React-Native's built-in types (`FC`, `PropsWithChildren`, etc.) where possible

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
- Use `@shopify/restyle` to manage themes, colors and spacing
- Implement responsive design with mobile-first approach
- Use Mobile, Tablet and Desktop breakpoints to manage layout on different device classes

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
