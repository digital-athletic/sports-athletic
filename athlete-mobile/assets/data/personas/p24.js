import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
import STUDIO from "../../../assets/data/generator/places/STUDIO";

const p = {
    displayName: { default: "Persona 24" },
    value: {
        name: "Persona 24",
        workoutData: {
            anamnesisCompleted: true,
            gender: "FEMALE",
            birthday: "21-1-2003",
            height: 163,
            weight: 56,
            tags: [
                // POSITION
                "POSITION_FIELD",
                // LEVEL
                "LEVEL_PROFESSIONAL"
                // PAINS
            ],
            seasonPhase: {
                type: "PAUSE",
                numOfWeeks: 13,
                // NO NEED TO SET endDate is only used in anamnesis to calc numOfWeeks
                endDate: "25-10-2019"
            }
        },
        trainingDays: [
            // MONDAY
            {
                active: true,
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
                place: "HOME",
                equipment: HOME.EQUIPMENT
            },
            // THURSDAY
            {
                active: true,
                weekday: 3,
                duration: 55,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // FRIDAY
            {
                active: false,
                weekday: 4,
                duration: 45,
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
                numOfWeeks: 3,
                cardioType: "CARDIO_4"
            },
            {
                type: "SWR2",
                numOfWeeks: 3,
                cardioType: "CARDIO_4"
            },
            {
                type: "SWR1",
                numOfWeeks: 3,
                cardioType: "CARDIO_4"
            },
            {
                type: "SWR2",
                numOfWeeks: 3,
                cardioType: "CARDIO_4"
            },
            {
                type: "SWR1",
                numOfWeeks: 1,
                cardioType: "CARDIO_4"
            }
        ],
        expectedTrainingFocus: [
            {
                weekday: 0,
                focus: "COMBINED",
                content: {
                    BR: 5,
                    MOB: 5,
                    WU: 5,
                    SWR1: 35,
                    CARDIO: 20,
                    CD: 5
                }
            },
            {
                weekday: 2,
                focus: "STABILITY",
                content: {
                    MOB: 5,
                    WU: 5,
                    BAS: 10,
                    GKS: 15
                }
            },
            {
                weekday: 3,
                focus: "PHASE",
                content: {
                    WU: 5,
                    MOB: 10,
                    CD: 5,
                    SWR1KG: 35
                }
            }
        ]
    }
};
export default p;
