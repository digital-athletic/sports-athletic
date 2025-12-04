import { useResponsiveProp } from "@shopify/restyle";
import { useLayoutEffect, useRef, useState, type FC } from "react";
import { StyleSheet, View } from "react-native";
import { Box } from "../theme/Box";
import { Text } from "../theme/Text";
import { useTheme } from "../theme/theme";

export type SpeechBubbleProps = {
  text: string;
  centered: boolean;
};

export const SpeechBubble: FC<SpeechBubbleProps> = ({ text, centered }) => {
  const theme = useTheme();
  const triangleWidth = 16;
  const triangleHeight = Math.floor((triangleWidth * 3) / 4);

  const fontSize = useResponsiveProp(
    centered ? { phone: 20, tablet: 32 } : { phone: 16, tablet: 28 },
  );

  const containerRef = useRef<View>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    containerRef.current?.measure((_x, _y, _width, height) => {
      setHeight(height);
    });
  }, []);

  const triangleStyle = centered
    ? {
        borderRightWidth: triangleHeight,
        borderTopWidth: triangleWidth,
        borderTopColor: theme.colors.primary,
      }
    : {
        bottom: 0.7 * height,
        left: -1 * triangleWidth,
        borderLeftWidth: triangleWidth,
        borderBottomWidth: triangleHeight,
        borderBottomColor: theme.colors.primary,
      };

  return (
    <View ref={containerRef} collapsable={false}>
      <Box
        flexDirection="column"
        alignItems={centered ? "center" : undefined}
        justifyContent={centered ? "center" : undefined}
      >
        <Box
          width="100%"
          backgroundColor="primary"
          justifyContent="center"
          padding="l"
        >
          <Text
            variant={centered ? "title" : "sectionTitle"}
            color="white"
            style={{ fontSize }}
          >
            {text}
          </Text>
        </Box>
        <Box style={[styles.triangle, triangleStyle]} />
      </Box>
    </View>
  );
};

const styles = StyleSheet.create({
  triangle: {
    position: "relative",
    width: 0,
    height: 0,
    borderStyle: "solid",
    backgroundColor: "transparent",
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
  },
});
