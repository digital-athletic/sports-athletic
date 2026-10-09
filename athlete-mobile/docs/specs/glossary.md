# Glossary

Terms of the training model, with the meanings the coach uses.

## Athlete and plan

| Term | German | Code | Meaning |
|---|---|---|---|
| Anamnesis | Anamnese | | Onboarding questionnaire: sport, position, training level, pains, body data and season phase. |
| Training level | Trainingslevel | BEGINNER, ADVANCED, PROFESSIONAL | The athlete's overall level: Beginner, Advanced or Pro. Set in the anamnesis. |
| Age group | Altersgruppe | CHILD, ADOLESCENT, ADULT | Child under 16, adolescent 16 and 17, adult from 18. Sections and repetition counts depend on it. |
| Playing position | Spielposition | GOAL, FIELD, ... | Position in the sport, from the anamnesis, for example goalkeeper or field player. Goalkeepers get different intervals in cardio training. Currently every athlete gets the goalkeeper intervals. |
| Season phase | Saisonphase | PAUSE, PREPARATORY, COMPETITION | Where the athlete is in the season: off-season, preparation or competition. Decides the order of the sections. |
| Training plan | Trainingsplan | | Multi-week framework of sections and training days that the app generates from the anamnesis. |
| Section | Abschnitt | | Multi-week block (mesocycle) with one strength emphasis and one cardio intensity. Shown as tiles on the home screen. |
| Hypertrophy | Muskelaufbau | SWR1, SWR2 | Section type for muscle growth: 8 to 12 repetitions per set, or 30 to 50 seconds with weights and 30 to 60 seconds without. SWR1 and SWR2 currently train the same way. SWR stands for Sprung-, Wurf- und Rumpfkraft. |
| Max strength | Maximalkraft, Maxkraft | MAX, MAX_KRAFT | Section type with heavy weights and few repetitions, calculated as a percentage of the personal maximum. Advanced and Pro only, from 16. |
| Explosive power | Schnellkraft | SK | Section type with explosive movements. |
| Power endurance | Schnellkraftausdauer | SA | Section type. The plan currently replaces it with explosive power everywhere. |
| Bodyweight variant | Körpergewicht-Variante | KG suffix, e.g. SWR2KG | Exercises without additional weights such as dumbbells or a barbell. |
| Training day | Trainingstag | | A weekday within a section, with duration and place. |
| Focus | Fokus | PHASE, CARDIO, STABILITY, COMBINED | Orientation of a training day: strength and prevention (code PHASE), cardio, stability, or combined. Combined currently means strength plus cardio only. |
| Training place | Trainingsort | HOME, STUDIO, HALL, OUTSIDE | Place with its equipment: home, gym, hall, or outside/training ground. |
| Short workout | | | Umbrella term for plan-independent workouts: focus trainings and prevention trainings. |
| Focus training | Fokus-Training | | Plan-independent 10 to 20 minute workout for one focus, for example leg axis stability. |
| Prevention training | Präventionstraining | | Plan-independent workout against declared pains, for example knee or shoulder. |

## Training session

| Term | German | Code | Meaning |
|---|---|---|---|
| Skill | Skill | | Building block of a session: warm-up, mobility, main work, stability, prevention, cardio. Each gets a minute budget. Main work is the strength work of the section: hypertrophy, explosive power or max strength. |
| Skill tree | Skill Tree | | All branches of one skill. Weighted and bodyweight variants are separate trees. |
| Branch | Branch | | Slot for one movement in the plan, for example the squat on Tuesday, holding the same movement at several difficulty levels. Belongs to a skill tree. The plan references branches, not exercises. |
| Branch level | Branch-Level, Stufe | | Difficulty level within a branch, 1 to 6, stored per athlete. Entry: Beginner 1, Advanced 2, Pro 3. |
| Level up, level down | Aufstieg, Abstieg | | Move to the next or previous level of the branch, which holds a different exercise. |
| Branch substitution | Branch-Ersatz | | When a branch is exhausted upwards or downwards, the plan swaps in an equivalent branch from the same skill tree. |
| Exercise | Übung | | Catalog entry with muscles, region, side, equipment, and start and target values per training level and gender. |
| Exercise catalog | Übungskatalog | | The list of all exercises, roughly 1200. |
| Warm-up | Warm-Up | WU, WUPREV | General warm-up at the start of the session. |
| Special warm-up | Spezielles Warm-Up | WUSPEZIAL | Added only when the athlete has declared pains: extra exercises that warm up the affected body region and prepare it for the training. |
| Speed warm-up | Schnelligkeits-Warm-Up | WUSKSA | Warm-up before explosive power and speed work. |
| Cool-down | Cool-Down | CD | Wind-down at the end of the session. |
| Foam roller | Muskeln triggern, Faszienrolle | BR | Self-massage with a foam roller or ball. |
| Mobility | Mobilität | MOB | Exercises for joint mobility. |
| Leg axis stability | Beinachsenstabilität | BAS | One- and two-legged (unilateral and bilateral) jump and stability exercises without additional weight. |
| Full-body stability | Ganzkörperstabilität | GKS, GKSKG | Stability exercises for the trunk and the whole body. |
| Plyometrics | Plyometrie | PLYO | Jump and reactive strength exercises. |
| Set list | Satzliste | | What the athlete works through in a session, in order: sets, rests and support exercises. |
| Set | Satz, Durchgang | | One continuous bout of work, either an uninterrupted series of repetitions or a fixed duration, followed by a planned rest before the next part of the training. |
| Working set | Arbeitssatz | | A set that counts towards the training. |
| Warm-up set | Aufwärmsatz | | Preparatory set with lighter weight that does not count towards the training. |
| Repetition | Wiederholung, Wdh. | | Performing the movement once. |
| Rest | Pause | | Time between two sets or exercises. |
| Superset | Supersatz | | Two exercises trained together, alternating one set of each. For example left and right side, or a lower body with an upper body exercise. |
| Support exercise | Unterstützungsübung | SUPPORT | Exercise placed in the rest between the 3 or 4 working sets of max strength training, and only there. Not a superset. |
| Muscle soreness | Muskelkater | | Marked on the body silhouette before each training, valid for 24 hours. Exercises for the affected area are replaced. With more than one sore area the training is cancelled. |
| Pains | Beschwerden | PAIN | Lasting complaints from the anamnesis, for example knee or shoulder. They drive prevention and warnings. |

