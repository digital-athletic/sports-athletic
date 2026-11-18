import { createTheme, useTheme as useRestyleTheme } from "@shopify/restyle";
import { colors, darkColors } from "./colors";
import { textVariants } from "./textVariants";

export const theme = createTheme({
  colors,
  borderRadii: {
    none: 0,
    s: 4,
    m: 8,
    l: 12,
    xl: 16,
    round: 9999,
  },

  spacing: {
    none: 0,
    xs: 5,
    s: 10,
    m: 15,
    l: 20,
    xl: 30,
    xxl: 40,
  },

  breakpoints: {
    phone: 0,
    tablet: 768,
    desktop: 1024,
  },

  textVariants,

  cardVariants: {
    defaults: {
      backgroundColor: "white",
      padding: "l",
      borderRadius: "l",
      shadowColor: "darkGrey3",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },

    elevated: {
      backgroundColor: "white",
      padding: "l",
      borderRadius: "l",
      shadowColor: "darkGrey3",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },

    flat: {
      backgroundColor: "white",
      padding: "l",
      borderRadius: "m",
    },

    // Bordered card of the redesigned screens, matching the choice cards.
    // The defaults add padding and a shadow, so this variant resets both.
    outlined: {
      backgroundColor: "white",
      padding: "none",
      borderWidth: 1.5,
      borderColor: "lightGrey2",
      borderRadius: "xl",
      shadowOpacity: 0,
      elevation: 0,
    },
  },

  buttonVariants: {
    primary: {
      backgroundColor: "primary",
      padding: "m",
      borderRadius: "m",
      alignItems: "center",
    },

    // Main action of a guided flow
    cta: {
      backgroundColor: "primary",
      paddingHorizontal: "l",
      minHeight: 56,
      borderRadius: "round",
      alignItems: "center",
      justifyContent: "center",
    },

    // Second action next to a cta
    ctaOutline: {
      backgroundColor: "white",
      paddingHorizontal: "l",
      minHeight: 56,
      borderRadius: "round",
      borderWidth: 1.5,
      borderColor: "primary",
      alignItems: "center",
      justifyContent: "center",
    },

    secondary: {
      backgroundColor: "white",
      padding: "m",
      borderRadius: "m",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "primary",
    },

    success: {
      backgroundColor: "success",
      padding: "m",
      borderRadius: "m",
      alignItems: "center",
    },

    quickAction: {
      backgroundColor: "lightGrey1",
      padding: "s",
      borderRadius: "m",
      minWidth: 100,
      alignItems: "center",
    },
  },

  inputVariants: {
    defaults: {
      backgroundColor: "lightGrey2",
      borderWidth: 1,
      borderColor: "lightGrey2",
      borderRadius: "m",
      padding: "m",
      fontSize: 16,
      color: "darkGrey3",
    },

    focused: {
      backgroundColor: "lightGrey2",
      borderWidth: 1,
      borderColor: "primary",
      borderRadius: "m",
      padding: "m",
      fontSize: 16,
      color: "darkGrey3",
    },
  },
});

export type Theme = typeof theme;
export type ThemeColor = keyof Theme["colors"];

// Not used by the app yet, prepared for app-wide dark mode
export const darkTheme: Theme = { ...theme, colors: darkColors };

export const useTheme = useRestyleTheme<Theme>;
