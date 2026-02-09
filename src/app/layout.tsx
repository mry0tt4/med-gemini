import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Archivo, Playfair_Display } from "next/font/google"; // turbo
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-cursive", // Using this for the "cursive" requirement
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800"], // Italic often looks best in 400-600
});

export const metadata: Metadata = {
  title: "Med-Gemini Triage | AI-Powered Clinical Assistant",
  description: "Intelligent triage system powered by Med-Gemma and Gemini 3 Pro for faster, more accurate clinical decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        // ... existing appearance config ...
        variables: {
          colorPrimary: "hsl(160, 84%, 39%)",
          colorBackground: "hsl(210, 20%, 4%)",
          colorText: "hsl(210, 20%, 98%)",
          colorInputBackground: "hsl(210, 18%, 7%)",
          colorInputText: "hsl(210, 20%, 98%)",
        },
        elements: {
          card: "bg-surface-1 border border-border rounded-lg",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton: "bg-surface-2 border-border text-foreground hover:bg-surface-3 rounded-lg",
          formButtonPrimary: "bg-primary hover:bg-primary/90 rounded-lg",
          footerActionLink: "text-primary hover:text-primary/80",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${plusJakartaSans.variable} ${archivo.variable} ${playfair.variable} min-h-screen bg-background antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
