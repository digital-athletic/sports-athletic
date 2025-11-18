import { BodyPartData, BodyPartStyle } from "./types";

export const linkDataToStyle = (
  linkData: BodyPartData,
  width: number,
  height: number
): BodyPartStyle => {
  let styleObject: BodyPartStyle = {
    width: linkData.width * width,
    height: linkData.height * height,
  };
  if (linkData.left) {
    styleObject.left = linkData.left * width;
  }
  if (linkData.right) {
    styleObject.right = linkData.right * width;
  }
  if (linkData.top) {
    styleObject.top = linkData.top * height;
  }
  if (linkData.bottom) {
    styleObject.bottom = linkData.bottom * height;
  }
  if (linkData.transform) {
    styleObject.transform = JSON.parse(JSON.stringify(linkData.transform));
  }
  if (linkData.backgroundColor) {
    styleObject.backgroundColor = linkData.backgroundColor;
  }
  return styleObject;
};

export const createKey = (tag: BodyPartData) => {
  // build identifier from name and position, because same name could appear for multiple zones
  let identifier = tag.name;
  identifier += tag.top ? tag.top : "";
  identifier += tag.right ? tag.right : "";
  identifier += tag.bottom ? tag.bottom : "";
  identifier += tag.left ? tag.left : "";
  return identifier;
};
