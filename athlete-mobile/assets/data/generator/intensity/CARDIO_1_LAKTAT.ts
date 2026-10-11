import { IntensityData } from "@/features/training/models/Intensity";

export const IntensityCARDIO_1_LAKTAT: IntensityData = {
  adjustment: {
    repetition: {
      default: {
        default: {
          TOO_EASY: 1,
          SUCCEEDED: 1,
          TOO_HARD: -1,
        },
      },
    },
  },
  startValue: {
    repetition: {
      default: {
        default: 2,
        advanced: 3,
        professional: 3,
      },
    },
  },
  targetValue: {
    repetition: {
      default: {
        default: 4,
        advanced: 5,
        professional: 6,
      },
    },
  },
};
