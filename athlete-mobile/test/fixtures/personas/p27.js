import PLACES from "../../../assets/data/generator/places.json";
const { HOME, HALL, STUDIO } = PLACES;

const p = {
    displayName: { default: "Persona 27" },
    value: {
        name: "Persona 27",
        workoutData: {
            anamnesisCompleted: true,
            gender: "MALE",
            birthday: "17-8-1990",
            height: 192,
            weight: 95,
            tags: [
                // POSITION
                "POSITION_FIELD",
                // LEVEL
                "LEVEL_PROFESSIONAL"
                // PAINS
            ],
            seasonPhase: {
                type: "COMPETITION",
                numOfWeeks: 11,
                // NO NEED TO SET endDate is only used in anamnesis to calc numOfWeeks
                endDate: "25-10-2019"
            }
        },
        trainingDays: [
            // MONDAY
            {
                active: true,
                weekday: 0,
                duration: 65,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // TUESDAY
            {
                active: true,
                weekday: 1,
                duration: 40,
                place: "HOME",
                equipment: HOME.EQUIPMENT
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
                active: true,
                weekday: 3,
                duration: 75,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // FRIDAY
            {
                active: false,
                weekday: 4,
                duration: 45,
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
                duration: 45,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
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
                numOfWeeks: 2,
                cardioType: "CARDIO_1_LAKTAT"
            }
        ],
        expectedTrainingFocus: [
            {
                weekday: 0,
                focus: "CARDIO",
                content: {
                    BR: 5,
                    MOB: 5,
                    BAS: 10,
                    CARDIO: 40,
                    CD: 5
                }
            },
            {
                weekday: 1,
                focus: "PHASE",
                content: {
                    WU: 5,
                    MOB: 5,
                    SWR2: 30
                }
            },
            {
                weekday: 3,
                focus: "PHASE",
                content: {
                    BR: 5,
                    WU: 5,
                    MOB: 10,
                    SWR2: 35
                }
            }
        ]
    }
};
export default p;
