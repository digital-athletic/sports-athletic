import { ImageRequireSource } from "react-native";

export type BodyPartData = {
  name: string;
  width: number;
  height: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  transform?: object[];
  backgroundColor?: string;
  image: ImageRequireSource;
  secondaryImage: ImageRequireSource;
};

export type BodyPartStyle = {
  width: number;
  height: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  transform?: object[];
  backgroundColor?: string;
};
