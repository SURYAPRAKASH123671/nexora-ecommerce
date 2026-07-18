import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Home from "../../page";
import { categories, productSlug } from "../../catalog";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const name = categories.find((item) => productSlug(item) === category);
  if (!name) return {};
  const url = `https://nexora-commerce-surya.kssuryaprakash2.chatgpt.site/categories/${category}`;
  return { title: `${name} | Nexora Shop`, description: `Explore Nexora's ${name} catalogue for India.`, alternates: { canonical: url }, openGraph: { title: `${name} | Nexora`, description: `Explore Nexora's ${name} catalogue for India.`, url } };
}

export default async function CategoryRoute({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const name = categories.find((item) => productSlug(item) === category);
  if (!name || name === "All") notFound();
  return <Home initialView="catalog" initialCategory={name} />;
}
