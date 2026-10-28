import type { Metadata, Viewport } from "next";
import AuthProvider from "@/components/AuthProvider";
import "@/styles/globals.scss";

const APP_NAME = "hired.log";
const APP_DESCRIPTION =
  "Track all your job applications in one place with hired.log — a free job hunt tracker. Log companies, monitor application statuses, track interviews, and stay organized throughout your entire job search.";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hired-log.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f1117" },
    { media: "(prefers-color-scheme: light)", color: "#f8f9fc" },
  ],
  colorScheme: "dark light",
};

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Free Job Application Tracker & Job Hunt Manager`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "job tracker",
    "job application tracker",
    "free job tracker",
    "track job applications",
    "job hunt tracker",
    "job search tracker",
    "job application manager",
    "job search organizer",
    "job application log",
    "interview tracker",
    "job offer tracker",
    "job pipeline tracker",
    "job application status tracker",
    "career tracker",
    "job hunting app",
    "job search management",
    "job application spreadsheet alternative",
    "employment tracker",
    "job hunt dashboard",
    "job board tracker",
    "hired.log",
  ],
  authors: [{ name: "Keemchard Tamio" }],
  creator: "Keemchard Tamio",
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Free Job Application Tracker`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${APP_NAME} — Track your entire job hunt in one place`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Free Job Application Tracker`,
    description: APP_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: APP_NAME,
    alternateName: ["Job Application Tracker", "Job Hunt Tracker", "Job Tracker"],
    description: APP_DESCRIPTION,
    url: APP_URL,
    applicationCategory: "ProductivityApplication",
    applicationSubCategory: "Job Search Tool",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    featureList: [
      "Track job applications and statuses",
      "Log companies, positions, and contacts",
      "Monitor interview progress",
      "Track job offers and rejections",
      "Dashboard with application analytics",
      "AI-powered job description extraction",
      "Search and filter applications",
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/OnlineOnly",
    },
    author: {
      "@type": "Person",
      name: "Keemchard Tamio",
    },
    keywords: "job tracker, job application tracker, job search, career tracker, interview tracker",
  };

  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t);})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
