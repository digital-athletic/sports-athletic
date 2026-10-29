# Glossary

Terms of the training model, with the meanings the coach uses. The glossary defines terms; numbers and rules belong to the spec it links.

## Athlete and plan

| Term | German | Code | Meaning |
|---|---|---|---|
| Anamnesis | Anamnese | | Onboarding questionnaire: sport, position, fitness level, pains, body data and season phase. |
| Fitness level | Fitnesslevel | BEGINNER, ADVANCED, PROFESSIONAL | The athlete's overall level: Beginner, Advanced or Pro. Set in the anamnesis. |
| Age group | Altersgruppe | CHILD, ADOLESCENT, ADULT | Child under 16, adolescent 16 and 17, adult from 18. Adolescents and athletes without a birthday follow the adult rules. Sections and repetition counts depend on it. |
| Playing position | Spielposition | GOAL, GOALKEEPER, FIELD, ... | Position in the sport, from the anamnesis, for example goalkeeper or field player. GOAL and GOALKEEPER count as goalkeeper. Any other position, or none, counts as field player. Goalkeepers get explosive power in place of power endurance and sprint intervals in place of lactate intervals. |
| Season phase | Saisonphase | PAUSE, PREPARATORY, COMPETITION | Where the athlete is in the season: off-season, preparation or competition. Decides the order of the sections. |
| Training plan | Trainingsplan | | Multi-week framework of sections and training days that the app generates from the anamnesis. |
| Section | Abschnitt | | Multi-week block (mesocycle) with one strength emphasis and one cardio intensity. Shown as tiles on the home screen. |
| Hypertrophy | Muskelaufbau | SWR1, SWR2 | Section type for muscle growth. Ranges in [Standard Exercise Progression](./progression/standard-exercise-progression.md). SWR1 and SWR2 currently train the same way. SWR stands for Sprung-, Wurf- und Rumpfkraft. |
| Max strength | Maximalkraft, Maxkraft | MAX, MAX_STRENGTH | Section type with heavy weights and few repetitions, calculated as a percentage of the personal maximum. Advanced and Pro only, from 16. |
| Explosive power | Schnellkraft | SK | Section type with explosive movements. An explosive power session combines explosive power and plyometric exercises, which stay separate skill trees. Speed exercises can be part of it. |
| Power endurance | Schnellkraftausdauer | SA, SAKG | Section type with three skill trees. A session combines SA (weights) or SAKG (bodyweight and other equipment, used when the place has no weights) with power endurance special. SA and SAKG exercises are controlled by repetitions. Speed exercises can be part of it. Goalkeepers get explosive power in its place. |
| Power endurance special | Schnellkraftausdauer Spezial | SAS | Third skill of power endurance, with its own skill tree. Needs no weights, only small equipment such as a towel, bench, medicine ball or markers, so it joins SA and SAKG alike. Its exercises are controlled by duration instead of repetitions. |
| Speed endurance | Schnelligkeitsausdauer | | A different training concept from power endurance. The app has no training category for it. |
| Strength endurance | Kraftausdauer | | Planned training logic for higher repetition ranges. The exercise catalog holds its exercises, but no plan reaches them yet. |
| Strength skill | Kraft-Skill | | Hypertrophy, max strength, explosive power and power endurance. Strength endurance joins once the plan reaches it. Full-body stability is no strength skill. |
| Bodyweight variant | Körpergewicht-Variante | KG suffix, e.g. SWR2KG | Exercises without additional weights such as dumbbells or a barbell. |
| Training day | Trainingstag | | A weekday within a section, with duration and place. |
| Focus | Fokus | PHASE, CARDIO, STABILITY, COMBINED | Orientation of a training day. PHASE trains the section's strength skill (hypertrophy, max strength, explosive power or power endurance). CARDIO trains cardio. STABILITY trains full-body and leg axis stability. COMBINED splits strength and cardio 50/50. |
| Training place | Trainingsort | HOME, STUDIO, HALL, OUTSIDE | Place with its equipment: home, gym, hall, or outside/training ground. |
| Short workout | | | Umbrella term for plan-independent workouts: focus trainings, prevention trainings and imported templates. |
| Focus training | Fokus-Training | | Plan-independent 10 to 20 minute workout for one focus, for example leg axis stability. |
| Prevention training | Präventionstraining | | Plan-independent workout against declared pains, for example knee or shoulder. |
| Athletic Intelligence Workout Language | Athletic Intelligence Workout Language | AIWL | Template language to define workouts in a JSON format |
| Pick | Pick | | Picks a number of exercises by tags at random, for example 3 shoulder prevention exercises. |
| Picks block | Picks-Block | | Part of a short workout made of one or more picks, for example 3 shoulder and then 2 knee prevention exercises. |

