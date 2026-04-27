import { type ReactNode } from "react";
import { Header } from "./Header";
import { LegalFooter } from "./LegalFooter";

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-6 lg:max-w-5xl">
        {children}
      </main>
      <LegalFooter />
    </div>
  );
}
