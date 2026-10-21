import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Evolva E-Learning | Platform Pembelajaran Konstruktivis FMIPA",
    template: "%s | Evolva E-Learning",
  },
  description:
    "Platform e-learning berbasis AI untuk Fakultas Matematika dan Ilmu Pengetahuan Alam. Pembelajaran konstruktivis dengan koreksi otomatis menggunakan Groq AI.",
  keywords: [
    "e-learning",
    "FMIPA",
    "konstruktivis",
    "AI",
    "Groq",
    "LKPD",
    "pembelajaran",
    "matematika",
    "sains",
  ],
  authors: [{ name: "Evolva E-Learning Team" }],
  openGraph: {
    title: "Evolva E-Learning",
    description: "Platform E-Learning Konstruktivis berbasis AI untuk FMIPA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${plusJakarta.variable} antialiased`}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "var(--font-plus-jakarta)",
              fontSize: "0.875rem",
              borderRadius: "0.75rem",
              boxShadow:
                "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
            },
            success: {
              iconTheme: { primary: "#4f46e5", secondary: "white" },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
