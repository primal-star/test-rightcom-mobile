import { Tabs, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { SessionHeaderAction } from "@/features/auth/components/SessionHeaderAction";
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
          headerRight: () => <SessionHeaderAction />,
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
              router.push({
                pathname: "/login",
                params: {
                  returnTo: "/publish",
                },
              });
            }
          },
        }}
      />
    </Tabs>
  );
}
