import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
import OUTSIDE from "../../../assets/data/generator/places/OUTSIDE";
import STUDIO from "../../../assets/data/generator/places/STUDIO";

const p = {
    displayName: { default: "Persona 26" },
    value: {
        name: "Persona 26",
        workoutData: {
            anamnesisCompleted: true,
            gender: "FEMALE",
            birthday: "30-7-2005",
            height: 154,
            weight: 45,
            tags: [
                // POSITION
                "POSITION_GOAL",
                // LEVEL
                "LEVEL_ADVANCED"
                // PAINS
            ],
            seasonPhase: {
                type: "COMPETITION",
                numOfWeeks: 14,
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
                duration: 60,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // WEDNESDAY
            {
                active: true,
                weekday: 2,
                duration: 35,
                place: "HALL",
                equipment: HALL.EQUIPMENT
            },
            // THURSDAY
            {
                active: false,
                weekday: 3,
                duration: 55,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // FRIDAY
            {
                active: true,
                weekday: 4,
                duration: 45,
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
                duration: 45,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            }
        ],
        expectedSections: [
            {
                type: "SWR1",
                numOfWeeks: 4,
                cardioType: "CARDIO_2"
            },
            {
                type: "SK",
                numOfWeeks: 3,
                cardioType: "CARDIO_1_SHORT"
            },
            {
                type: "SWR1",
                numOfWeeks: 4,
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
                weekday: 2,
                focus: "PHASE",
                content: {
                    WU: 5,
                    BAS: 5,
                    GKS: 5,
                    SWR1KG: 20
                }
            },
            {
                weekday: 4,
                focus: "PHASE",
                content: {
                    WU: 5,
                    GKS: 5,
                    BAS: 5,
                    SWR1KG: 25,
                    CD: 5
                }
            }
        ]
    }
};
export default p;
