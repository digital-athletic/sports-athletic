import { IntensityData } from "@/features/training/models/Intensity";

export const IntensitySA: IntensityData = {
  adjustment: {
    repetition: {
      default: {
        default: {
          TOO_EASY: 2,
          SUCCEEDED: 1,
          TOO_HARD: -2,
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
          TOO_EASY: 2,
          SUCCEEDED: 1,
          TOO_HARD: -1,
        },
      },
    },
  },
  startValue: {
    repetition: {
      default: {
        default: 6,
      },
    },
    weight: {
      default: {
        default: 20,
      },
      type: {
        type: "weightFMax",
      },
    },
  },
  targetValue: {
    repetition: {
      default: {
        default: 6,
      },
    },
    weight: {
      default: {
        default: 50,
      },
      type: {
        type: "weightFMax",
      },
    },
  },
};
