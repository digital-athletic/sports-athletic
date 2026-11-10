import { type Page } from "@playwright/test";
import path from "node:path";
import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { createMaxExerciseProfile } from "./mocks/stores/profiles/maxExerciseProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { mockWakeLock } from "./mocks/wakeLock";
import {
  BasePage,
  TrainingListPage,
  TrainingOverviewPage,
  WorkoutPage,
} from "./pages";
import {
  getComparableCompletedWorkout,
  getComparableExerciseProgress,
  getCompletedWorkouts,
  getTrainingStorageState,
  getUserProfileStorageState,
} from "./utils/storage";

const SUPERSET_WORKOUT_FILE = path.join(
  __dirname,
  "mocks",
  "files",
  "checklist-superset-workout.json",
);

// Imports the superset workout file and opens it as a checklist. The file
// plans a timed warm up (list index 0), then a superset of two timed
// exercises with two sets each: indices 2 and 6, 4 and 8.
const openSupersetChecklist = async (page: Page) => {
  const basePage = new BasePage(page);
  const trainingOverviewPage = new TrainingOverviewPage(page);
  const trainingListPage = new TrainingListPage(page);

  await page.goto("/");
  await basePage.expectLoggedIn();
  await page.getByRole("button", { name: "Additional trainings" }).click();
  await page.getByRole("button", { name: "Your trainings" }).click();
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import training" }).click();
  await (await chooserPromise).setFiles(SUPERSET_WORKOUT_FILE);
  await page.getByRole("button", { name: "Superset check" }).click();
  await page.getByRole("button", { name: /^At home, \d+ pieces$/ }).click();
  await expect(
    page.getByRole("heading", { name: "Training Overview" }),
  ).toBeVisible({ timeout: 15000 });
  await trainingOverviewPage.startAsChecklist();
  await trainingListPage.expectVisible();
  return trainingListPage;
};

