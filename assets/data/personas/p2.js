import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
import OUTSIDE from "../../../assets/data/generator/places/OUTSIDE";
import STUDIO from "../../../assets/data/generator/places/STUDIO";

const p = {
    displayName: { default: "Persona 2" },
    value: {
        name: "Persona 2",
        workoutData: {
            anamnesisCompleted: true,
            gender: "MALE",
            birthday: "7-8-2004",
            height: 170,
            weight: 60,
            tags: [
                // POSITION
                "POSITION_FIELD",
                // LEVEL
                "LEVEL_ADVANCED"
                // PAINS
            ],
            seasonPhase: {
                type: "COMPETITION",
                numOfWeeks: 30,
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
                active: false,
                weekday: 1,
                duration: 35,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // WEDNESDAY
            {
                active: true,
                weekday: 2,
                duration: 45,
                place: "HALL",
                equipment: HALL.EQUIPMENT
            },
            // THURSDAY
            {
                active: false,
                weekday: 3,
                duration: 35,
                place: "HALL",
                equipment: HALL.EQUIPMENT
            },
            // FRIDAY
            {
                active: false,
                weekday: 4,
                duration: 35,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // SATURDAY
            {
                active: true,
                weekday: 5,
                duration: 45,
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
                cardioType: "CARDIO_2",
                numOfWeeks: 4
            },
            {
                type: "SK",
                cardioType: "CARDIO_1_SHORT",
                numOfWeeks: 3
            },
            {
                type: "SWR1",
                cardioType: "CARDIO_2",
                numOfWeeks: 4
            },
            {
                type: "SA",
                cardioType: "CARDIO_1_LAKTAT",
                numOfWeeks: 3
            },
            {
                type: "SWR1",
                cardioType: "CARDIO_2",
                numOfWeeks: 4
            },
            {
                type: "SK",
                cardioType: "CARDIO_1_SHORT",
                numOfWeeks: 3
            },
            {
                type: "SWR1",
                cardioType: "CARDIO_2",
                numOfWeeks: 4
            },
            {
                type: "SA",
                cardioType: "CARDIO_1_LAKTAT",
                numOfWeeks: 3
            },
            {
                type: "SWR1",
                cardioType: "CARDIO_2",
                numOfWeeks: 2
            }
        ],
        expectedTrainingFocus: [
            {
                weekday: 0,
                focus: "PHASE",
                content: {
                    WU: 5,
                    BAS: 5,
                    GKS: 5,
                    SWR1KG: 25,
                    CD: 5
                }
            },
            {
                weekday: 2,
                focus: "PHASE",
                content: {
                    WU: 5,
                    BAS: 5,
                    GKS: 5,
                    SWR1KG: 25,
                    CD: 5
                }
            },
            {
                weekday: 5,
                focus: "PHASE",
                content: {
                    WU: 5,
                    BAS: 5,
                    GKS: 5,
                    SWR1KG: 25,
                    CD: 5
                }
            }
        ]
    }
};
export default p;
