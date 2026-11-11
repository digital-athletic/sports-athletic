import { SwipeToDeleteRow } from "@/common/SwipeToDeleteRow";
import { ColumnListRow } from "@/features/training/ColumnListRow";
import { router } from "expo-router";
import { type FC } from "react";

type CustomWorkoutRowProps = {
  workoutId: string;
  name: string;
  /** Without it the row has no swipe or accessibility delete action. */
  deleteAction?: { label: string; onDelete: () => void };
};

export const CustomWorkoutRow: FC<CustomWorkoutRowProps> = ({
  workoutId,
  name,
  deleteAction,
}) => {
  const openWorkout = () =>
    router.navigate({
      pathname: "/training/muscle-soreness",
      params: { type: workoutId },
    });
  if (!deleteAction) {
    return <ColumnListRow title={name} onPress={openWorkout} />;
  }
  const { label, onDelete } = deleteAction;
  return (
    <SwipeToDeleteRow deleteLabel={label} onDelete={onDelete}>
      <ColumnListRow
        title={name}
        onPress={openWorkout}
        accessibilityActions={[{ name: "delete", label }]}
        onAccessibilityAction={({ nativeEvent }) => {
          if (nativeEvent.actionName === "delete") {
            onDelete();
          }
        }}
      />
    </SwipeToDeleteRow>
  );
};
