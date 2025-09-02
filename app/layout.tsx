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

// Resolve the site URL for absolute metadata (OG/Twitter)
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  title: "Find Your Unbreakable Lip Shades - PIXY Hyperlast Glazed Lip Vinyl",
  description: "Yuk, temukan shade dari PIXY Hyperlast Glazed Lip Vinyl yang paling cocok dengan kamu—dari visual based on skin tone sampai shades mapping, we\u2019ve got you covered!",
  openGraph: {
    title: "Find Your Unbreakable Lip Shades - PIXY Hyperlast Glazed Lip Vinyl",
    description: "Yuk, temukan shade dari PIXY Hyperlast Glazed Lip Vinyl yang paling cocok dengan kamu—dari visual based on skin tone sampai shades mapping, we\u2019ve got you covered!",
    type: "website",
    url: "/",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "PIXY Hyperlast Glazed Lip Vinyl - Unbreakable Glaze",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Your Unbreakable Lip Shades - PIXY Hyperlast Glazed Lip Vinyl",
    description: "Yuk, temukan shade dari PIXY Hyperlast Glazed Lip Vinyl yang paling cocok dengan kamu—dari visual based on skin tone sampai shades mapping, we\u2019ve got you covered!",
    images: ["/opengraph-image.png"],
  },
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
        <div className="top-marquee" aria-hidden="true">
          <div className="top-marquee__track">
            <span className="top-marquee__item"><img src="/logo-mandom.png" alt="Mandom" className="marquee-logo mr-4" /><img src="/logo-pixy.png" alt="Pixy" className="marquee-logo-small mr-2" />Hyper Last Glazed Lip Vinyl</span>            
            <span className="top-marquee__item"></span>
            <span className="top-marquee__item">🎨 8 Stunning Shades</span>
            <span className="top-marquee__item">💪 Long-lasting up to 12H</span>
            <span className="top-marquee__item">👑 Transfer-proof</span>
            <span className="top-marquee__item">✨ AirShine-Stay Technology</span>
            <span className="top-marquee__item">#UnbreakableGlaze #CelebrateMyBeauty</span>
            <span className="top-marquee__item"><img src="/logo-mandom.png" alt="Mandom" className="marquee-logo mr-4" /><img src="/logo-pixy.png" alt="Pixy" className="marquee-logo-small mr-2" />Hyper Last Glazed Lip Vinyl</span>  
            <span className="top-marquee__item">🎨 8 Stunning Shades</span>
            <span className="top-marquee__item">💪 Long-lasting up to 12H</span>
            <span className="top-marquee__item">👑 Transfer-proof</span>
            <span className="top-marquee__item">✨ AirShine-Stay Technology</span>
          </div>
        </div>
        {children}
        {/* Decorative bottom-right retro window ornament */}
        <div
          className="hidden md:block fixed bottom-16 right-8 -z-10 w-64 retro-window select-none pointer-events-none"
          aria-hidden="true"
        >
          <div className="retro-titlebar text-xs">pixy-mates.jpg</div>
          <div className="retro-content p-0">
            <img src="/img-ornament.jpg" alt="" className="block w-full h-auto" />
          </div>
        </div>
        {/* Decorative left-center retro window ornament (video) */}
        <div
          className="hidden md:block fixed top-24 left-8 -z-10 w-64 retro-window select-none pointer-events-none"
          aria-hidden="true"
        >
          <div className="retro-titlebar text-xs">introducing.mp4</div>
          <div className="retro-content p-0">
            <video src="/video-ornament.mp4" className="block w-full h-auto" autoPlay muted loop playsInline />
          </div>
        </div>
        {/* Powered by Arketipe - floating button */}
        <a
          href="https://www.arketipe.id/"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-2 left-1/2 -translate-x-1/2 z-50 bg-[#3D3D3D] text-white rounded-full flex items-center gap-1 px-2.5 py-1 text-[10px] shadow-md opacity-90 hover:opacity-100"
        >
          <img src="/logo-arketipe.svg" alt="Arketipe" className="w-3 h-3" />
          <span>Powered by Arketipe</span>
        </a>
      </body>
    </html>
  );
}
