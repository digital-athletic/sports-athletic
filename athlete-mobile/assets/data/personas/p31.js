import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
import OUTSIDE from "../../../assets/data/generator/places/OUTSIDE";
import STUDIO from "../../../assets/data/generator/places/STUDIO";

const p = {
    displayName: { default: "Persona 31" },
    value: {
        name: "Persona 31",
        workoutData: {
            anamnesisCompleted: true,
            gender: "FEMALE",
            birthday: "11-4-1995",
            height: 188,
            weight: 71,
            tags: [
                // POSITION
                "POSITION_FIELD",
                // LEVEL
                "LEVEL_ADVANCED",
                // PAINS
                "PAIN_WRIST_RIGHT"
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
                active: true,
                weekday: 0,
                duration: 25,
                place: "HOME",
                equipment: HOME.EQUIPMENT
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
                place: "HALL",
                equipment: HALL.EQUIPMENT
            },
            // THURSDAY
            {
                active: true,
                weekday: 3,
                duration: 50,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // FRIDAY
            {
                active: true,
                weekday: 4,
                duration: 25,
                place: "OUTSIDE",
                equipment: OUTSIDE.EQUIPMENT
            },
            // SATURDAY
            {
                active: false,
                weekday: 5,
                duration: 25,
                place: "HOME",
                equipment: HOME.EQUIPMENT
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
                weekday: 1,
                focus: "PHASE",
                content: {
                    MOB: 10,
                    WU: 5,
                    SWR1: 35,
                    CD: 5
                }
            },
            {
                weekday: 3,
                focus: "PHASE",
                content: {
                    WU: 5,
                    MOB: 5,
                    SWR1: 35,
                    CD: 5
                }
            },
            {
                weekday: 4,
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
