import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";

export const metadata: Metadata = {
  title: "Airbnb Clone",
  description: "Browse stays, book dates, and manage listings as a host.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans bg-white">
        <AuthProvider>
          <ToastProvider>
            <WishlistProvider>
              <Navbar />
              {children}
            </WishlistProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
