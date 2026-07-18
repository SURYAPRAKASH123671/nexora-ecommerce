import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Home from "../page";
import type { InfoPage } from "../SupportPages";

const information: Record<string, { title: string; description: string }> = {
  "help-centre": { title: "Help Centre", description: "Answers about Nexora orders, payments, delivery, returns and accounts." },
  "delivery-returns": { title: "Delivery & Returns", description: "Nexora delivery timelines, shipping charges, returns and exchange policy for India." },
  "contact-us": { title: "Contact Us", description: "Contact Nexora Commerce support in Tamil Nadu, India." },
  "our-standards": { title: "Our Standards", description: "The quality, security, delivery and customer-service standards behind Nexora." },
  "privacy-policy": { title: "Privacy Policy", description: "How Nexora collects, protects and uses customer information." },
  "terms-conditions": { title: "Terms & Conditions", description: "The terms governing Nexora accounts, orders, payments, delivery and returns." },
};
const applicationRoutes = new Set(["shop", "cart", "checkout", "compare", "account", "admin"]);

export async function generateMetadata({ params }: { params: Promise<{ route: string }> }): Promise<Metadata> {
  const { route } = await params;
  const info = information[route];
  const title = info?.title ?? (route === "shop" ? "Shop" : route[0]?.toUpperCase() + route.slice(1));
  const description = info?.description ?? `${title} on Nexora Commerce.`;
  const url = `https://nexora-web-virid.vercel.app/${route}`;
  return { title: `${title} | Nexora Commerce`, description, alternates: { canonical: url }, openGraph: { title: `${title} | Nexora Commerce`, description, url } };
}

export default async function PublicRoute({ params }: { params: Promise<{ route: string }> }) {
  const { route } = await params;
  if (information[route]) return <Home initialView="information" initialInfoPage={route as InfoPage} />;
  if (!applicationRoutes.has(route)) notFound();
  const views = { shop: "catalog", cart: "cart", checkout: "checkout", compare: "compare", account: "account", admin: "admin" } as const;
  return <Home initialView={views[route as keyof typeof views]} />;
}
