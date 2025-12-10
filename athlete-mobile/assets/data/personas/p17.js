import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
import OUTSIDE from "../../../assets/data/generator/places/OUTSIDE";
import STUDIO from "../../../assets/data/generator/places/STUDIO";

const p = {
    displayName: { default: "Persona 17" },
    value: {
        name: "Persona 17",
        workoutData: {
            anamnesisCompleted: true,
            gender: "FEMALE",
            birthday: "7-4-1995",
            height: 167,
            weight: 60,
            tags: [
                // POSITION
                "POSITION_GOAL",
                // LEVEL
                "LEVEL_PROFESSIONAL"
                // PAINS
            ],
            seasonPhase: {
                type: "COMPETITION",
                numOfWeeks: 15,
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
                duration: 45,
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
                type: "SA",
                numOfWeeks: 3,
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
                    MAX: 50,
                    CD: 5
                }
            },
            {
                weekday: 2,
                focus: "CARDIO",
                content: {
                    BR: 5,
                    MOB: 5,
                    BAS: 10,
                    CARDIO: 40
                }
            }
        ]
    }
};
export default p;
