import PLACES from "../generator/places.json";
const { HOME, HALL, OUTSIDE, STUDIO } = PLACES;

const p = {
    displayName: { default: "Persona 33" },
    value: {
        name: "Persona 33",
        workoutData: {
            anamnesisCompleted: true,
            gender: "MALE",
            birthday: "26-3-1987",
            height: 190,
            weight: 96,
            tags: [
                // POSITION
                "POSITION_FIELD",
                // LEVEL
                "LEVEL_PROFESSIONAL",
                // PAINS
                "PAIN_SHOULDER_LEFT",
                "PAIN_KNEE_RIGHT",
                "PAIN_ANKLE_RIGHT"
            ],
            seasonPhase: {
                type: "COMPETITION",
                numOfWeeks: 21,
                // NO NEED TO SET endDate is only used in anamnesis to calc numOfWeeks
                endDate: "25-10-2019"
            }
        },
        trainingDays: [
            // MONDAY
            {
                active: true,
                weekday: 0,
                duration: 60,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // TUESDAY
            {
                active: true,
                weekday: 1,
                duration: 30,
                place: "HALL",
                equipment: HALL.EQUIPMENT
            },
            // WEDNESDAY
            {
                active: false,
                weekday: 2,
                duration: 30,
                place: "HALL",
                equipment: HALL.EQUIPMENT
            },
            // THURSDAY
            {
                active: true,
                weekday: 3,
                duration: 60,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // FRIDAY
            {
                active: false,
                weekday: 4,
                duration: 50,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // SATURDAY
            {
                active: false,
                weekday: 5,
                duration: 30,
                place: "OUTSIDE",
                equipment: OUTSIDE.EQUIPMENT
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
                cardioType: "CARDIO_1_LAKTAT"
            },
            {
                type: "SA",
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
                    PREVSHOULDER: 15,
                    SWR2: 25,
                    CD: 5
                }
            },
            {
                weekday: 1,
                focus: "CARDIO",
                content: {
                    MOB: 5,
                    WUSPEZIAL: 3,
                    PREVKNEE: 5,
                    CARDIO: 15
                }
            },
            {
                weekday: 3,
                focus: "PHASE",
                content: {
                    MOB: 5,
                    WU: 5,
                    WUSPEZIAL: 3,
                    PREVANKLE: 15,
                    SWR2: 25,
                    CD: 5
                }
            }
        ]
    }
};
export default p;
