import {
  SafeAreaView,
  type SafeAreaViewProps,
} from "react-native-safe-area-context";
import { spacing, useTheme } from "@/shared/theme";

export type ScreenProps = SafeAreaViewProps & {
  horizontalPadding?: number;
};

export function Screen({
  horizontalPadding = spacing.md,
  edges = ["top", "right", "bottom", "left"],
  style,
  ...props
}: ScreenProps) {
  const { colors } = useTheme();
  
  return (
    <SafeAreaView
      {...props}
      edges={edges}
      style={[
        {
          flex: 1,
          backgroundColor: colors.background,
          paddingHorizontal: horizontalPadding,
        },
        style,
      ]}
    />
  );
}
