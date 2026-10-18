import PLACES from "../generator/places.json";
const { HOME, HALL, OUTSIDE, STUDIO } = PLACES;

const p = {
    displayName: { default: "Persona 12" },
    value: {
        name: "Persona 12",
        workoutData: {
            anamnesisCompleted: true,
            gender: "FEMALE",
            birthday: "9-12-1990",
            height: 168,
            weight: 56,
            tags: [
                // POSITION
                "POSITION_FIELD",
                // LEVEL
                "LEVEL_BEGINNER",
                // PAINS
                "PAIN_ELBOW_RIGHT"
            ],
            seasonPhase: {
                type: "PAUSE",
                numOfWeeks: 5,
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
                duration: 40,
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
                numOfWeeks: 3,
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
                focus: "PHASE",
                content: {
                    MOB: 5,
                    WU: 5,
                    WUSPEZIAL: 3,
                    PREVWRIST: 5,
                    SWR1: 20
                }
            }
        ]
    }
};
export default p;
