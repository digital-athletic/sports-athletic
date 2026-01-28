// Pain location constants
const PAIN = {
  SHOULDER_LEFT: "SHOULDER_LEFT",
  SHOULDER_RIGHT: "SHOULDER_RIGHT",
  ELBOW_LEFT: "ELBOW_LEFT",
  ELBOW_RIGHT: "ELBOW_RIGHT",
  WRIST_LEFT: "WRIST_LEFT",
  WRIST_RIGHT: "WRIST_RIGHT",
  SPINE: "SPINE",
  HIP_LEFT: "HIP_LEFT",
  HIP_RIGHT: "HIP_RIGHT",
  KNEE_LEFT: "KNEE_LEFT",
  KNEE_RIGHT: "KNEE_RIGHT",
  ANKLE_LEFT: "ANKLE_LEFT",
  ANKLE_RIGHT: "ANKLE_RIGHT",
} as const;

// Prevention exercise types
const PREVENTION = {
  SHOULDER: "PREVSHOULDER",
  WRIST: "PREVWRIST",
  SPINE: "PREVSPINE",
  KNEE: "PREVKNEE",
  ANKLE: "PREVANKLE",
} as const;

// Body part blocks
const BODY_BLOCKS = {
  SHOULDER: "SHOULDER",
  ELBOW: "ELBOW",
  WRIST: "WRIST",
  SPINE: "SPINE",
  HIP: "HIP",
  KNEE: "KNEE",
  ANKLE: "ANKLE",
} as const;

/**
 * Maps pain locations to prevention exercise types
 */
export function getPreventionsFromPains(pains: string[]): string[] {
  const preventions: string[] = [];

  for (const pain of pains) {
    let prev: string;

    switch (pain) {
      case PAIN.SHOULDER_LEFT:
      case PAIN.SHOULDER_RIGHT:
        prev = PREVENTION.SHOULDER;
        break;
      case PAIN.ELBOW_LEFT:
      case PAIN.ELBOW_RIGHT:
      case PAIN.WRIST_LEFT:
      case PAIN.WRIST_RIGHT:
        prev = PREVENTION.WRIST;
        break;
      case PAIN.SPINE:
        prev = PREVENTION.SPINE;
        break;
      case PAIN.HIP_LEFT:
      case PAIN.HIP_RIGHT:
      case PAIN.KNEE_LEFT:
      case PAIN.KNEE_RIGHT:
        prev = PREVENTION.KNEE;
        break;
      case PAIN.ANKLE_LEFT:
      case PAIN.ANKLE_RIGHT:
        prev = PREVENTION.ANKLE;
        break;
      default:
        prev = PREVENTION.SHOULDER;
        break;
    }

    if (!preventions.includes(prev)) {
      preventions.push(prev);
    }
  }

  return preventions;
}

/**
 * Maps pain locations to blocked body regions
 */
export function getBlocksFromPains(pains: string[]): string[] {
  const blocks: string[] = [];

  for (const pain of pains) {
    let block: string;

    switch (pain) {
      case PAIN.SHOULDER_LEFT:
      case PAIN.SHOULDER_RIGHT:
        block = BODY_BLOCKS.SHOULDER;
        break;
      case PAIN.ELBOW_LEFT:
      case PAIN.ELBOW_RIGHT:
        block = BODY_BLOCKS.ELBOW;
        break;
      case PAIN.WRIST_LEFT:
      case PAIN.WRIST_RIGHT:
        block = BODY_BLOCKS.WRIST;
        break;
      case PAIN.SPINE:
        block = BODY_BLOCKS.SPINE;
        break;
      case PAIN.HIP_LEFT:
      case PAIN.HIP_RIGHT:
        block = BODY_BLOCKS.HIP;
        break;
      case PAIN.KNEE_LEFT:
      case PAIN.KNEE_RIGHT:
        block = BODY_BLOCKS.KNEE;
        break;
      case PAIN.ANKLE_LEFT:
      case PAIN.ANKLE_RIGHT:
        block = BODY_BLOCKS.ANKLE;
        break;
      default:
        block = BODY_BLOCKS.SHOULDER;
        break;
    }

    if (!blocks.includes(block)) {
      blocks.push(block);
    }
  }

  return blocks;
}
