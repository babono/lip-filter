import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Press_Start_2P, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const retro = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-retro",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Lipstick Shades Finder Online",
  description: "Virtual lipstick try-on app with various colors and textures",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} ${geistSans.variable} ${geistMono.variable} ${retro.variable} antialiased bg-retro-desktop`}
      >
        {children}
        {/* Decorative bottom-right retro window ornament */}
        <div
          className="hidden md:block fixed bottom-16 right-8 -z-10 w-64 retro-window select-none pointer-events-none"
          aria-hidden="true"
        >
          <div className="retro-titlebar text-xs">img-ornament.jpg</div>
          <div className="retro-content p-0">
            <img src="/img-ornament.jpg" alt="" className="block w-full h-auto" />
          </div>
        </div>
        {/* Decorative left-center retro window ornament (video) */}
        <div
          className="hidden md:block fixed top-24 left-8 -z-10 w-64 retro-window select-none pointer-events-none"
          aria-hidden="true"
        >
          <div className="retro-titlebar text-xs">video-ornament.mp4</div>
          <div className="retro-content p-0">
            <video src="/video-ornament.mp4" className="block w-full h-auto" autoPlay muted loop playsInline />
          </div>
        </div>
      </body>
    </html>
  );
}
