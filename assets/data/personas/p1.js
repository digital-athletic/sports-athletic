import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
import OUTSIDE from "../../../assets/data/generator/places/OUTSIDE";
import STUDIO from "../../../assets/data/generator/places/STUDIO";

const p = {
    displayName: { default: "Persona 1" },
    value: {
        name: "Persona 1",
        workoutData: {
            anamnesisCompleted: true,
            gender: "FEMALE",
            birthday: "6-3-2005",
            height: 154,
            weight: 45,
            tags: [
                // POSITION
                "POSITION_GOAL",
                // LEVEL
                "LEVEL_BEGINNER"
                // PAINS
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
                duration: 35,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // TUESDAY
            {
                active: true,
                weekday: 1,
                duration: 35,
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
                active: true,
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
                active: false,
                weekday: 5,
                duration: 35,
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
                cardioType: "CARDIO_3",
                numOfWeeks: 3
            },
            {
                type: "SWR1",
                cardioType: "CARDIO_2",
                numOfWeeks: 2
            },
            {
                type: "SWR1",
                cardioType: "CARDIO_1_LAKTAT",
                numOfWeeks: 2
            },
            {
                type: "SK",
                cardioType: "CARDIO_1_SHORT",
                numOfWeeks: 2
            }
        ],
        expectedTrainingFocus: [
            {
                weekday: 1,
                focus: "PHASE",
                content: {
                    WU: 5,
                    BAS: 5,
                    GKS: 5,
                    SWR1KG: 20
                }
            },
            {
                weekday: 3,
                focus: "PHASE",
                content: {
                    WU: 5,
                    BAS: 5,
                    GKS: 5,
                    SWR1KG: 20
                }
            }
        ]
    }
};
export default p;
