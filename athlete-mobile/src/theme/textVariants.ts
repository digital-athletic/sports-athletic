export const textVariants = {
  defaults: {
    fontSize: 16,
    color: "darkGrey3",
  },

  // Page titles
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "darkGrey3",
    marginBottom: "s",
  },

  largeTitle: {
    fontSize: {
      phone: 24,
      tablet: 32,
    },
    fontWeight: "bold",
    color: "darkGrey3",
    marginBottom: "xs",
  },

  // Screen headline of a guided flow
  display: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "darkGrey3",
  },

  // Small uppercase line above a headline
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "darkGrey1",
  },

  // Visible label of a form field
  fieldLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "darkGrey3",
  },

  // Section titles
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "darkGrey3",
    marginBottom: "s",
  },

  // Card titles
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "darkGrey3",
    marginBottom: "s",
  },

  // Body text
  body: {
    fontSize: 16,
    color: "darkGrey3",
  },

  // Subtitle/Description
  subtitle: {
    fontSize: 16,
    color: "darkGrey2",
  },

  description: {
    fontSize: 16,
    color: "darkGrey2",
    textAlign: "center",
    marginBottom: "xl",
  },

  // Card description
  cardDescription: {
    fontSize: 14,
    color: "darkGrey2",
    marginBottom: "m",
  },

  // Button text
  button: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },

  buttonSecondary: {
    fontSize: 16,
    fontWeight: "600",
    color: "primary",
  },

  // Labels
  label: {
    fontSize: 16,
    color: "darkGrey2",
  },

  // Small text
  small: {
    fontSize: 14,
    color: "darkGrey2",
  },

  // Extra small text
  xSmall: {
    fontSize: 12,
    color: "darkGrey2",
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
    color: "darkGrey1",
  },
} as const;
