// Pause between sets in seconds
const SINGLESETS = {
    SWR1: 60,
    SWR2: 60,
    SWR1KG: 60,
    SWR2KG: 60,
    MAX: 180, //TODO mit Support Übungen füllen: 30 Pause - 30 Support - 60 Pause - 30 Support- 30 Pause
    BAS: 60,
    GKS: 90,
    PLYO_LOW: 120,
    PLYO_HIGH: 180,
    SK: 150,
    WU: 60, // nur bei Gewichten
    SA: 180,
    SAS: 150,
    MOB: 0,
    CD: 0,
    BR: 0,
    PREV: 60,
    MAX_TEST: 120
} as const;

export default SINGLESETS;
