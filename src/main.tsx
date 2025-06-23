import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AudioProvider } from "@/contexts/AudioContext.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
    <QueryClientProvider client={queryClient}>
      <AudioProvider>
        <App />
      </AudioProvider>
      {/* Uncomment the line below to enable React Query Devtools */}
      {/*<ReactQueryDevtools initialIsOpen={false}/>*/}
    </QueryClientProvider>
  </ThemeProvider>
);
