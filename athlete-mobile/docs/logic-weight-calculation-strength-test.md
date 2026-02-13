# Weight Calculation and Strength Test Logic

How training weights are determined from strength test results.

**Updated**: 2026-02-13

---

## Overview

The app uses a **test-then-train** model. Athletes perform periodic strength tests with a barbell for each major movement direction (e.g. horizontal push, vertical pull, knee-dominant). From those test results the system estimates the athlete's one-rep max (1RM) and then derives all training weights automatically -- adjusting for equipment type, training phase, and exercise variant.

---

## 1. Estimating One-Rep Max (1RM)

After a strength test the athlete's maximum strength is estimated using the **Epley formula**:

> **1RM = test weight x (1 + reps / 30)**

The athlete lifts a submaximal weight for as many reps as possible. The formula converts that result into an estimated single-rep maximum.

*Example: An athlete bench-presses 80 kg for 8 reps. Their estimated 1RM is 80 x (1 + 8/30) = ~101 kg.*

If the athlete completes only 1 rep, the test weight itself is used as the 1RM.

**Implementation**: `maxWeightByEpley()` in `src/features/training/utils/workoutUtils.ts`

---

## 2. Movement Directions

Strength is tracked independently for 7 movement directions. Each direction gets its own 1RM from a corresponding barbell test exercise:

| Direction | Typical Test Exercise |
|-----------|----------------------|
| Horizontal Push | Barbell bench press |
| Horizontal Pull | Barbell row |
| Vertical Push | Barbell overhead press |
| Vertical Pull | Weighted pull-up |
| Hip | Barbell hip thrust / deadlift |
| Knee | Barbell squat |
| Lower Body | Barbell squat variant |

Each exercise in the training plan is tagged with its movement direction, so the system knows which 1RM to reference when calculating its weight.

---

## 3. Equipment Variants

Tests are performed with a barbell, but training exercises may use dumbbells or single-limb variations. After the 1RM is estimated, the system converts it into adjusted max values for each equipment type:

| Equipment Variant | Percentage of Barbell 1RM | Rationale |
|-------------------|---------------------------|-----------|
| **Barbell** | 100% | Full test result |
| **Dumbbells** (per hand) | 45% | 90% of barbell weight, split across two hands |
| **Single-arm upper body** | 45% | Same as dumbbell per hand |
| **Single-leg barbell** | 45% | Reduced for unilateral loading |
| **Single-leg dumbbell** | 22.5% | 45% for single leg, halved again for one dumbbell |
| **Single-leg with support** | 30% | 60% for supported stance, halved for one dumbbell |

These conversions are stored per movement direction, giving the system a complete lookup table: for any combination of direction + equipment, there is a ready-to-use max value.

*Example: If the barbell bench press 1RM is 100 kg, the per-hand dumbbell max for horizontal push is 45 kg.*

**Implementation**: `calculateAdjustedMaxValues()` in `workoutUtils.ts`

---

## 4. Training Weight by Phase

Each training phase targets a different percentage range of the 1RM. The exact percentage for each exercise is defined per-exercise in the intensity data (configured via the web tool), but the general ranges are:

| Training Phase | German Term | Typical % of 1RM | Goal |
|----------------|-------------|-------------------|------|
| Max Strength | Max-Kraft | 70 -- 90% | Peak force production |
| Hypertrophy | Muskelaufbau | 60 -- 80% | Muscle growth |
| Speed Strength | Schnellkraft | 50 -- 70% | Explosive power |
| Speed Endurance | Schnelligkeitsausdauer | 30 -- 50% | Sustained high-speed output |

During a workout, each exercise's weight is calculated as:

> **Training weight = (intensity %) x (equipment-adjusted max value for that direction)**

The result is then rounded to a practical plate increment (see section 6).

**Implementation**: `deriveWeightForExercise()` in `workoutUtils.ts`; intensity data in `assets/data/generator/intensity/`

---

## 5. Incline Bench Press Adjustment

Incline bench press exercises use a reduced reference weight because the incline angle decreases mechanical advantage compared to a flat bench:

