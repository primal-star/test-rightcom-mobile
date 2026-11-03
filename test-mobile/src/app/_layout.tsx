import "@/shared/lib/parse";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/shared/theme";
import { SessionProvider } from "@/features/auth/session";

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
      <SessionProvider>
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
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="login"
            options={{
              title: "Connexion",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="posts/[postId]"
            options={{
              title: "Publication",
            }}
          />
          <Stack.Screen
            name="posts/new"
            options={{
              title: "Nouvelle publication",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="signup"
            options={{
              title: "Inscription",
              headerShown: false,
            }}
          />
        </Stack>
      </SessionProvider>
    </>
  );
}
