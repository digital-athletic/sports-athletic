import PLACES from "../generator/places.json";
const { HOME, HALL, OUTSIDE, STUDIO } = PLACES;

const p = {
    displayName: { default: "Persona 16" },
    value: {
        name: "Persona 16",
        workoutData: {
            anamnesisCompleted: true,
            gender: "MALE",
            birthday: "6-1-1996",
            height: 175,
            weight: 65,
            tags: [
                // POSITION
                "POSITION_FIELD",
                // LEVEL
                "LEVEL_PROFESSIONAL"
                // PAINS
            ],
            seasonPhase: {
                type: "PREPARATORY",
                numOfWeeks: 13,
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
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // TUESDAY
            {
                active: true,
                weekday: 1,
                duration: 45,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // WEDNESDAY
            {
                active: true,
                weekday: 2,
                duration: 45,
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
                active: true,
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
                type: "SWR1",
                numOfWeeks: 4,
                cardioType: "CARDIO_3"
            },
            {
                type: "SWR2",
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
                cardioType: "CARDIO_1_SHORT"
            }
        ],
        expectedTrainingFocus: [
            {
                weekday: 0,
                focus: "PHASE",
                content: {
                    MOB: 5,
                    WU: 5,
                    SWR1: 35
                }
            },
            {
                weekday: 1,
                focus: "STABILITY",
                content: {
                    MOB: 10,
                    WU: 10,
                    BAS: 10,
                    GKS: 15
                }
            },
            {
                weekday: 2,
                focus: "CARDIO",
                content: {
                    BR: 5,
                    MOB: 5,
                    CARDIO: 35
                }
            },
            {
                weekday: 5,
                focus: "PHASE",
                content: {
                    WU: 5,
                    CD: 5,
                    MOB: 10,
                    SWR1KG: 40
                }
            }
        ]
    }
};
export default p;
