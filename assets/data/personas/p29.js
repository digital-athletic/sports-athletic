import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
import OUTSIDE from "../../../assets/data/generator/places/OUTSIDE";
import STUDIO from "../../../assets/data/generator/places/STUDIO";

/**
 * 23 oder 22 Wochen?
 *
 */
const p = {
    displayName: { default: "Persona 29" },
    value: {
        name: "Persona 29",
        workoutData: {
            anamnesisCompleted: true,
            gender: "FEMALE",
            birthday: "8-11-1984",
            height: 168,
            weight: 72,
            tags: [
                // POSITION
                "POSITION_GOAL",
                // LEVEL
                "LEVEL_ADVANCED",
                // PAINS
                "PAIN_ELLBOGEN_LINKS",
                "PAIN_SPINE"
            ],
            seasonPhase: {
                type: "COMPETITION",
                numOfWeeks: 22,
                // NO NEED TO SET endDate is only used in anamnesis to calc numOfWeeks
                endDate: "25-10-2019"
            }
        },
        trainingDays: [
            // MONDAY
            {
                active: false,
                weekday: 0,
                duration: 30,
                place: "HALL",
                equipment: HALL.EQUIPMENT
            },
            // TUESDAY
            {
                active: true,
                weekday: 1,
                duration: 50,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // WEDNESDAY
            {
                active: false,
                weekday: 2,
                duration: 35,
                place: "HALL",
                equipment: HALL.EQUIPMENT
            },
            // THURSDAY
            {
                active: false,
                weekday: 3,
                duration: 75,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // FRIDAY
            {
                active: false,
                weekday: 4,
                duration: 30,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // SATURDAY
            {
                active: false,
                weekday: 5,
                duration: 60,
                place: "HALL",
                equipment: HALL.EQUIPMENT
            },
            // SUNDAY
            {
                active: true,
                weekday: 6,
                duration: 35,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            }
        ],
        expectedSections: [
            {
                type: "SWR2",
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
            },
            {
                type: "MAX",
                numOfWeeks: 1,
                cardioType: "CARDIO_1_SHORT"
            }
        ],
        expectedTrainingFocus: [
            {
                weekday: 1,
                focus: "COMBINED",
                content: {
                    MOB: 5,
                    WU: 5,
                    WUSPEZIAL: 3,
                    PREVWRIST: 5,
                    SWR2: 20
                }
            },
            {
                weekday: 6,
                focus: "PHASE",
                content: {
                    MOB: 5,
                    WU: 5,
                    WUSPEZIAL: 3,
                    PREVSPINE: 5,
                    SWR2: 15
                }
            }
        ]
    }
};
export default p;
