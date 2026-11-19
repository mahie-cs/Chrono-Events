import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Momentum",
  description: "A clean, minimalist event tracker for the Department of CSE, SIMT Engineering College.",
  // Served from /public so Next's metadata-file loader (which breaks on folder
  // paths containing an apostrophe) is never involved.
  icons: {
    icon: [{ url: "/icon.jpg", type: "image/jpeg" }],
    apple: [{ url: "/apple-icon.jpg", type: "image/jpeg" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Runs before first paint so a saved dark theme never flashes light.
const themeScript = `try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-bg font-sans text-fg">{children}</body>
    </html>
  );
}
