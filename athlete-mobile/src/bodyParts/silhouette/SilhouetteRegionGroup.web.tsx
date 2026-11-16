import { type FC, type PropsWithChildren } from "react";
import { type SilhouetteRegionGroupProps } from "./SilhouetteRegionGroup";

/**
 * A clickable muscle region in the browser. The region is a plain DOM group,
 * because react-native-svg turns `onPress` into touch responder props that
 * React DOM rejects. The role must not be "button": react-native-web would swap it for
 * a `<button>`, which is invalid inside `<svg>`.
 */
export const SilhouetteRegionGroup: FC<
  PropsWithChildren<SilhouetteRegionGroupProps>
> = ({ label, checked, testID, onPress, children }) => (
  <g
    role="checkbox"
    aria-checked={checked ? "true" : "false"}
    aria-label={label}
    data-testid={testID}
    onClick={onPress}
  >
    {children}
  </g>
);
