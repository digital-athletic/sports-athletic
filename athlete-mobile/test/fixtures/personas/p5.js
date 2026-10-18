import PLACES from "../../../assets/data/generator/places.json";
const { HOME, HALL, STUDIO } = PLACES;

const p = {
    displayName: { default: "Persona 5" },
    value: {
        name: "Persona 5",
        workoutData: {
            anamnesisCompleted: true,
            gender: "FEMALE",
            birthday: "8-8-2002",
            height: 165,
            weight: 53,
            tags: [
                // POSITION
                "POSITION_FIELD",
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
                duration: 70,
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
                duration: 35,
                place: "HOME",
                equipment: HOME.EQUIPMENT
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
                duration: 45,
                place: "HALL",
                equipment: HALL.EQUIPMENT
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
                    WU: 5,
                    BR: 5,
                    MOB: 10,
                    SWR1: 45,
                    CD: 5
                }
            },
            {
                weekday: 1,
                focus: "CARDIO",
                content: {
                    BR: 5,
                    MOB: 5,
                    BAS: 10,
                    CARDIO: 40
                }
            },
            {
                weekday: 3,
                focus: "PHASE",
                content: {
                    WU: 5,
                    MOB: 10,
                    SWR1: 40,
                    CD: 5
                }
            }
        ]
    }
};
export default p;
