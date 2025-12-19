import { IntensityData } from "@/features/training/models/Intensity";

export const IntensityPREV: IntensityData = {
  adjustment: {
    duration: {
      default: {
        default: {
          TOO_EASY: 10,
          SUCCEEDED: 5,
          TOO_HARD: -10,
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
        default: 40,
      },
    },
    repetition: {
      default: {
        default: 10,
      },
    },
    height: {
      default: {
        default: 20,
      },
    },
    weight: {
      default: {
        default: 40,
      },
      type: {
        type: "weightFMax",
      },
    },
  },
  targetValue: {
    duration: {
      default: {
        default: 60,
      },
    },
    repetition: {
      default: {
        default: 15,
      },
    },
    height: {
      default: {
        default: 40,
      },
    },
    weight: {
      default: {
        default: 60,
      },
      type: {
        type: "weightFMax",
      },
    },
  },
};
