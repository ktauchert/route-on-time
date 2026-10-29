import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { themeBootScript } from "@/lib/preferences";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Route on Time",
  description: "Route on Time",
  icons: {
    icon: [{ url: "/icons/192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Route on Time",
  },
};

export const viewport: Viewport = {
  themeColor: "#2457c5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={cn("font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
