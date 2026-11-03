import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/shared/theme";

export default function RootLayout() {
  const {
    colors,
    scheme,
  } = useTheme();
  
  return (
    <>
      <StatusBar
        style={scheme === "dark" ? "light" : "dark"}
      />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Composants partagés",
          }}
        />
      </Stack>
    </>
  );
}
