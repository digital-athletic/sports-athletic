import { IntensityData } from "@/features/training/models/Intensity";

export const IntensitySWR_2: IntensityData = {
  overridesExerciseRepsAndDuration: true,
  adjustment: {
    duration: {
      default: {
        default: {
          TOO_EASY: 10,
          SUCCEEDED: 5,
          TOO_HARD: -10,
        },
      },
      m: {
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
    },
    height: {
      default: {
        default: {
          // TODO
          TOO_EASY: 5,
          SUCCEEDED: 5,
          TOO_HARD: 5,
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
      },
      m: {
        professional: {
          TOO_EASY: 2,
          SUCCEEDED: 1,
          TOO_HARD: -2,
        },
      },
      w: {
        professional: {
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
        default: 67.5,
        beginner: 67.5,
        advanced: 70,
        professional: 70,
      },
      type: {
        type: "weightFMax",
      },
    },
  },
  targetValue: {
    duration: {
      default: {
        default: 50,
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
        advanced: 77.5,
        professional: 77.5,
      },
      type: {
        type: "weightFMax",
      },
    },
  },
};
