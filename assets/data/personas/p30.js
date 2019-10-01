import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
import OUTSIDE from "../../../assets/data/generator/places/OUTSIDE";
import STUDIO from "../../../assets/data/generator/places/STUDIO";

const p = {
    displayName: { default: "Persona 30" },
    value: {
        name: "Persona 30",
        workoutData: {
            anamnesisCompleted: true,
            gender: "MALE",
            birthday: "23-4-2006",
            height: 149,
            weight: 48,
            tags: [
                // POSITION
                "POSITION_FIELD",
                // LEVEL
                "LEVEL_BEGINNER"
                // PAINS
            ],
            seasonPhase: {
                type: "PREPATORY",
                numOfWeeks: 14,
                // NO NEED TO SET endDate is only used in anamnesis to calc numOfWeeks
                endDate: "25-10-2019"
            }
        },
        trainingDays: [
            // MONDAY
            {
                active: true,
                weekday: 0,
                duration: 35,
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // TUESDAY
            {
                active: false,
                weekday: 1,
                duration: 50,
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
                duration: 75,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
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
                active: true,
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
                numOfWeeks: 6,
                cardioType: "CARDIO_3"
            },
            {
                type: "SK",
                numOfWeeks: 2,
                cardioType: "CARDIO_2"
            },
            {
                type: "SWR1",
                numOfWeeks: 4,
                cardioType: "CARDIO_1_LAKTAT"
            },
            {
                type: "SA",
                numOfWeeks: 2,
                cardioType: "CARDIO_2"
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
                    SWR1KG: 20
                }
            },
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
                weekday: 5,
                focus: "PHASE",
                content: {
                    WU: 5,
                    BAS: 5,
                    SWR1KG: 15
                }
            }
        ]
    }
};
export default p;
