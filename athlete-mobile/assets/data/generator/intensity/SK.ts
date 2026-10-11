import { IntensityData } from "@/features/training/models/Intensity";

export const IntensitySK: IntensityData = {
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
        default: 4,
      },
    },
    weight: {
      default: {
        default: 52.5,
        beginner: 52.5,
        advanced: 55,
        professional: 55,
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
        default: 65,
        beginner: 65,
        advanced: 67.5,
        professional: 70,
      },
      type: {
        type: "weightFMax",
      },
    },
  },
};
