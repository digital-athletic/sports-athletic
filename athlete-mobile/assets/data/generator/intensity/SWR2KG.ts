import { IntensityData } from "@/features/training/models/Intensity";

export const IntensitySWR_2_KG: IntensityData = {
  overridesExerciseRepsAndDuration: true,
  adjustment: {
    duration: {
      default: {
        default: {
          TOO_EASY: 10,
          SUCCEEDED: 5,
          TOO_HARD: -10,
        },
        beginner: {
          TOO_EASY: 10,
          SUCCEEDED: 5,
          TOO_HARD: -10,
        },
        advanced: {
          TOO_EASY: 10,
          SUCCEEDED: 5,
          TOO_HARD: -10,
        },
        professional: {
          TOO_EASY: 10,
          SUCCEEDED: 5,
          TOO_HARD: -10,
        },
      },
      k: {
        default: {
          TOO_EASY: 10,
          SUCCEEDED: 5,
          TOO_HARD: -10,
        },
      },
    },
    height: {
      default: {
        default: {
          TOO_EASY: 10,
          SUCCEEDED: 5,
          TOO_HARD: -5,
        },
      },
    },
    repetition: {
      default: {
        default: {
          TOO_EASY: 2,
          SUCCEEDED: 1,
          TOO_HARD: -2,
        },
        beginner: {
          TOO_EASY: 2,
          SUCCEEDED: 1,
          TOO_HARD: -2,
        },
        advanced: {
          TOO_EASY: 2,
          SUCCEEDED: 1,
          TOO_HARD: -2,
        },
        professional: {
          TOO_EASY: 2,
          SUCCEEDED: 1,
          TOO_HARD: -2,
        },
      },
      k: {
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
    duration: {
      default: {
        default: 30,
      },
    },
    height: {
      default: {
        default: 20,
      },
    },
    repetition: {
      default: {
        default: 8,
      },
    },
    weight: {
      default: {
        default: 65,
      },
    },
  },
  targetValue: {
    duration: {
      default: {
        default: 60,
      },
    },
    height: {
      default: {
        default: 40,
      },
    },
    repetition: {
      default: {
        default: 12,
      },
    },
    weight: {
      default: {
        default: 75,
        beginner: 75,
        advanced: 80,
        professional: 90,
      },
    },
  },
};
