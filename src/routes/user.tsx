import UserLocationTracker from "@/components/user/UserLocationTracker";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/user")({
  component: () => <UserLocationTracker />,
}); 