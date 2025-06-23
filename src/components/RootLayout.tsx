import { useSessionStore } from "@/store/useSessionStore";
import { Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

export default function RootLayout() {
  const { startAuthCheck } = useSessionStore();

  useEffect(() => {
    const cleanup = startAuthCheck();
    return () => cleanup();
  }, [startAuthCheck]);

  return (
    <>
      <Outlet />
    </>
  );
}
