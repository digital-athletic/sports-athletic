import HOME from "../generator/places/HOME";
import HALL from "../generator/places/HALL";
import OUTSIDE from "../../../assets/data/generator/places/OUTSIDE";
import STUDIO from "../../../assets/data/generator/places/STUDIO";

/**
 * Cardio kann nicht andere Sections haben als der Fokus
 *
 */
const p = {
    displayName: { default: "Persona 25" },
    value: {
        name: "Persona 25",
        workoutData: {
            anamnesisCompleted: true,
            gender: "MALE",
            birthday: "30-7-1992",
            height: 201,
            weight: 98,
            tags: [
                // POSITION
                "POSITION_FIELD",
                // LEVEL
                "LEVEL_PROFESSIONAL",
                // PAINS
                "PAIN_HUEFTE_RECHTS"
            ],
            seasonPhase: {
                type: "PREPATORY",
                numOfWeeks: 8,
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
                duration: 45,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
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
                active: true,
                weekday: 6,
                duration: 45,
                place: "STUDIO",
                equipment: STUDIO.EQUIPMENT
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
                type: "SK",
                numOfWeeks: 2,
                cardioType: "CARDIO_1LAKTAT"
            }
        ],
        expectedTrainingFocus: [
            {
                weekday: 2,
                focus: "PHASE",
                content: {
                    MOB: 5,
                    WU: 5,
                    WUSPEZIAL: 3,
                    PREVKNEE: 5,
                    SWR1: 25
                }
            },
            {
                weekday: 6,
                focus: "CARDIO",
                content: {
                    MOB: 5,
                    BAS: 10,
                    CARDIO: 35
                }
            }
        ]
    }
};
export default p;
