import { Toaster } from "react-hot-toast";
import "./globals.css";
import Gaurd from "./guard";
import { ClientI18nProvider } from "./i18n-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Gaurd>
          <ClientI18nProvider>
            {children}
            <Toaster />
          </ClientI18nProvider>
        </Gaurd>
      </body>
    </html>
  );
}
