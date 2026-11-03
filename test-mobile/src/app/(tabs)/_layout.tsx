import { Tabs, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { useSession } from "@/features/auth/hooks/useSession";
import { useTheme } from "@/shared/theme";

export const unstable_settings = {
  initialRouteName: "feed",
};

export default function TabsLayout() {
  const user = useSession().user;
  const colors = useTheme().colors;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.surface,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Publications",
          tabBarLabel: "Fil",
          headerRight: () => user ? <LogoutButton /> : null,
          tabBarIcon: ({
            color,
            size,
          }) => (
            <SymbolView
              name={{
                ios: "list.bullet",
                android: "view_list",
                web: "view_list",
              }}
              tintColor={color}
              size={size}
              accessible={false}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="publish"
        options={{
          title: "Publier",
          headerShown: false,
          tabBarIcon: ({
            color,
            size,
          }) => (
            <SymbolView
              name={{
                ios: "square.and.pencil",
                android: "edit_square",
                web: "edit_square",
              }}
              tintColor={color}
              size={size}
              accessible={false}
            />
          ),
        }}
        listeners={{
          tabPress: (event) => {
            if (!user) {
              event.preventDefault();
              router.push("/login");
            }
          },
        }}
      />
    </Tabs>
  );
}
