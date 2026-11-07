import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

export const metadata = { title: "Manara — Muslim Student Roommates" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
