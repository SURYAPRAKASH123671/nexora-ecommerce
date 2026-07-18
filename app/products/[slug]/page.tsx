import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Home from "../../page";
import { fallbackProducts, productSlug } from "../../catalog";

const canonicalBase = "https://nexora-web-virid.vercel.app";

export function generateStaticParams() {
  return fallbackProducts.map((product) => ({ slug: productSlug(product.name) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = fallbackProducts.find((item) => productSlug(item.name) === slug);
  if (!product) return {};
  const url = `${canonicalBase}/products/${slug}`;
  return {
    title: `${product.name} | Nexora`,
    description: product.description,
    alternates: { canonical: url },
    openGraph: { title: product.name, description: product.description, url, type: "website", images: [product.imageUrl] },
    twitter: { card: "summary_large_image", title: product.name, description: product.description, images: [product.imageUrl] },
  };
}

export default async function ProductRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!fallbackProducts.some((product) => productSlug(product.name) === slug)) notFound();
  return <Home initialView="product" initialProductSlug={slug} />;
}
