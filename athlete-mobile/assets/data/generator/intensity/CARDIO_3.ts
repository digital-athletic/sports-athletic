import { IntensityData } from "@/features/training/models/Intensity";

export const IntensityCARDIO_3: IntensityData = {
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
        advanced: 3,
        professional: 5,
      },
    },
  },
  targetValue: {
    repetition: {
      default: {
        default: 6,
        advanced: 8,
        professional: 10,
      },
    },
  },
};
