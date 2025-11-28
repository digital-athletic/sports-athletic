import { Box } from "@/theme/Box";
import { FC, useState } from "react";
import { ScreenMetadata } from "./types";
import { VideoPlayer } from "./VideoPlayer";

type Props = {
  isPause: boolean;
  videoTitle: string;
  videoName: string;
  title: string;
  pictureName: string;
  size: string;
  // Binding to redux store actions
  // generatorActions: GeneratorActionsTypes;
  changeVideoProperties: (
    screen: ScreenMetadata,
    videoIsPlaying: boolean,
    startPosition: number,
  ) => void;
  fullScreenDisabled?: boolean;
  playButtonDisabled?: boolean;
  onClose?: () => void;
};

// FIXME: Stub implementation, to be replaced with video playback functionality in
// https://github.com/sports-athletics/sports-athletic/issues/21
export const Video: FC<Props> = ({
  videoTitle,
  videoName,
  fullScreenDisabled = false,
}) => {
  const [videoPath] = useState("");
  const [screen] = useState<ScreenMetadata>({
    isFullScreen: false,
    orientation: "PORTRAIT",
  });

  const handleVideoEnd = () => {
    // Logic to handle video end
    console.log("TODO: Handle video playback ended");
  };

  const handleVideoPause = (isPaused: boolean) => {
    // Logic to handle video pause
    console.log("TODO: Pause video - ", isPaused);
  };

  const handleToggleFullScreen = (updatedScreen: ScreenMetadata) => {
    // Logic to handle full screen toggle
    console.log("TODO: Toggle full screen - ", updatedScreen);
  };

  return (
    <Box>
      <VideoPlayer
        title={videoTitle ? videoTitle : videoName}
        endVideo={handleVideoEnd}
        source={videoPath}
        screen={screen}
        toggleFullScreen={handleToggleFullScreen}
        setIsVideoPaused={handleVideoPause}
        fullScreenDisabled={fullScreenDisabled}
      />
    </Box>
  );
};
