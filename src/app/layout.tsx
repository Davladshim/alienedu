import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const manrope = localFont({
  src: [
    { path: "./fonts/Manrope-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Manrope-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Manrope-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Manrope-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "AlienEdu",
  description: "Образовательная платформа",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}