## Progression

| Term | German | Code | Meaning |
|---|---|---|---|
| Feedback | Bewertung, Feedback | TOO_EASY, SUCCEEDED, TOO_HARD | Rating once after the last set of an exercise: too easy, succeeded, too hard. Takes effect in the next session. |
| Ladder | Leiter | | Fixed order in which the load increases, from light to heavy. Applies to every rated exercise. In max strength each working set has its own ladder of weight × repetitions with its own top weight. |
| Step | Schritt | | One move along the ladder towards the heavier end. |
| Progression | Fortschreibung | | How weights, repetitions and levels change from one session to the next. |

## Weights and max strength

| Term | German | Code | Meaning |
|---|---|---|---|
| Strength test | Krafttest | | Test with five fixed barbell exercises (squat, deadlift, shoulder press, row, bench press): lift one weight as often as possible. The app estimates the maximum per movement direction from it. |
| One-repetition maximum, 1RM | Einer-Maximum | | Estimated weight for exactly one repetition, calculated from the strength test with the Epley formula. |
| Movement direction | Bewegungsrichtung | | Family of a movement: knee, hip, horizontal push, horizontal pull, vertical push, vertical pull. The maximum is measured per direction, not per exercise. Vertical pull currently has no strength test. |
| F-Max | F-Max | | The maximum for one specific exercise: the 1RM of its movement direction, converted to the equipment. The conversion is in [Weight Calculation from Strength Tests](./progression/weight-calculation-from-strength-tests.md). |
| Weight type | Gewichtstyp | weightFMax, weightAbsolute | Whether an exercise sets its weight as a percentage of F-Max or in fixed kilograms. |
| Start value, target value | Startwert, Zielwert | | Values stored per exercise, training level and gender. The exercise starts at the start value and counts as done when the target value is reached. |
| Rounding | Rundung | | Calculated weights are rounded to loadable increments, see [Weight Calculation from Strength Tests](./progression/weight-calculation-from-strength-tests.md). |
| Buffer | Puffer | EASY, MEDIUM, HARD | Safety margin to the maximum in percent: Advanced 20, 15 or 10, Pro 15, 10 or 5. A smaller buffer means more repetitions at the same weight. |
| Floor | Boden | | 65% of F-Max. No set drops below it. Another "too hard" at the floor switches to the easier exercise. |
| Final value | Endwert | | Last rung of the last set: Advanced 80% × 3, Pro 90% × 2. "Succeeded" or "too easy" there switches to the harder exercise. |

## Cardio

| Term | German | Code | Meaning |
|---|---|---|---|
| Cardio zone | Cardio-Stufe | CARDIO_1_SHORT, CARDIO_1_LAKTAT, CARDIO_2 to CARDIO_5 | Intensity zone of cardio training, from 1 (hardest) to 5 (easiest). Zones 1 to 3 run as intervals, 4 and 5 as a steady run. |
| Lactate intervals | Laktatintervalle | CARDIO_1_LAKTAT | Zone 1 variant: 30 s work, 4 min running rest. |
| Sprint intervals | Sprintintervalle | CARDIO_1_SHORT | Zone 1 variant: 10 s sprint, 80 s rest. Goalkeepers get these instead of lactate intervals. Currently every athlete gets them. |
| Maximum heart rate | Maximalpuls | | Estimated from age with the Tanaka formula: 208 - 0.7 × age. |
| Heart-rate band | Pulsbereich | | Target heart-rate range per cardio zone, as a share of the maximum heart rate. Example: zone 5 at 55 to 65%. |
