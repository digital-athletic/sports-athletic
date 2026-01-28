import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
import OUTSIDE from "../../../assets/data/generator/places/OUTSIDE";
import STUDIO from "../../../assets/data/generator/places/STUDIO";

const p = {
    displayName: { default: "Persona 8" },
    value: {
        name: "Persona 8",
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
                "LEVEL_BEGINNER"
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
                duration: 45,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // TUESDAY
            {
                active: true,
                weekday: 1,
                duration: 40,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // WEDNESDAY
            {
                active: false,
                weekday: 2,
                duration: 40,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // THURSDAY
            {
                active: true,
                weekday: 3,
                duration: 45,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // FRIDAY
            {
                active: false,
                weekday: 4,
                duration: 30,
                place: "HOME",
                equipment: HOME.EQUIPMENT
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
                numOfWeeks: 4,
                cardioType: "CARDIO_3"
            },
            {
                type: "SWR2",
                numOfWeeks: 4,
                cardioType: "CARDIO_2"
            },
            {
                type: "SK",
                numOfWeeks: 2,
                cardioType: "CARDIO_1_SHORT"
            },
            {
                type: "SA",
                numOfWeeks: 2,
                cardioType: "CARDIO_1_LAKTAT"
            }
        ],
        expectedTrainingFocus: [
            {
                weekday: 0,
                focus: "PHASE",
                content: {
                    WU: 5,
                    MOB: 5,
                    SWR1: 35
                }
            },
            {
                weekday: 1,
                focus: "CARDIO",
                content: {
                    MOB: 3,
                    BAS: 5,
                    CARDIO: 30
                }
            },
            {
                weekday: 3,
                focus: "PHASE",
                content: {
                    WU: 5,
                    MOB: 5,
                    SWR1KG: 35
                }
            }
        ]
    }
};
export default p;
