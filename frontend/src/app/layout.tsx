import AuthProvider from "@/components/providers/auth-provider";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediCore HMS",
  description: "Hospital Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
  <AuthProvider>{children}</AuthProvider>
  <Toaster position="top-right" richColors />
   </body>
    </html>
  );
}
