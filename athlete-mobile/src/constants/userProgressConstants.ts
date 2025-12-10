export const LEVEL_STAGES_RANK = [
  "RANK_0",
  "RANK_1",
  "RANK_2",
  "RANK_3",
  "RANK_4",
  "RANK_5",
  "RANK_6",
  "RANK_7",
  "RANK_8",
  "RANK_9",
] as const;

export const LEVEL_STAGES_TITLES = [
  { level: 1, title: "ROOKIE" },
  { level: 2, title: "AUFSTEIGER" },
  { level: 4, title: "KAEMPFER" },
  { level: 6, title: "ATHLET" },
  { level: 8, title: "WARRIOR" },
  { level: 10, title: "BEAST" },
  { level: 12, title: "KAPITAEN" },
  { level: 15, title: "FINISHER" },
  { level: 17, title: "MASCHINE" },
  { level: 19, title: "ABWEHR_KOENIG" },
  { level: 22, title: "BUNDESLIGA_SPIELER" },
  { level: 24, title: "NATIONALSPIELER" },
  { level: 27, title: "WELTKLASSE_ATHLET" },
  { level: 30, title: "HANDBALL_STAR" },
  { level: 32, title: "EUROPAMEISTER" },
  { level: 35, title: "CHAMPION" },
  { level: 37, title: "WELTMEISTER" },
  { level: 39, title: "HANDBALL_HELD" },
  { level: 42, title: "HANDBALL_TITAN" },
  { level: 45, title: "HANDBALL_GOTT" },
];

export const XP_PER_MINUTE = 4; // xp earned per minute in workouts
export const LEVEL_STEP_1 = 150; // xp needed for level up 1 -> 2
export const LEVEL_STEP_2 = 200; // xp needed for level up 2 -> 3
export const LEVEL_STEP = 5; // increase in xp needed for next level up
export const BIG_LEVEL_STEP = 150; // increase in xp needed for next level up on "big levels"
export const BIG_LEVEL_FREQUENCE = 15; // level steps needing more xp as in BIG_LEVEL_STEP
