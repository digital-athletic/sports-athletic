import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
import OUTSIDE from "../../../assets/data/generator/places/OUTSIDE";
import STUDIO from "../../../assets/data/generator/places/STUDIO";

const p = {
    displayName: { default: "Persona 23" },
    value: {
        name: "Persona 23",
        workoutData: {
            anamnesisCompleted: true,
            gender: "FEMALE",
            birthday: "21-1-2003",
            height: 163,
            weight: 56,
            tags: [
                // POSITION
                "POSITION_FIELD",
                // LEVEL
                "LEVEL_PROFESSIONAL"
                // PAINS
            ],
            seasonPhase: {
                type: "COMPETITION",
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
                duration: 75,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // TUESDAY
            {
                active: false,
                weekday: 1,
                duration: 60,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // WEDNESDAY
            {
                active: true,
                weekday: 2,
                duration: 35,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // THURSDAY
            {
                active: true,
                weekday: 3,
                duration: 55,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // FRIDAY
            {
                active: false,
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
                cardioType: "CARDIO_1_LAKTAT"
            },
            {
                type: "SA",
                numOfWeeks: 1,
                cardioType: "CARDIO_2"
            }
        ],
        expectedTrainingFocus: [
            {
                weekday: 0,
                focus: "PHASE",
                content: {
                    BR: 5,
                    MOB: 10,
                    WU: 5,
                    SWR2: 50,
                    CD: 5
                }
            },
            {
                weekday: 2,
                focus: "PHASE",
                content: {
                    MOB: 5,
                    WU: 5,
                    SWR2KG: 25
                }
            },
            {
                weekday: 3,
                focus: "CARDIO",
                content: {
                    BR: 5,
                    MOB: 5,
                    BAS: 10,
                    CARDIO: 35
                }
            }
        ]
    }
};
export default p;
