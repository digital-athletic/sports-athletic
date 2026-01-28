import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
import OUTSIDE from "../../../assets/data/generator/places/OUTSIDE";
import STUDIO from "../../../assets/data/generator/places/STUDIO";

/**
 * COMBINDED statt CARDIO
 *
 */
const p = {
    displayName: { default: "Persona 15" },
    value: {
        name: "Persona 15",
        workoutData: {
            anamnesisCompleted: true,
            gender: "MALE",
            birthday: "5-4-1988",
            height: 184,
            weight: 88,
            tags: [
                // POSITION
                "POSITION_FIELD",
                // LEVEL
                "LEVEL_ADVANCED",
                // PAINS
                "PAIN_SHOULDER_RIGHT"
            ],
            seasonPhase: {
                type: "COMPETITION",
                numOfWeeks: 18,
                // NO NEED TO SET endDate is only used in anamnesis to calc numOfWeeks
                endDate: "25-10-2019"
            }
        },
        trainingDays: [
            // MONDAY
            {
                active: true,
                weekday: 0,
                duration: 50,
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
                duration: 60,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // THURSDAY
            {
                active: false,
                weekday: 3,
                duration: 40,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
            },
            // FRIDAY
            {
                active: false,
                weekday: 4,
                duration: 35,
                place: "OUTSIDE",
                equipment: OUTSIDE.EQUIPMENT
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
                type: "SWR2",
                numOfWeeks: 3,
                cardioType: "CARDIO_2"
            },
            {
                type: "MAX",
                numOfWeeks: 3,
                cardioType: "CARDIO_1_SHORT"
            },
            {
                type: "SK",
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
                cardioType: "CARDIO_2"
            },
            {
                type: "MAX",
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
                    BAS: 5,
                    CARDIO: 35
                }
            },
            {
                weekday: 2,
                focus: "PHASE",
                content: {
                    MOB: 5,
                    WU: 5,
                    WUSPEZIAL: 3,
                    PREVSHOULDER: 15,
                    MAX: 25,
                    CD: 5
                }
            }
        ]
    }
};
export default p;
