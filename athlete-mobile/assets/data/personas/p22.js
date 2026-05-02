import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
import STUDIO from "../../../assets/data/generator/places/STUDIO";

const p = {
    displayName: { default: "Persona 22" },
    value: {
        name: "Persona 22",
        workoutData: {
            anamnesisCompleted: true,
            gender: "MALE",
            birthday: "25-3-1985",
            height: 182,
            weight: 103,
            tags: [
                // POSITION
                "POSITION_GOAL",
                // LEVEL
                "LEVEL_ADVANCED"
                // PAINS
            ],
            seasonPhase: {
                type: "COMPETITION",
                numOfWeeks: 31,
                // NO NEED TO SET endDate is only used in anamnesis to calc numOfWeeks
                endDate: "25-10-2019"
            }
        },
        trainingDays: [
            // MONDAY
            {
                active: false,
                weekday: 0,
                duration: 75,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // TUESDAY
            {
                active: true,
                weekday: 1,
                duration: 60,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // WEDNESDAY
            {
                active: false,
                weekday: 2,
                duration: 25,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // THURSDAY
            {
                active: true,
                weekday: 3,
                duration: 45,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // FRIDAY
            {
                active: true,
                weekday: 4,
                duration: 45,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
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
                numOfWeeks: 1,
                cardioType: "CARDIO_2"
            }
        ],
        expectedTrainingFocus: [
            {
                weekday: 1,
                focus: "PHASE",
                content: {
                    MOB: 10,
                    WU: 5,
                    SWR2: 40,
                    CD: 5
                }
            },
            {
                weekday: 3,
                focus: "PHASE",
                content: {
                    MOB: 5,
                    WU: 5,
                    SWR2: 35
                }
            },
            {
                weekday: 4,
                focus: "CARDIO",
                content: {
                    MOB: 5,
                    BAS: 5,
                    CARDIO: 35
                }
            }
        ]
    }
};
export default p;
