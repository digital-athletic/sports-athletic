export const textVariants = {
  defaults: {
    fontSize: 16,
    color: "onSurface",
  },

  // Page titles
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "onSurface",
    marginBottom: "s",
  },

  largeTitle: {
    fontSize: {
      phone: 24,
      tablet: 32,
    },
    fontWeight: "bold",
    color: "onSurface",
    marginBottom: "xs",
  },

  // Screen headline of a guided flow
  display: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "onSurface",
  },

  // Small uppercase line above a headline
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "onSurfaceVariant",
  },

  // Visible label of a form field
  fieldLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "onSurface",
  },

  // Section titles
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "onSurface",
    marginBottom: "s",
  },

  // Small heading above a group of cards
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "onSurface",
  },

  // Card titles
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "onSurface",
    marginBottom: "s",
  },

  // Body text
  body: {
    fontSize: 16,
    color: "onSurface",
  },

  // Subtitle/Description
  subtitle: {
    fontSize: 16,
    color: "onSurfaceVariant",
  },

  description: {
    fontSize: 16,
    color: "onSurfaceVariant",
    textAlign: "center",
    marginBottom: "xl",
  },

  // Card description
  cardDescription: {
    fontSize: 14,
    color: "onSurfaceVariant",
    marginBottom: "m",
  },

  // Button text
  button: {
    fontSize: 16,
    fontWeight: "600",
    color: "onPrimary",
  },

  buttonSecondary: {
    fontSize: 16,
    fontWeight: "600",
    color: "primary",
  },

  // Labels
  label: {
    fontSize: 16,
    color: "onSurfaceVariant",
  },

  // Small text
  small: {
    fontSize: 14,
    color: "onSurfaceVariant",
  },

  // Extra small text
  xSmall: {
    fontSize: 12,
    color: "onSurfaceVariant",
  },

  // Tab labels
  tabLabel: {
    fontSize: 11,
  },

  // Quick action text
  quickAction: {
    fontSize: 14,
    fontWeight: "600",
    color: "primary",
  },

  // Link text
  link: {
    fontSize: 14,
    fontWeight: "600",
    color: "primary",
  },

  skip: {
    fontWeight: "600",
    fontFamily: "System",
    fontSize: 15,
    lineHeight: 24,
    color: "onSurfaceVariant",
  },
} as const;
