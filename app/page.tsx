import type { Metadata } from "next";
import { HomePage } from "./_components/home-page";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Page() {
  return <HomePage />;
}
