import PLACES from "../generator/places.json";
const { HOME, HALL, OUTSIDE, STUDIO } = PLACES;

/**
 * Warum Audauer am DO? Einzelne Tage starten immer mit PHASE
 *
 * Ergebnis des Generators:
 * Mo - KRAFT, nicht COMBINED da HOME
 * Mi - COMBINED, da länger als 45 & nicht HOME
 * FR - KRAFT nicht COMBINED da 35
 */
const p = {
    displayName: { default: "Persona 11" },
    value: {
        name: "Persona 11",
        workoutData: {
            anamnesisCompleted: true,
            gender: "MALE",
            birthday: "5-4-1988",
            height: 184,
            weight: 88,
            tags: [
                // POSITION
                "POSITION_GOAL",
                // LEVEL
                "LEVEL_ADVANCED",
                // PAINS
                "PAIN_SPINE"
            ],
            seasonPhase: {
                type: "COMPETITION",
                numOfWeeks: 16,
                // NO NEED TO SET endDate is only used in anamnesis to calc numOfWeeks
                endDate: "25-10-2019"
            }
        },
        trainingDays: [
            // MONDAY
            {
                active: true,
                weekday: 0,
                duration: 45,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // TUESDAY
            {
                active: false,
                weekday: 1,
                duration: 35,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // WEDNESDAY
            {
                active: true,
                weekday: 2,
                duration: 60,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // THURSDAY
            {
                active: false,
                weekday: 3,
                duration: 40,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // FRIDAY
            {
                active: true,
                weekday: 4,
                duration: 35,
                place: "OUTSIDE",
                equipment: OUTSIDE.EQUIPMENT
            },
            // SATURDAY
            {
                active: false,
                weekday: 5,
                duration: 35,
                place: "HALL",
                equipment: HALL.EQUIPMENT
            },
            // SUNDAY
            {
                active: false,
                weekday: 6,
                duration: 35,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            }
        ],
        expectedSections: [
            {
                type: "SWR2",
                numOfWeeks: 4,
                cardioType: "CARDIO_2"
            },
            {
                type: "MAX",
                numOfWeeks: 3,
                cardioType: "CARDIO_1_SHORT"
            },
            {
                type: "SK",
                numOfWeeks: 3,
                cardioType: "CARDIO_2"
            },
            {
                type: "MAX",
                numOfWeeks: 3,
                cardioType: "CARDIO_1_SHORT"
            },
            {
                type: "SK",
                numOfWeeks: 3,
                cardioType: "CARDIO_2"
            }
        ],
        expectedTrainingFocus: [
            {
                weekday: 0,
                focus: "PHASE",
                content: {
                    MOB: 5,
                    WU: 5,
                    WUSPEZIAL: 3,
                    PREVSPINE: 5,
                    SWR2KG: 25
                }
            },
            {
                weekday: 2,
                focus: "PHASE",
                content: {
                    MOB: 5,
                    WU: 5,
                    WUSPEZIAL: 3,
                    PREVSPINE: 15,
                    SWR2: 25,
                    CD: 5
                }
            },
            {
                weekday: 4,
                focus: "CARDIO",
                content: {
                    MOB: 5,
                    BAS: 5,
                    CARDIO: 25
                }
            }
        ]
    }
};
export default p;