## Training session

| Term | German | Code | Meaning |
|---|---|---|---|
| Skill | Skill | | Building block of a session: warm-up, mobility, main work, stability, prevention, cardio. Each gets a minute budget. Main work is the section's strength skill. |
| Skill tree | Skill Tree | | All branches of one skill. Weighted and bodyweight variants are separate trees. |
| Branch | Branch | | Slot for one movement in the plan, for example the squat on Tuesday, holding the same movement at several difficulty levels. Belongs to a skill tree. The plan references branches, not exercises. |
| Branch level | Branch-Level, Stufe | | Difficulty level within a branch, 1 to 6, stored per athlete. Entry mapping in [Branches, Exercises, and Levels](./foundations/branches-exercises-and-levels.md). |
| Level up, level down | Aufstieg, Abstieg | | Move to the next or previous level of the branch, which holds a different exercise. |
| Branch substitution | Branch-Ersatz | | When a branch is exhausted upwards or downwards, the plan swaps in an equivalent branch from the same skill tree. |
| Exercise | Übung | | Catalog entry with muscles, region, side and equipment, plus start and target values per fitness level and gender. |
| One-sided exercise | Einseitige Übung | | Exercise trained one side at a time; the workout lists it twice, left and right. |
| Two-sided exercise | Beidseitige Übung | | Exercise trained with both sides at once; the workout lists it once. |
| Exercise catalog | Übungskatalog, Übungsliste | | The list of all exercises, roughly 1200. Exercise-specific values and exceptions live here, not in the specs. |
| Warm-up | Warm-Up | WU, WUPREV | General warm-up at the start of the session. |
| Special warm-up | Spezielles Warm-Up | WUSPEZIAL | Added only when the athlete has declared pains: extra exercises that warm up the affected body region and prepare it for the training. |
| Speed warm-up | Schnelligkeits-Warm-Up | WUSKSA | Warm-up before explosive power and power endurance. |
| Cool-down | Cool-Down, Stretching | CD | Stretching at the end of the session. |
| Foam roller | Muskeln triggern, Faszienrolle | BR | Self-massage with a foam roller or ball. A separate skill from the cool-down. |
| Mobility | Mobilität | MOB | Exercises for joint mobility. |
| Leg axis stability | Beinachsenstabilität | BAS | One- and two-legged (unilateral and bilateral) jump and stability exercises without additional weight. |
| Full-body stability | Ganzkörperstabilität | GKS, GKSKG | Stability exercises for the trunk and the whole body. |
| Plyometrics | Plyometrie, Schnellkrafttraining | PLYO | Jump and reactive strength exercises, part of explosive power training. Two intensities: high, and low/medium as one category. |
| Set list | Satzliste | | What the athlete works through in a session, in order: sets, rests and support exercises. |
| Set | Satz, Durchgang | | One continuous bout of work, either an uninterrupted series of repetitions or a fixed duration, followed by a planned rest before the next part of the training. |
| Working set | Arbeitssatz | | A set that counts towards the training. |
| Warm-up set | Aufwärmsatz | | Preparatory set with lighter weight that does not count towards the training. |
| Repetition | Wiederholung, Wdh. | | Performing the movement once. |
| Rest | Pause | | Time between two sets or exercises. |
| Superset | Supersatz | | Two exercises trained together, alternating one set of each: the left and right side of one exercise, a lower body with an upper body exercise, or two antagonistic exercises of the same body region, such as a horizontal push with a horizontal pull. |
| Superset rules | Supersatzregeln | | The rules that pick a superset partner, defined in [Plan Workout Generation](./session/plan-workout-generation.md). Prevention and focus trainings skip them: their supersets are authored. The prevention skill inside a planned session skips the movement and muscle rules. No superset ever pairs an exercise with itself. |
| Support exercise | Unterstützungsübung | SUPPORT | Exercise placed in the rest between the 3 or 4 working sets of max strength training, and only there. Not a superset. |
| Muscle soreness | Muskelkater | | Marked on the body silhouette before each training, valid for 24 hours. Rules in [Pain, Soreness, and Prevention](./foundations/pain-soreness-and-prevention.md). |
| Pains | Beschwerden | PAIN | Lasting complaints from the anamnesis, for example knee or shoulder. They drive prevention, the special warm-up and warnings. |

