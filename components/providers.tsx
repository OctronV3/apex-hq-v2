"use client";

import { useState } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ApexAuthProvider } from "@/lib/auth";
import { WorkspaceProvider } from "@/lib/workspace";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ApexAuthProvider>
        <WorkspaceProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider delay={80}>
              {children}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  className:
                    "bg-[#0a0a0a] border-[#222222] text-white",
                }}
              />
            </TooltipProvider>
          </QueryClientProvider>
        </WorkspaceProvider>
      </ApexAuthProvider>
    </ThemeProvider>
  );
}
