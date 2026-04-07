import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar"; 
import ItineraryTray from "../components/ItineraryTray";
import MobileTabBar from "../components/MobileTabBar";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "Davao Explore",
  description: "Discover the best spots in Davao and beyond.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Davao Explore",
  },
  formatDetection: {
    telephone: false,
  },
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
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <TripProvider> 
            
            <Navbar /> 
            
            <main className="flex-grow flex flex-col pb-tab-bar md:pb-0">
              {children}
            </main>

            {/* 🧭 Floating Itinerary Tray */}
            <ItineraryTray /> 

            {/* 📱 Mobile Bottom Tab Bar */}
            <MobileTabBar />

          </TripProvider>
        </ToastProvider>
      </body>
    </html>
  );
}