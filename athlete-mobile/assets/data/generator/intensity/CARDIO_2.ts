import { IntensityData } from "@/features/training/models/Intensity";

export const IntensityCARDIO_2: IntensityData = {
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
        professional: 6,
      },
    },
  },
  targetValue: {
    repetition: {
      default: {
        default: 7,
        advanced: 9,
        professional: 12,
      },
    },
  },
};
