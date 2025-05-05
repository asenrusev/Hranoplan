import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Храноплан - Планиране на хранителен режим",
  description:
    "Хранопланът е модерен подход към организирането на хранителния режим, който ви позволява да планирате и приготвяте ястията си предварително. Спестете време и пари с нашия интелигентен планировчик на менюта.",
  keywords:
    "храноплан, хранителен режим, планиране на меню, българска кухня, рецепти, хранителни планове, здравословно хранене",
  authors: [{ name: "Hranoplan Team" }],
  creator: "Hranoplan",
  publisher: "Hranoplan",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://hranoplan.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}
        style={{ background: "#fff" }}
      >
        {children}
      </body>
    </html>
  );
}
