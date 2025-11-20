import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { FC } from "react";
import { useWindowDimensions } from "react-native";
import { ScreenMetadata } from "./types";

type Props = {
  title: string;
  source: string;
  screen: ScreenMetadata;
  fullScreenDisabled: boolean;
  endVideo: () => void;
  toggleFullScreen: (screen: ScreenMetadata) => void;
  setIsVideoPaused: (isPaused: boolean) => void;
};

// FIXME: Stub implementation, to be replaced with video playback functionality in
// https://github.com/sports-athletics/sports-athletic/issues/21
export const VideoPlayer: FC<Props> = ({ title, screen }) => {
  const { width } = useWindowDimensions();
  const rotate = screen.isFullScreen
    ? screen.orientation === "LANDSCAPE-RIGHT"
      ? "-90deg"
      : "90deg"
    : "0deg";

  const aspectRatio = screen.isFullScreen ? 2 : 1;

  return (
    <Box
      flex={1}
      alignItems="center"
      justifyContent="center"
      width={width}
      aspectRatio={aspectRatio}
      style={{ transform: [{ rotate }] }}
      backgroundColor="black"
    >
      <Text color="white">{`TODO: Play video ${title}`}</Text>
    </Box>
  );
};
