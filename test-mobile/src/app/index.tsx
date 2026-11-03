import { Redirect } from "expo-router";
import { useSession } from "@/features/auth/hooks/useSession";

export default function Index() {
  const user = useSession().user;

  return (
    <Redirect
      href={user ? "/feed" : "/login"}
    />
  );
}
