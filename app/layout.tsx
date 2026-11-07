import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { Figtree, Reem_Kufi } from "next/font/google";

const body = Figtree({ subsets: ["latin"], variable: "--font-body" });
const display = Reem_Kufi({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-display" });

export const metadata = { title: "Manara · Roommates for Muslim students" };
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="font-body text-ink antialiased">{children}</body>
    </html>
  );
}