- **Barbell incline bench**: 1RM is reduced by **7.5 kg** compared to flat bench
- **Dumbbell incline bench**: Uses **40% per hand** of the flat bench 1RM (instead of the standard 45%)

The system detects incline exercises by checking for the `INCLINE_BENCH` equipment tag combined with a horizontal push direction.

---

## 6. Weight Rounding

Calculated weights are rounded to the nearest practical plate increment:

| Weight Range | Rounded To | Examples |
|--------------|-----------|----------|
| Up to 25 kg | Nearest 0.5 kg | 12.3 kg -> 12.5 kg |
| 25 -- 100 kg | Nearest 1 kg | 67.4 kg -> 67 kg |
| Over 100 kg | Nearest 2.5 kg | 113 kg -> 112.5 kg |

This ensures prescribed weights can be loaded with standard plates.

**Implementation**: `roundWeightValue()` in `workoutUtils.ts`

---

## 7. Max Strength (MAX_KRAFT) Progression

Max Strength training sessions use an adaptive progression system:

**Structure**: Warmup sets followed by working sets at high intensity.

**Minimum intensity floor** (percentage of 1RM that working sets never drop below):
- Professional: 72.5%
- Advanced: 70%
- Beginner: 70%

**Feedback-based adjustment** after each session:
- "Too hard": +5 kg next session
- "Succeeded" or "Too easy": +2.5 kg next session

The number of working sets and reps-per-weight tables vary by age group and training level.

---

## 8. Strength Test Session Structure

A strength test session follows a fixed protocol:

1. **Warm-up** (~5 minutes) -- Dynamic stretches and mobility exercises
2. **Test exercises** -- For each movement direction being tested:
   - **Set 1** (warm-up): 50% of test weight, 12 reps
   - **Set 2** (warm-up): 75% of test weight, 8 reps
   - **Set 3** (test set): 100% of test weight, max reps
   - 60-second rest between exercises, 120 seconds after the test set

**Starting test weight** depends on whether the athlete has previous results:
- **Returning athlete**: 65% of their last 1RM (or 70% for professionals)
- **First-time athlete**: A default start value defined per exercise

After the test set, the Epley formula (section 1) converts the result into a new 1RM, which then flows through the equipment conversion (section 3) and is stored for all future training weight calculations.

---

## 9. Jump Squat Special Case

Jump squats with dumbbells or barbell use a body-weight-relative formula instead of a straight percentage:

> **Start weight = ((barbell squat 1RM + body weight) x 0.4) -- body weight**

The training weight is capped at **25% of the barbell squat 1RM** to keep the movement safe and explosive.

*Example: Athlete with 120 kg squat 1RM and 80 kg body weight: ((120 + 80) x 0.4) -- 80 = 0 kg (bodyweight only). Cap: 25% of 120 = 30 kg max.*

---

## 10. End-to-End Flow

```
Strength Test
  |
  v
Epley formula  -->  estimated 1RM (barbell)
  |
  v
Equipment conversion  -->  max values per direction per equipment type
  |                        (barbell, dumbbells, one-sided, etc.)
  v
Stored in exerciseProgressStore.testHistory
  and userWorkoutStore.workoutData.maxValues
  |
  v
During workout generation:
  exercise intensity (%) x equipment-adjusted max value
  |
  v
Round to nearest plate increment
  |
  v
Prescribed training weight shown to athlete
  |
  v
After workout: feedback (too easy / succeeded / too hard)
  adjusts weight for next session
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/features/training/utils/workoutUtils.ts` | Core weight formulas (Epley, equipment conversion, rounding, weight derivation) |
| `src/features/training/generators/TrainingGenerator.ts` | Test session generation, set structure |
| `src/features/training/models/MaxValues.ts` | Data model for stored max values |
| `src/constants/workoutConstants.ts` | Max strength constants, intensity tables, rounding thresholds |
| `assets/data/generator/intensity/` | Per-phase intensity definitions (start %, target %, adjustments) |
| `assets/data/generator/TestIntensity.json` | Base intensity template for test parameter adjustments |
