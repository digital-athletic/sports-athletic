import PLACES from "../../../assets/data/generator/places.json";
const { HOME, HALL, STUDIO } = PLACES;

const p = {
    displayName: { default: "Persona 20" },
    value: {
        name: "Persona 20",
        workoutData: {
            anamnesisCompleted: true,
            gender: "FEMALE",
            birthday: "10-12-2002",
            height: 185,
            weight: 70,
            tags: [
                // POSITION
                "POSITION_GOAL",
                // LEVEL
                "LEVEL_BEGINNER"
                // PAINS
            ],
            seasonPhase: {
                type: "PAUSE",
                numOfWeeks: 10,
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
                duration: 25,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // WEDNESDAY
            {
                active: true,
                weekday: 2,
                duration: 25,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // THURSDAY
            {
                active: true,
                weekday: 3,
                duration: 25,
                place: "HALL",
                equipment: HALL.EQUIPMENT
            },
            // FRIDAY
            {
                active: false,
                weekday: 4,
                duration: 20,
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
                cardioType: "CARDIO_4"
            },
            {
                type: "SWR2",
                numOfWeeks: 4,
                cardioType: "CARDIO_4"
            },
            {
                type: "SWR1",
                numOfWeeks: 2,
                cardioType: "CARDIO_4"
            }
        ],
        expectedTrainingFocus: [
            {
                weekday: 1,
                focus: "STABILITY",
                content: {
                    MOB: 5,
                    BAS: 5,
                    GKS: 15
                }
            },
            {
                weekday: 2,
                focus: "PHASE",
                content: {
                    MOB: 5,
                    SWR1: 20
                }
            },
            {
                weekday: 3,
                focus: "CARDIO",
                content: {
                    MOB: 5,
                    CARDIO: 20
                }
            }
        ]
    }
};
export default p;
