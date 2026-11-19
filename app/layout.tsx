import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaStatus } from "@/components/PwaStatus";

export const metadata: Metadata = {
  title: "Papan Proyek — SF Group",
  description:
    "Papan proyek internal untuk mengelola tugas antar divisi: backlog, pengerjaan, review, dan selesai.",
  applicationName: "Papan Proyek",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Papan Proyek",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem("sf-papan-proyek-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = stored ? stored === "dark" : prefersDark;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <PwaStatus />
      </body>
    </html>
  );
}
