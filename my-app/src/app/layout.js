//import { Geist, Geist_Mono } from "next/font/google";
import { Sniglet } from 'next/font/google'
import "./globals.css";

const sniglet = Sniglet({
  variable: "--font-sniglet",
  subsets: ["latin"],
  weight: ['400']
});

export const metadata = {
  title: "XpressTask",
  description: "XpressTask - Manage your tasks with ease",
};

function Footer() {
  return (
    <footer className="bg-[var(--confetti-500)] text-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="mb-2">© 2025 Kevin Wu | XpressTask</p>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${sniglet.variable} antialiased flex flex-col min-h-screen`}
      >
        {children}
        <Footer />
      </body>
    </html>
  );
}
