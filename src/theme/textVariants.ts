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
