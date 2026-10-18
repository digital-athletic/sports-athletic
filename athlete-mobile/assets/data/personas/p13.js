import PLACES from "../generator/places.json";
const { HOME, HALL, OUTSIDE, STUDIO } = PLACES;

const p = {
    displayName: { default: "Persona 13" },
    value: {
        name: "Persona 13",
        workoutData: {
            anamnesisCompleted: true,
            gender: "FEMALE",
            birthday: "8-12-2002",
            height: 180,
            weight: 64,
            tags: [
                // POSITION
                "POSITION_FIELD",
                // LEVEL
                "LEVEL_ADVANCED",
                // PAINS
                "PAIN_SHOULDER_LEFT"
            ],
            seasonPhase: {
                type: "PAUSE",
                numOfWeeks: 4,
                // NO NEED TO SET endDate is only used in anamnesis to calc numOfWeeks
                endDate: "25-10-2019"
            }
        },
        trainingDays: [
            // MONDAY
            {
                active: false,
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
                active: false,
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
                type: "SWR1",
                numOfWeeks: 2,
                cardioType: "CARDIO_4"
            },
            {
                type: "SWR2",
                numOfWeeks: 2,
                cardioType: "CARDIO_4"
            }
        ],
        expectedTrainingFocus: [
            {
                weekday: 2,
                focus: "COMBINED",
                content: {
                    MOB: 5,
                    WU: 5,
                    WUSPEZIAL: 3,
                    PREVSHOULDER: 5,
                    SWR1: 20,
                    CARDIO: 20
                }
            }
        ]
    }
};
export default p;
