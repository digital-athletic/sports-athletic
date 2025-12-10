import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
import OUTSIDE from "../../../assets/data/generator/places/OUTSIDE";
import STUDIO from "../../../assets/data/generator/places/STUDIO";

const p = {
    displayName: { default: "Persona 19" },
    value: {
        name: "Persona 19",
        workoutData: {
            anamnesisCompleted: true,
            gender: "MALE",
            birthday: "11-12-2000",
            height: 198,
            weight: 105,
            tags: [
                // POSITION
                "POSITION_FIELD",
                // LEVEL
                "LEVEL_ADVANCED",
                // PAINS
                "PAIN_SPRUNGGELENK_RECHTS"
            ],
            seasonPhase: {
                type: "COMPETITION",
                numOfWeeks: 24,
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
                active: false,
                weekday: 1,
                duration: 20,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // WEDNESDAY
            {
                active: false,
                weekday: 2,
                duration: 60,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // THURSDAY
            {
                active: true,
                weekday: 3,
                duration: 20,
                place: "HALL",
                equipment: HALL.EQUIPMENT
            },
            // FRIDAY
            {
                active: true,
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
                type: "SWR2",
                numOfWeeks: 3,
                cardioType: "CARDIO_2"
            },
            {
                type: "SK",
                numOfWeeks: 3,
                cardioType: "CARDIO_1_SHORT"
            },
            {
                type: "SWR2",
                numOfWeeks: 3,
                cardioType: "CARDIO_2"
            },
            {
                type: "SA",
                numOfWeeks: 3,
                cardioType: "CARDIO_1_LAKTAT"
            },
            {
                type: "SWR2",
                numOfWeeks: 3,
                cardioType: "CARDIO_2"
            },
            {
                type: "SK",
                numOfWeeks: 3,
                cardioType: "CARDIO_1_SHORT"
            },
            {
                type: "SWR2",
                numOfWeeks: 3,
                cardioType: "CARDIO_2"
            },
            {
                type: "SA",
                numOfWeeks: 3,
                cardioType: "CARDIO_1_LAKTAT"
            }
        ],
        expectedTrainingFocus: [
            {
                weekday: 3,
                focus: "CARDIO",
                content: {
                    MOB: 5,
                    CARDIO: 15
                }
            },
            {
                weekday: 4,
                focus: "PHASE",
                content: {
                    PREVANKLE: 5,
                    SWR2KG: 15
                }
            }
        ]
    }
};
export default p;
