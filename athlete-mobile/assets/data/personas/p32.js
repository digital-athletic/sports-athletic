import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
import OUTSIDE from "../../../assets/data/generator/places/OUTSIDE";
import STUDIO from "../../../assets/data/generator/places/STUDIO";

const p = {
    displayName: { default: "Persona 32" },
    value: {
        name: "Persona 32",
        workoutData: {
            anamnesisCompleted: true,
            gender: "FEMALE",
            birthday: "17-5-2003",
            height: 168,
            weight: 56,
            tags: [
                // POSITION
                "POSITION_FIELD",
                // LEVEL
                "LEVEL_PROFESSIONAL"
                // PAINS
            ],
            seasonPhase: {
                type: "PREPATORY",
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
                duration: 45,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // TUESDAY
            {
                active: true,
                weekday: 1,
                duration: 50,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // WEDNESDAY
            {
                active: true,
                weekday: 2,
                duration: 30,
                place: "HALL",
                equipment: HALL.EQUIPMENT
            },
            // THURSDAY
            {
                active: false,
                weekday: 3,
                duration: 50,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // FRIDAY
            {
                active: true,
                weekday: 4,
                duration: 50,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // SATURDAY
            {
                active: true,
                weekday: 5,
                duration: 30,
                place: "OUTSIDE",
                equipment: OUTSIDE.EQUIPMENT
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
                type: "SWR2",
                numOfWeeks: 3,
                cardioType: "CARDIO_2"
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
                focus: "CARDIO",
                content: {
                    MOB: 5,
                    BR: 5,
                    CARDIO: 35
                }
            },
            {
                weekday: 1,
                focus: "PHASE",
                content: {
                    MOB: 5,
                    WU: 5,
                    SWR1: 35,
                    CD: 5
                }
            },
            {
                weekday: 2,
                focus: "STABILITY",
                content: {
                    MOB: 5,
                    BAS: 10,
                    GKS: 15
                }
            },
            {
                weekday: 4,
                focus: "PHASE",
                content: {
                    MOB: 5,
                    WU: 5,
                    SWR1: 35,
                    CD: 5
                }
            },
            {
                weekday: 5,
                focus: "CARDIO",
                content: {
                    BAS: 5,
                    CARDIO: 25
                }
            }
        ]
    }
};
export default p;
