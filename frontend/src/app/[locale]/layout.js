import { Poppins } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "react-hot-toast";
import RouteTracker from "@/components/layout/RouteTracker";

const geistPoppins = Poppins({
  variable: "--font-poppins",
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

export const metadata = {
  title: "Math Mentor",
  description: "Your Personal Guide to Mastering Math - Interactive Lessons, Practice, and Support for All Levels",
};

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      data-theme="math-mentor"
      className={`${geistPoppins.variable}`}
    >
      <body suppressHydrationWarning className="bg-base-200">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <RouteTracker />
          {children}
          <Toaster position="top-right" reverseOrder={false} duration={5000} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
