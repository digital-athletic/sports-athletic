import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
import OUTSIDE from "../../../assets/data/generator/places/OUTSIDE";
import STUDIO from "../../../assets/data/generator/places/STUDIO";

const p = {
    displayName: { default: "Persona 21" },
    value: {
        name: "Persona 21",
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
                "LEVEL_BEGINNER",
                // PAINS
                "PAIN_ELBOW_LEFT",
                "PAIN_KNEE_RIGHT"
            ],
            seasonPhase: {
                type: "PREPATORY",
                numOfWeeks: 9,
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
                duration: 25,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // WEDNESDAY
            {
                active: true,
                weekday: 2,
                duration: 25,
                place: "HOME",
                equipment: HOME.EQUIPMENT
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
                active: true,
                weekday: 4,
                duration: 25,
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
                type: "SK",
                numOfWeeks: 2,
                cardioType: "CARDIO_1_SHORT"
            }
        ],
        expectedTrainingFocus: [
            {
                weekday: 2,
                focus: "STABILITY",
                content: {
                    MOB: 5,
                    WUSPEZIAL: 3,
                    BAS: 5,
                    PREVWRIST: 5,
                    GKS: 5
                }
            },
            {
                weekday: 3,
                focus: "CARDIO",
                content: {
                    MOB: 5,
                    WUSPEZIAL: 3,
                    PREVKNEE: 5,
                    CARDIO: 10
                }
            },
            {
                weekday: 4,
                focus: "PHASE",
                content: {
                    MOB: 5,
                    SWR1: 20
                }
            }
        ]
    }
};
export default p;
