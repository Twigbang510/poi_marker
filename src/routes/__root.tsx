import RootLayout from "@/components/RootLayout";
import { createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => <RootLayout />,
  validateSearch: (search: Record<string, unknown>) => ({}),
});
