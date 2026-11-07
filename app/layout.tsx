import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

export const metadata = { title: "Manara · Roommates for Muslim students" };
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Reem+Kufi:wght@500;700&display=swap"
        />
      </head>
      <body className="font-body text-ink antialiased">{children}</body>
    </html>
  );
}