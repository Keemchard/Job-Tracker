import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: "JobTracker | Application Records",
  description: "Track and manage your job applications",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
