import { createTheme } from "@shopify/restyle";
import { colors } from "./colors";
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
      backgroundColor: "cardBackground",
      padding: "l",
      borderRadius: "l",
      shadowColor: "shadow",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },

    elevated: {
      backgroundColor: "cardBackground",
      padding: "l",
      borderRadius: "l",
      shadowColor: "shadow",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },

    flat: {
      backgroundColor: "cardBackground",
      padding: "l",
      borderRadius: "m",
    },
  },

  buttonVariants: {
    primary: {
      backgroundColor: "primary",
      padding: "m",
      borderRadius: "m",
      alignItems: "center",
    },

    secondary: {
      backgroundColor: "mainBackground",
      padding: "m",
      borderRadius: "m",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "borderPrimary",
    },

    success: {
      backgroundColor: "success",
      padding: "m",
      borderRadius: "m",
      alignItems: "center",
    },

    quickAction: {
      backgroundColor: "buttonSecondaryBackground",
      padding: "s",
      borderRadius: "m",
      minWidth: 100,
      alignItems: "center",
    },
  },

  inputVariants: {
    defaults: {
      backgroundColor: "inputBackground",
      borderWidth: 1,
      borderColor: "border",
      borderRadius: "m",
      padding: "m",
      fontSize: 16,
      color: "textPrimary",
    },

    focused: {
      backgroundColor: "inputBackground",
      borderWidth: 1,
      borderColor: "borderFocus",
      borderRadius: "m",
      padding: "m",
      fontSize: 16,
      color: "textPrimary",
    },
  },
});

export type Theme = typeof theme;
