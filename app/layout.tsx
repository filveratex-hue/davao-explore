import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar"; 
import ItineraryTray from "../components/ItineraryTray"; // 👈 1. Import the Tray
import { ToastProvider } from "../context/ToastContext"; 
import { TripProvider } from "../context/TripContext"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Catigan Explore",
  description: "Discover the best spots in upland Davao.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning /* 👈 FIX: Added here to stop HTML injection warnings */
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning> {/* 👈 FIX: Added here too for safety */}
        {/* The Alarm System (Notifications) */}
        <ToastProvider>
          {/* The GPS (Itinerary Logic) */}
          <TripProvider> 
            
            <Navbar /> 
            
            <main className="flex-grow flex flex-col">
              {children}
            </main>

            {/* 🧭 The Floating Navigator */}
            <ItineraryTray /> 

          </TripProvider>
        </ToastProvider>
      </body>
    </html>
  );
}