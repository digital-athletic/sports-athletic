import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
import OUTSIDE from "../../../assets/data/generator/places/OUTSIDE";
import STUDIO from "../../../assets/data/generator/places/STUDIO";

/**
 * Sonderfall für Torhüter mit 5 statt 4 Sections?!?
 */
const p = {
    displayName: { default: "Persona 6" },
    value: {
        name: "Persona 6",
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
                "LEVEL_PROFESSIONAL"
                // PAINS
            ],
            seasonPhase: {
                type: "PREPARATORY",
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
                duration: 60,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
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
                    BR: 5,
                    MOB: 5,
                    CARDIO: 25
                }
            },
            {
                weekday: 2,
                focus: "STABILITY",
                content: {
                    WU: 5,
                    MOB: 10,
                    BAS: 10,
                    GKS: 15
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
