import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";

const p = {
    displayName: { default: "Persona 3" },
    value: {
        name: "Persona 3",
        workoutData: {
            anamnesisCompleted: true,
            gender: "MALE",
            birthday: "1-1-2006",
            height: 175,
            weight: 65,
            tags: [
                // POSITION
                "POSITION_GOAL",
                // LEVEL
                "LEVEL_BEGINNER",
                // PAINS
                "PAIN_WRIST_RIGHT"
            ],
            seasonPhase: {
                type: "PREPARATORY",
                numOfWeeks: 8,
                // NO NEED TO SET endDate is only used in anamnesis to calc numOfWeeks
                endDate: "25-10-2019"
            }
        },
        trainingDays: [
            // MONDAY
            {
                active: false,
                weekday: 0,
                duration: 35,
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
                active: false,
                weekday: 2,
                duration: 35,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // THURSDAY
            {
                active: true,
                weekday: 3,
                duration: 35,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // FRIDAY
            {
                active: false,
                weekday: 4,
                duration: 35,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // SATURDAY
            {
                active: true,
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
                numOfWeeks: 2,
                cardioType: "CARDIO_3"
            },
            {
                type: "SWR1",
                numOfWeeks: 2,
                cardioType: "CARDIO_2"
            },
            {
                type: "SWR1",
                numOfWeeks: 2,
                cardioType: "CARDIO_1_LAKTAT"
            },
            {
                type: "SWR1",
                numOfWeeks: 2,
                cardioType: "CARDIO_1_SHORT"
            }
        ],
        expectedTrainingFocus: [
            {
                weekday: 3,
                focus: "PHASE",
                content: {
                    WUSPEZIAL: 3,
                    BAS: 5,
                    PREVWRIST: 5,
                    GKS: 5,
                    SWR1KG: 15
                }
            },
            {
                weekday: 5,
                focus: "PHASE",
                content: {
                    WUSPEZIAL: 3,
                    BAS: 5,
                    PREVWRIST: 5,
                    GKS: 5,
                    SWR1KG: 15
                }
            }
        ]
    }
};
export default p;
