import { createFileRoute } from "@tanstack/react-router";
import PoiManager from "@/components/poimanager/PoiManager";

export const Route = createFileRoute("/dashboard")({
  //beforeLoad: async () => {
  //  const currentUser = LocalStorage.get(EStorageKey.AUTH_USER);
  //  if (!currentUser) {
  //    throw redirect({to: '/auth/login'})
  //  }
  //},
  component: PoiManager,
});
