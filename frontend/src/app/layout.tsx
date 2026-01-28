import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/contexts/SidebarContext";

// Premium Fonts - Space Grotesk (similar to Overused Grotesk)
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HeadlessX v2.0",
  description: "Advanced Stealth Scraping Engine",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground [font-synthesis-weight:none]`}>
        <Providers>
          <SidebarProvider>
            <div className="flex h-screen overflow-hidden view-container">
              <Sidebar />
              <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-container premium-bg">
                <div className="space-y-4 p-4 md:p-8 pt-6 max-w-[1600px] mx-auto w-full">
                  {children}
                </div>
              </main>
            </div>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
