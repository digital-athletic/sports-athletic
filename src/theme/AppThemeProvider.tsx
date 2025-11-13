import { ThemeProvider as RestyleThemeProvider } from "@shopify/restyle";
import { FC, PropsWithChildren } from "react";
import { theme } from "./index";

/**
 * Theme Provider
 *
 * Wraps the app with the Restyle theme context.
 * This should be placed at the root of your app.
 *
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export const AppThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  return <RestyleThemeProvider theme={theme}>{children}</RestyleThemeProvider>;
};
