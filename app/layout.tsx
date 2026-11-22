import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer, Bounce } from "react-toastify";
import Providers from "./provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EduCore | Learning Management System",
    template: "%s | EduCore",
  },
  description:
    "EduCore is a learning management platform that helps students access exams, study materials, view results, and communicate with teachers in one place.",
  applicationName: "EduCore",
  keywords: [
    "EduCore",
    "LMS",
    "Learning Management System",
    "Online Learning",
    "Student Portal",
    "Exams",
    "Study Materials",
    "Education",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          transition={Bounce}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