## Progression

| Term | German | Code | Meaning |
|---|---|---|---|
| Feedback | Bewertung, Feedback | TOO_EASY, SUCCEEDED, TOO_HARD | Rating once after the last set of an exercise: too easy, succeeded, too hard. Takes effect in the next session. |
| Ladder | Leiter | | Fixed order in which the load increases, from light to heavy. Applies to every rated exercise. In max strength each working set has its own ladder of weight × repetitions with its own top weight. |
| Step | Schritt | | One move along the ladder towards the heavier end. |
| Progression | Fortschreibung | | How weights, repetitions and levels change from one session to the next. |
| Exercise progress | Übungsfortschritt | | The record of one exercise under one skill: weight, weight type, repetitions, duration, feedback, "too hard" count and max strength steps, with a date. The new workout generator reads, and every completed workout writes, the record of the skill the exercise trains under. Details in [Standard Exercise Progression](./progression/standard-exercise-progression.md#progress-per-skill). |
| Load seed | Lastübernahme | | The weight and weight type a skill copies the first time it trains an exercise, taken from the newest record of that exercise under another skill with the same weight type. Everything else starts fresh. |
| Soft limit | Weiche Grenze | | A target share or quota the generator aims for. Filters and replacements may break it. |

## Weights and max strength

| Term | German | Code | Meaning |
|---|---|---|---|
| Strength test | Krafttest | | Test with five fixed barbell exercises: lift one weight as often as possible. The app estimates the maximum per movement direction from it. From 16 only. Details in [Weight Calculation from Strength Tests](./progression/weight-calculation-from-strength-tests.md). |
| One-repetition maximum, 1RM | Einer-Maximum | | Estimated weight for exactly one repetition, calculated from the strength test with the Epley formula. |
| Movement direction | Bewegungsrichtung | | Family of a movement: knee, hip, horizontal push, horizontal pull, vertical push, vertical pull. The maximum is measured per direction, not per exercise. Vertical pull currently has no strength test. |
| F-Max | F-Max | | The maximum for one specific exercise: the 1RM of its movement direction, converted to the equipment. The conversion is in [Weight Calculation from Strength Tests](./progression/weight-calculation-from-strength-tests.md). |
| Weight type | Gewichtstyp | weightFMax, weightAbsolute | Whether an exercise sets its weight as a percentage of F-Max or in fixed kilograms. |
| Start value, target value | Startwert, Zielwert | | Values stored per exercise, fitness level and gender. The exercise starts at the start value and counts as done when the target value is reached. A skill without exercise progress starts at the start value, or at the load seed when one exists (see Exercise progress and Load seed). |
| Rounding | Rundung | | Calculated weights are rounded to loadable increments, see [Weight Calculation from Strength Tests](./progression/weight-calculation-from-strength-tests.md). |
| Buffer | Puffer | EASY, MEDIUM, HARD | Safety margin to the maximum in percent. A smaller buffer means more repetitions at the same weight. Values in [Max Strength Training](./progression/max-strength-progression.md). |
| Floor | Boden | | Lowest share of F-Max a max strength set may drop to. Another "too hard" at the floor switches to the easier exercise. |
| Final value | Endwert | | Last rung of the last max strength set. "Succeeded" or "too easy" there switches to the harder exercise. |

## Cardio

| Term | German | Code | Meaning |
|---|---|---|---|
| Cardio zone | Cardio-Stufe | CARDIO_1_SHORT, CARDIO_1_LAKTAT, CARDIO_2 to CARDIO_5 | Intensity zone of cardio training, from 1 (hardest) to 5 (easiest). Zones 1 to 3 run as intervals, 4 and 5 as a steady run. |
| Lactate intervals | Laktatintervalle | CARDIO_1_LAKTAT | Zone 1 variant with long running rests. |
| Sprint intervals | Sprintintervalle | CARDIO_1_SHORT | Zone 1 variant with short sprints. Goalkeepers get these instead of lactate intervals. |
| Maximum heart rate | Maximalpuls | | Estimated from age, formula in [Cardio Training System](./session/cardio-training-system.md). |
| Heart-rate band | Pulsbereich | | Target heart-rate range per cardio zone, as a share of the maximum heart rate. |
