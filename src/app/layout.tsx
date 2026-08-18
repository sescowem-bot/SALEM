import type { Metadata } from "next";
import "./globals.css";

const description =
  "Salem Medical Laboratories offers blood tests, microbiology, molecular diagnostics, home sample collection and secure e-copy results.";

export const metadata: Metadata = {
  title: {
    default: "Salem Medical Laboratories | Pathology & Diagnostics",
    template: "%s | Salem Medical Laboratories",
  },
  description,
  openGraph: {
    title: "Salem Medical Laboratories",
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Salem Medical Laboratories",
    description,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- root layout is the correct place for this in the App Router */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
