import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
import OUTSIDE from "../../../assets/data/generator/places/OUTSIDE";
import STUDIO from "../../../assets/data/generator/places/STUDIO";

const p = {
    displayName: { default: "Persona 4" },
    value: {
        name: "Persona 4",
        workoutData: {
            anamnesisCompleted: true,
            gender: "MALE",
            birthday: "7-8-2005",
            height: 170,
            weight: 58,
            tags: [
                // POSITION
                "POSITION_GOAL",
                // LEVEL
                "LEVEL_BEGINNER",
                // PAINS
                "PAIN_SHOULDER_RIGHT",
                "PAIN_KNEE_LEFT"
            ],
            seasonPhase: {
                type: "PREPATORY",
                numOfWeeks: 12,
                // NO NEED TO SET endDate is only used in anamnesis to calc numOfWeeks
                endDate: "25-10-2019"
            }
        },
        trainingDays: [
            // MONDAY
            {
                active: false,
                weekday: 0,
                duration: 35,
                place: "HOME",
                equipment: HOME.EQUIPMENT
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
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // THURSDAY
            {
                active: false,
                weekday: 3,
                duration: 35,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // FRIDAY
            {
                active: true,
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
                numOfWeeks: 4,
                cardioType: "CARDIO_3"
            },
            {
                type: "SWR1",
                numOfWeeks: 4,
                cardioType: "CARDIO_2"
            },
            {
                type: "SK",
                numOfWeeks: 2,
                cardioType: "CARDIO_1_LAKTAT"
            },
            {
                type: "SA",
                numOfWeeks: 2,
                cardioType: "CARDIO_1_SHORT"
            }
        ],
        expectedTrainingFocus: [
            {
                weekday: 1,
                focus: "PHASE",
                content: {
                    WUSPEZIAL: 3,
                    PREVSHOULDER: 5,
                    PREVKNEE: 5,
                    GKS: 5,
                    SWR1KG: 20
                }
            },
            {
                weekday: 4,
                focus: "PHASE",
                content: {
                    WU: 5,
                    WUSPEZIAL: 3,
                    PREVSHOULDER: 5,
                    PREVKNEE: 5,
                    GKS: 5,
                    SWR1KG: 20
                }
            }
        ]
    }
};
export default p;
