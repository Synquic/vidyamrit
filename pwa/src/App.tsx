// import PWABadge from "./components/pwa/PWABadge.tsx";
import { RouterProvider } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
//
import { AuthProvider } from "./providers/AuthProvider";
import "./lib/i18n";
import { Toaster } from "@/components/ui/sonner";
//
import { router } from "./routes/router"; // Use the robust router with permissions

const queryClient = new QueryClient();

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors />
        {/* <PWABadge /> */}
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
