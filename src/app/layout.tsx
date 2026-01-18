import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import Header from "@/components/Header";
import SignupPrompt from "@/components/SignupPrompt";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "TransitPulse - Real-time Transit Updates",
  description: "Safety-first, utility-first structured rider reports and official broadcast feed for public transit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-slate-900`}
      >
        <ThemeProvider>
          <AuthProvider>
            <a href="#main-content" className="skip-to-main">
              Skip to main content
            </a>
            <Header />
            <main id="main-content">{children}</main>
            <SignupPrompt />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