test.describe("Training list: checklist session", () => {
  test.describe("Standard progression", () => {
    test.use({ profile: createCompletedProfile(), signedIn: true });

    test("athlete completes every row of a checklist session", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);
      await page.clock.install();

      const workoutPage = new WorkoutPage(page);
      const trainingOverviewPage = new TrainingOverviewPage(page);
      const trainingListPage = new TrainingListPage(page);

      await page.goto("/");
      await workoutPage.expectLoggedIn();
      await workoutPage.startWorkout("Tuesday");

      await trainingOverviewPage.startAsChecklist();
      await trainingListPage.expectVisible();
      await trainingListPage.completeAll();

      await workoutPage.returnToHome();
    });

    test("athlete skips the first row and still completes the session", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);
      await page.clock.install();

      const workoutPage = new WorkoutPage(page);
      const trainingOverviewPage = new TrainingOverviewPage(page);
      const trainingListPage = new TrainingListPage(page);

      await page.goto("/");
      await workoutPage.expectLoggedIn();
      await workoutPage.startWorkout("Tuesday");

      await trainingOverviewPage.startAsChecklist();
      await trainingListPage.expectVisible();

      // Assumes row 0 of the Tuesday plan is a skippable exercise, not a
      // strength test row (whose sheet has no skip control).
      await trainingListPage.skipRow("training-list-row-0");
      await trainingListPage.completeAll();

      await workoutPage.returnToHome();
    });
  });

  test.describe("Rest after a set", () => {
    test.use({ profile: createCompletedProfile(), signedIn: true });

    test("athlete sees the next set while resting, skips the rest and continues with that set", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);
      await page.clock.install();

      const workoutPage = new WorkoutPage(page);
      const trainingOverviewPage = new TrainingOverviewPage(page);
      const trainingListPage = new TrainingListPage(page);

      await page.goto("/");
      await workoutPage.expectLoggedIn();
      await workoutPage.startWorkout("Tuesday");
      await trainingOverviewPage.startAsChecklist();
      await trainingListPage.expectVisible();

      const { rowId, restIndex, nextExerciseName } =
        await trainingListPage.firstRowFollowedByRest();
      await trainingListPage.startRowIntoRest(rowId);
      await expect(trainingListPage.nextSetPreview).toContainText(
        nextExerciseName,
      );

      await trainingListPage.skipRest();
      await expect
        .poll(() => trainingListPage.currentSheetSet())
        .toBe(`training-list-sheet-set-${restIndex + 1}`);
      await trainingListPage.expectRowCompleted(rowId);
      await expect
        .poll(
          async () =>
            (await getTrainingStorageState(page))?.exerciseList?.[restIndex],
        )
        .toEqual(
          expect.objectContaining({
            exerciseId: "999999",
            completed: true,
            skipped: true,
          }),
        );
    });
  });

  test.describe("Parity with the step-by-step view", () => {
    test.use({ profile: createCompletedProfile(), signedIn: true });

    test("checklist and step-by-step view store the same data for the same plan and skipped row", async ({
      page,
      storageState,
    }) => {
      test.setTimeout(120000);
      if (typeof storageState !== "object") {
        throw new Error("The profile fixture must seed a storage state");
      }

      // Step-by-step view: the helper skips the timed warmup row (row 0)
      await mockSupabaseAuth(page);
      await mockWakeLock(page);
      const stepByStepWorkoutPage = new WorkoutPage(page);

      await page.goto("/");
      await stepByStepWorkoutPage.expectLoggedIn();
      await stepByStepWorkoutPage.startWorkout("Tuesday");
      await stepByStepWorkoutPage.beginWorkout();
      await stepByStepWorkoutPage.completeWorkout();
      await stepByStepWorkoutPage.returnToHome();

      const stepByStep = {
        workout: await getComparableCompletedWorkout(page),
        progress: await getComparableExerciseProgress(page),
        profile: await getUserProfileStorageState(page),
        training: await getTrainingStorageState(page),
      };

      // Checklist view: reseed the same profile, then run the same plan
      await page.evaluate((items) => {
        localStorage.clear();
        for (const { name, value } of items) localStorage.setItem(name, value);
      }, storageState.origins[0].localStorage);
      await page.clock.install();
      const trainingOverviewPage = new TrainingOverviewPage(page);
      const trainingListPage = new TrainingListPage(page);

      await page.goto("/");
      await stepByStepWorkoutPage.expectLoggedIn();
      await stepByStepWorkoutPage.startWorkout("Tuesday");
      await trainingOverviewPage.startAsChecklist();
      await trainingListPage.expectVisible();
      await trainingListPage.skipRow("training-list-row-0");
      await trainingListPage.completeAll();
      await stepByStepWorkoutPage.returnToHome();

      const checklist = {
        workout: await getComparableCompletedWorkout(page),
        progress: await getComparableExerciseProgress(page),
        profile: await getUserProfileStorageState(page),
        training: await getTrainingStorageState(page),
      };

      expect(checklist.workout).toEqual(stepByStep.workout);
      expect(checklist.progress).toEqual(stepByStep.progress);
      expect(checklist.profile).toEqual(stepByStep.profile);
      expect(checklist.training.exerciseList).toBeNull();
      expect(checklist.training).toEqual(stepByStep.training);
    });
  });

  test.describe("Superset with Next", () => {
    test.use({ profile: createCompletedProfile(), signedIn: true });

    test("athlete completes a superset with Next only after one tap on the first exercise", async ({
      page,
    }) => {
      test.setTimeout(90000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);
      await page.clock.install();

      const trainingListPage = await openSupersetChecklist(page);

      // The checklist names the skills in the order of the overview, and the
      // superset starts the full body stability skill.
      await expect(trainingListPage.skillTitles).toHaveText([
        "Warm-Up",
        "Full body stability",
      ]);
      await expect(trainingListPage.skillTitle(2)).toHaveText(
        "Full body stability",
      );
      const superset = trainingListPage.superset(2);
      await expect(superset).toBeVisible();
      await expect(superset.getByTestId("training-list-row-2")).toBeVisible();
      await expect(superset.getByTestId("training-list-row-4")).toBeVisible();
      // The drawn warm up exercise varies, its timed set always shows seconds
      await expect(trainingListPage.entry("training-list-row-0")).toContainText(
        /\d+ s/,
      );

      await trainingListPage.startRow("training-list-row-0");
      const shownSets: (string | null)[] = [];
      do {
        await trainingListPage.expectNextButton();
        shownSets.push(await trainingListPage.currentSheetSet());
      } while (!(await trainingListPage.completeSheetSet({ rest: "wait" })));

      expect(shownSets).toEqual([
        "training-list-sheet-set-0",
        "training-list-sheet-set-2",
        "training-list-sheet-set-4",
        "training-list-sheet-set-6",
        "training-list-sheet-set-8",
      ]);
      await trainingListPage.expectAllRowsCompleted();
      await expect(
        trainingListPage.nextArrow("training-list-row-2"),
      ).toHaveCount(0);
      await expect(
        trainingListPage.nextArrow("training-list-row-4"),
      ).toHaveCount(0);
    });

    test("athlete holds a timed set, the countdown stands still, then resumes and completes it with Next", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);
      await page.clock.install();

      const trainingListPage = await openSupersetChecklist(page);
      await trainingListPage.startRow("training-list-row-0");
      await trainingListPage.holdTimer();
      const heldTime = await trainingListPage.sheetTimer.textContent();
      await page.clock.fastForward("00:30");

      await expect(trainingListPage.sheetTimer).toHaveText(heldTime ?? "");
      await trainingListPage.expectNextDisabled();

      await trainingListPage.resumeTimer();
      await trainingListPage.completeSheetSet();

      expect(await trainingListPage.currentSheetSet()).toBe(
        "training-list-sheet-set-2",
      );
    });
  });

  test.describe("MAX exercise feedback via checklist", () => {
    test.use({ profile: createMaxExerciseProfile(), signedIn: true });

    test("athlete rates a MAX exercise too easy in the checklist and its last set moves two ladder steps", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);
      await page.clock.install();

      const workoutPage = new WorkoutPage(page);
      const trainingOverviewPage = new TrainingOverviewPage(page);
      const trainingListPage = new TrainingListPage(page);

      await page.goto("/");
      await workoutPage.expectLoggedIn();
      await workoutPage.startWorkout("Tuesday");
      await expect(page.getByText("KH-Bankdrücken (Max-K)")).toBeVisible();

      await trainingOverviewPage.startAsChecklist();
      await trainingListPage.expectVisible();

      // One entry holds the warm up and working sets; feedback follows the last set
      await trainingListPage.completeFromRow(
        trainingListPage.rowByExerciseName("KH-Bankdrücken (Max-K)"),
        { exerciseName: "KH-Bankdrücken (Max-K)", feedback: "too_easy" },
      );
      await trainingListPage.completeAll();

      await workoutPage.returnToHome();

      // Same assertion workout.spec.ts makes for the sequential flow:
      // 75% x 2 moves two ladder steps up to 75% x 5
      await workoutPage.startWorkout("Tuesday");
      expect(await workoutPage.getLastMaxRepetition("8")).toEqual(
        expect.objectContaining({ weightPercentage: 75, repetitions: 5 }),
      );
    });
  });

  test.describe("Leaving before the last set", () => {
    test.use({ profile: createCompletedProfile(), signedIn: true });

    test("athlete discards the training with back and lands on the overview without a result", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);
      await page.clock.install();

      const workoutPage = new WorkoutPage(page);
      const trainingOverviewPage = new TrainingOverviewPage(page);
      const trainingListPage = new TrainingListPage(page);

      await page.goto("/");
      await workoutPage.expectLoggedIn();
      const workoutsBefore = await getCompletedWorkouts(page);
      await workoutPage.startWorkout("Tuesday");
      await trainingOverviewPage.startAsChecklist();
      await trainingListPage.expectVisible();

      await trainingListPage.discard();

      await trainingOverviewPage.expectVisible();
      await expect(page.getByText("Training evaluation")).toBeHidden();
      // A cleared start keeps home from resuming the discarded session.
      await expect
        .poll(async () => {
          const state = await getTrainingStorageState(page);
          return {
            start: state?.time?.start,
            viewMode: state?.trainingViewMode,
          };
        })
        .toEqual({ start: undefined, viewMode: null });
      expect(await getCompletedWorkouts(page)).toBe(workoutsBefore);
    });

    test("athlete aborts the training with back after a completed set and starts it again from the weekday selection", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);
      await page.clock.install();

      const workoutPage = new WorkoutPage(page);
      const trainingOverviewPage = new TrainingOverviewPage(page);
      const trainingListPage = new TrainingListPage(page);

      await page.goto("/");
      await workoutPage.expectLoggedIn();
      const workoutsBefore = await getCompletedWorkouts(page);
      await workoutPage.startWorkout("Tuesday");
      await trainingOverviewPage.startAsChecklist();
      await trainingListPage.expectVisible();

      await trainingListPage.startRow("training-list-row-0");
      await trainingListPage.completeSheet();
      await trainingListPage.abort();

      await expect(
        page.getByRole("heading", { name: "Which workout do you start?" }),
      ).toBeVisible();
      await expect
        .poll(async () => (await getTrainingStorageState(page))?.exerciseList)
        .toBeNull();
      expect(await getCompletedWorkouts(page)).toBe(workoutsBefore);

      // The weekday selection generates a fresh list for the new levels.
      await page.getByRole("button", { name: /Tuesday/i }).click();
      await workoutPage.skipMuscleSoreness();
      await trainingOverviewPage.expectVisible();
    });

    test("athlete reopens the app during a checklist session and aborts the resumed training with back", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);
      await page.clock.install();

      const workoutPage = new WorkoutPage(page);
      const trainingOverviewPage = new TrainingOverviewPage(page);
      const trainingListPage = new TrainingListPage(page);

      await page.goto("/");
      await workoutPage.expectLoggedIn();
      await workoutPage.startWorkout("Tuesday");
      await trainingOverviewPage.startAsChecklist();
      await trainingListPage.expectVisible();
      await trainingListPage.startRow("training-list-row-0");
      await trainingListPage.completeSheet();

      // Home replaces itself with the checklist, so no screen lies below it.
      await page.goto("/");
      await trainingListPage.expectVisible();
      await trainingListPage.abort();

      await expect(
        page.getByRole("heading", { name: "Which workout do you start?" }),
      ).toBeVisible();
      await expect
        .poll(async () => (await getTrainingStorageState(page))?.exerciseList)
        .toBeNull();
    });

    test("athlete finishes early with open sets and sees the result of an aborted training", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);
      await page.clock.install();

      const workoutPage = new WorkoutPage(page);
      const trainingOverviewPage = new TrainingOverviewPage(page);
      const trainingListPage = new TrainingListPage(page);

      await page.goto("/");
      await workoutPage.expectLoggedIn();
      const workoutsBefore = await getCompletedWorkouts(page);
      await workoutPage.startWorkout("Tuesday");
      await trainingOverviewPage.startAsChecklist();
      await trainingListPage.expectVisible();

      await trainingListPage.finishEarly();

      await expect(page.getByText("Training evaluation")).toBeVisible();
      // An aborted training is not added to the history.
      await workoutPage.returnToHome();
      await workoutPage.expectLoggedIn();
      expect(await getCompletedWorkouts(page)).toBe(workoutsBefore);
    });
  });
});
