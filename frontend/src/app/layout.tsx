import AuthProvider from "@/components/providers/auth-provider";
import type { Metadata } from "next";
import { Suspense } from "react";
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
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
              Checking your session...
            </div>
          }
        >
          <AuthProvider>{children}</AuthProvider>
        </Suspense>
        <Toaster position="top-right" richColors />
   </body>
    </html>
  );
}
