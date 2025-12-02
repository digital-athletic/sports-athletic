// Pain location constants
const PAIN = {
  SCHULTER_LINKS: "SCHULTER_LINKS",
  SCHULTER_RECHTS: "SCHULTER_RECHTS",
  ELLBOGEN_LINKS: "ELLBOGEN_LINKS",
  ELLBOGEN_RECHTS: "ELLBOGEN_RECHTS",
  HANDGELENK_LINKS: "HANDGELENK_LINKS",
  HANDGELENK_RECHTS: "HANDGELENK_RECHTS",
  WIRBELSAEULE: "WIRBELSAEULE",
  HUEFTE_LINKS: "HUEFTE_LINKS",
  HUEFTE_RECHTS: "HUEFTE_RECHTS",
  KNIE_LINKS: "KNIE_LINKS",
  KNIE_RECHTS: "KNIE_RECHTS",
  SPRUNGGELENK_LINKS: "SPRUNGGELENK_LINKS",
  SPRUNGGELENK_RECHTS: "SPRUNGGELENK_RECHTS",
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
  SCHULTER: "SCHULTER",
  ELLENBOGEN: "ELLENBOGEN",
  HANDGELENK: "HANDGELENK",
  WIRBELSAEULE: "WIRBELSAEULE",
  HUEFTE: "HUEFTE",
  KNIE: "KNIE",
  SPRUNGGELENK: "SPRUNGGELENK",
} as const;

/**
 * Maps pain locations to prevention exercise types
 */
export function getPreventionsFromPains(pains: string[]): string[] {
  const preventions: string[] = [];

  for (const pain of pains) {
    let prev: string;

    switch (pain) {
      case PAIN.SCHULTER_LINKS:
      case PAIN.SCHULTER_RECHTS:
        prev = PREVENTION.SHOULDER;
        break;
      case PAIN.ELLBOGEN_LINKS:
      case PAIN.ELLBOGEN_RECHTS:
      case PAIN.HANDGELENK_LINKS:
      case PAIN.HANDGELENK_RECHTS:
        prev = PREVENTION.WRIST;
        break;
      case PAIN.WIRBELSAEULE:
        prev = PREVENTION.SPINE;
        break;
      case PAIN.HUEFTE_LINKS:
      case PAIN.HUEFTE_RECHTS:
      case PAIN.KNIE_LINKS:
      case PAIN.KNIE_RECHTS:
        prev = PREVENTION.KNEE;
        break;
      case PAIN.SPRUNGGELENK_LINKS:
      case PAIN.SPRUNGGELENK_RECHTS:
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
      case PAIN.SCHULTER_LINKS:
      case PAIN.SCHULTER_RECHTS:
        block = BODY_BLOCKS.SCHULTER;
        break;
      case PAIN.ELLBOGEN_LINKS:
      case PAIN.ELLBOGEN_RECHTS:
        block = BODY_BLOCKS.ELLENBOGEN;
        break;
      case PAIN.HANDGELENK_LINKS:
      case PAIN.HANDGELENK_RECHTS:
        block = BODY_BLOCKS.HANDGELENK;
        break;
      case PAIN.WIRBELSAEULE:
        block = BODY_BLOCKS.WIRBELSAEULE;
        break;
      case PAIN.HUEFTE_LINKS:
      case PAIN.HUEFTE_RECHTS:
        block = BODY_BLOCKS.HUEFTE;
        break;
      case PAIN.KNIE_LINKS:
      case PAIN.KNIE_RECHTS:
        block = BODY_BLOCKS.KNIE;
        break;
      case PAIN.SPRUNGGELENK_LINKS:
      case PAIN.SPRUNGGELENK_RECHTS:
        block = BODY_BLOCKS.SPRUNGGELENK;
        break;
      default:
        block = BODY_BLOCKS.SCHULTER;
        break;
    }

    if (!blocks.includes(block)) {
      blocks.push(block);
    }
  }

  return blocks;
}
