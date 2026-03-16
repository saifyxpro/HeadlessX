'use client';


import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useState } from "react";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ReactLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <ReactLenis
            root
            options={{
                allowNestedScroll: true,
                prevent: (node) => {
                    return node instanceof HTMLElement && Boolean(node.closest('[data-native-scroll="true"]'));
                },
            }}
        >
            <QueryClientProvider client={queryClient}>
                <NextThemesProvider attribute="class" defaultTheme="light" forcedTheme="light">
                    {children}
                </NextThemesProvider>
            </QueryClientProvider>
        </ReactLenis>
    );
}
