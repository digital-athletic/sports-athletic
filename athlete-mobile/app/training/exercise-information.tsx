import { TallLandscapeColumns } from "@/common/TallLandscapeColumns";
import { getExerciseById } from "@/data/exerciseRegistry";
import { ExerciseInformationSections } from "@/features/training/ExerciseInformationContent";
import { Box } from "@/theme/Box";
import { VideoPlayer } from "@/video/VideoPlayer";
import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenParams = {
  exerciseId: string;
};

/**
 * Exercise Information Screen
 *
 * Displays detailed exercise info: video, equipment, muscles, and instructions.
 * Accessible from training overview and active training screens.
 * Legacy: views/training/ExerciseInformation
 */
export default function ExerciseInformationScreen() {
  const params = useLocalSearchParams<
    "/training/exercise-information",
    ScreenParams
  >();
  const insets = useSafeAreaInsets();

  const exerciseIdParam = params.exerciseId;
  const exerciseId =
    typeof exerciseIdParam === "string" ? exerciseIdParam : undefined;
  const exercise = exerciseId ? getExerciseById(exerciseId) : undefined;
  const displayName = (exercise?.displayName || exercise?.name) ?? "";
  const video = exercise?.video;

  return (
    <>
      <Stack.Screen
        options={{
          title: displayName,
        }}
      />

      <Box flex={1} style={{ paddingBottom: insets.bottom }}>
        <TallLandscapeColumns
          fillHeight
          first={
            !!video && (
              <VideoPlayer
                title={displayName}
                source={video}
                fillColumnInTallLandscape
              />
            )
          }
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {exercise && <ExerciseInformationSections exercise={exercise} />}
          </ScrollView>
        </TallLandscapeColumns>
      </Box>
    </>
  );
}
