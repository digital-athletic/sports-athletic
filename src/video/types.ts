export type Orientation =
  | "PORTRAIT"
  | "LANDSCAPE-LEFT"
  | "PORTRAIT-UPSIDEDOWN"
  | "LANDSCAPE-RIGHT";

export type ScreenMetadata = {
  isFullScreen: boolean;
  orientation: Orientation;
};
