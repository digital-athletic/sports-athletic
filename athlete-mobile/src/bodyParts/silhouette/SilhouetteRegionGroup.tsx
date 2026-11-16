import { type FC, type PropsWithChildren } from "react";
import { G } from "react-native-svg";

export type SilhouetteRegionGroupProps = {
  label: string;
  checked: boolean;
  testID: string;
  onPress: () => void;
};

/**
 * A pressable muscle region on iOS and Android. react-native-svg drops role and
 * state props natively, so the label has to name whether the region is checked.
 */
export const SilhouetteRegionGroup: FC<
  PropsWithChildren<SilhouetteRegionGroupProps>
> = ({ label, testID, onPress, children }) => (
  <G accessible accessibilityLabel={label} testID={testID} onPress={onPress}>
    {children}
  </G>
);
