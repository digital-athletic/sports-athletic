import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { ThemeColor } from "@/theme/theme";
import React, { type FC } from "react";

export type SectionWeekBarsProps = {
  sectionWeeksCount: number;
  startWeek: number;
  intensity: number;
  sectionIndex: number;
  activeWeek: number;
};

/**
 * Visual representation of training plan weeks with intensity-based bars.
 * Displays week numbers and progress bars indicating completed/active/future weeks.
 */
export const SectionWeekBars: FC<SectionWeekBarsProps> = ({
  sectionWeeksCount,
  startWeek,
  intensity,
  sectionIndex,
  activeWeek,
}) => {
  // Determines bar background color based on week state.
  const getBarColor = (
    weekIndex: number,
    activeWeek: number,
    sectionIndex: number,
    sectionWeeksCount: number
  ): ThemeColor => {
    // Active week
    if (weekIndex === activeWeek) {
      return "primary";
    }

    // First week of first section
    if (weekIndex === 0 && sectionIndex === 0) {
      if (activeWeek === -1) {
        // Before first week (new training plan)
        return "primary";
      } else if (activeWeek > -1 && activeWeek < sectionWeeksCount) {
        // Passed week
        return "darkGrey2";
      }
    }

    // Passed week in section
    if (activeWeek > -1 && activeWeek < sectionWeeksCount) {
      return "darkGrey2";
    }

    // Default: not yet reached
    return "lightGrey2";
  };

  const weeks = Array.from({ length: sectionWeeksCount });

  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      alignSelf="stretch"
    >
      <Box
        flex={1}
        justifyContent="space-evenly"
        alignItems="center"
        alignSelf="stretch"
        flexDirection="column"
      >
        {/* Week numbers section */}
        <Box
          flex={13 - intensity}
          justifyContent="space-evenly"
          alignItems="center"
          alignSelf="stretch"
          flexDirection="row"
        >
          {weeks.map((_, i) => (
            <React.Fragment key={`week-${i}`}>
              <Box
                flex={3}
                justifyContent="center"
                alignItems="center"
                flexDirection="column"
              >
                <Text variant="body" fontSize={12}>
                  {startWeek + i}
                </Text>
              </Box>
              {i < sectionWeeksCount - 1 && (
                <Box key={`week-space-${i}`} flex={2} />
              )}
            </React.Fragment>
          ))}
        </Box>

        {/* Progress bars section */}
        <Box
          flex={intensity}
          justifyContent="space-evenly"
          alignItems="center"
          alignSelf="stretch"
          flexDirection="row"
        >
          {weeks.map((_, i) => {
            const barColor = getBarColor(
              i,
              activeWeek,
              sectionIndex,
              sectionWeeksCount
            );

            return (
              <React.Fragment key={`bar-${i}`}>
                <Box
                  flex={3}
                  justifyContent="center"
                  alignItems="center"
                  flexDirection="column"
                  alignSelf="stretch"
                >
                  <Box flex={sectionWeeksCount - i - 1} alignSelf="stretch" />
                  <Box
                    flex={i + 1}
                    alignSelf="stretch"
                    backgroundColor={barColor}
                  />
                </Box>
                {i < sectionWeeksCount - 1 && (
                  <Box key={`bar-space-${i}`} flex={2} />
                )}
              </React.Fragment>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};
