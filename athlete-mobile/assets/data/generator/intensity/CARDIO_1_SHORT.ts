import { IntensityData } from "@/features/training/models/Intensity";

export const IntensityCARDIO_1_SHORT: IntensityData = {
  adjustment: {
    repetition: {
      default: {
        default: {
          TOO_EASY: 1,
          SUCCEEDED: 1,
          TOO_HARD: -2,
        },
      },
    },
  },
  startValue: {
    repetition: {
      default: {
        default: 3,
        advanced: 4,
        professional: 5,
      },
    },
  },
  targetValue: {
    repetition: {
      default: {
        default: 5,
        advanced: 6,
        professional: 8,
      },
    },
  },
};
