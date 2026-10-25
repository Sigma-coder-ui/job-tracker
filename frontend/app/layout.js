import "./globals.css";

export const metadata = {
  title: "Job Tracker",
  description: "Keep every job application in one place.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
