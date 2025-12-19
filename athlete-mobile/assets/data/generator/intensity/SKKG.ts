import { IntensityData } from "@/features/training/models/Intensity";

export const IntensitySK_KG: IntensityData = {
  adjustment: {
    repetition: {
      default: {
        default: {
          TOO_EASY: 1,
          SUCCEEDED: 1,
          TOO_HARD: -1,
        },
      },
      m: {
        default: {
          TOO_EASY: 2,
          SUCCEEDED: 1,
          TOO_HARD: -1,
        },
      },
    },
    weightFMax: {
      default: {
        default: {
          TOO_EASY: 5,
          SUCCEEDED: 2.5,
          TOO_HARD: -2.5,
        },
      },
    },
    weightAbsolute: {
      default: {
        default: {
          TOO_EASY: 1,
          SUCCEEDED: 0.5,
          TOO_HARD: -1,
        },
      },
      m: {
        default: {
          TOO_EASY: 1,
          SUCCEEDED: 0.5,
          TOO_HARD: -1,
        },
      },
    },
  },
  startValue: {
    repetition: {
      default: {
        default: 3,
      },
      m: {
        default: 5,
      },
    },
    weight: {
      default: {
        default: 1,
      },
      m: {
        default: 2,
      },
      type: {
        type: "weightAbsolute",
      },
    },
  },
  targetValue: {
    repetition: {
      default: {
        default: 6,
      },
      m: {
        default: 8,
      },
    },
    weight: {
      default: {
        default: 3,
      },
      m: {
        default: 5,
      },
      type: {
        type: "weightAbsolute",
      },
    },
  },
};
