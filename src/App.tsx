import { routeTree } from "./routeTree.gen";
import { createRouter, Navigate, RouterProvider } from "@tanstack/react-router";
import { Toaster } from "sonner";

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultNotFoundComponent: () => <Navigate to="/dashboard" />,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </>
  );
}

export default App;
