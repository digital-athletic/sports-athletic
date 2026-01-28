import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
/**
 * Sonderfall für Torhüter mit 5 statt 4 Sections?!?
 */
const p = {
    displayName: { default: "Persona 7" },
    value: {
        name: "Persona 7",
        workoutData: {
            anamnesisCompleted: true,
            gender: "FEMALE",
            birthday: "8-8-2002",
            height: 165,
            weight: 53,
            tags: [
                // POSITION
                "POSITION_GOAL",
                // LEVEL
                "LEVEL_PROFESSIONAL",
                // PAINS
                "PAIN_KNEE_LEFT",
                "PAIN_ANKLE_LEFT"
            ],
            seasonPhase: {
                type: "PREPATORY",
                numOfWeeks: 12,
                // NO NEED TO SET endDate is only used in anamnesis to calc numOfWeeks
                endDate: "25-10-2019"
            }
        },
        trainingDays: [
            // MONDAY
            {
                active: true,
                weekday: 0,
                duration: 50,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // TUESDAY
            {
                active: true,
                weekday: 1,
                duration: 35,
                place: "HALL",
                equipment: HALL.EQUIPMENT
            },
            // WEDNESDAY
            {
                active: true,
                weekday: 2,
                duration: 40,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // THURSDAY
            {
                active: false,
                weekday: 3,
                duration: 45,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // FRIDAY
            {
                active: true,
                weekday: 4,
                duration: 30,
                place: "HOME",
                equipment: HOME.EQUIPMENT
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
                type: "SWR1",
                numOfWeeks: 3,
                cardioType: "CARDIO_3"
            },
            {
                type: "SWR2",
                numOfWeeks: 3,
                cardioType: "CARDIO_2"
            },
            {
                type: "SK",
                numOfWeeks: 2,
                cardioType: "CARDIO_1_SHORT"
            },
            {
                type: "SWR2",
                numOfWeeks: 2,
                cardioType: "CARDIO_2"
            },
            {
                type: "SK",
                numOfWeeks: 2,
                cardioType: "CARDIO_1_SHORT"
            }
        ],
        expectedTrainingFocus: [
            {
                weekday: 0,
                focus: "PHASE",
                content: {
                    WU: 5,
                    MOB: 5,
                    SWR1: 35,
                    CD: 5
                }
            },
            {
                weekday: 1,
                focus: "CARDIO",
                content: {
                    WUSPEZIAL: 3,
                    BR: 5,
                    PREVKNEE: 5,
                    CARDIO: 20
                }
            },
            {
                weekday: 2,
                focus: "STABILITY",
                content: {
                    WU: 5,
                    WUSPEZIAL: 3,
                    MOB: 5,
                    BAS: 5,
                    PREVANKLE: 15,
                    GKS: 5
                }
            },
            {
                weekday: 4,
                focus: "PHASE",
                content: {
                    MOB: 5,
                    SWR1: 25
                }
            }
        ]
    }
};
export default p;
