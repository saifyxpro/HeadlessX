'use client';


import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useState } from "react";
import { SidebarProvider } from "@/contexts/SidebarContext";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <NextThemesProvider attribute="class" defaultTheme="light" forcedTheme="light">
                {children}
            </NextThemesProvider>
        </QueryClientProvider>
    );
}
