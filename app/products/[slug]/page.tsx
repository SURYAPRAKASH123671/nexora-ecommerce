import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Home from "../../page";
import { fallbackProducts, productSlug } from "../../catalog";
import groceryManifest from "../../../premium-grocery-source.json";

const canonicalBase = "https://nexora-commerce-surya.kssuryaprakash2.chatgpt.site";

export function generateStaticParams() {
  return [
    ...fallbackProducts.map((product) => ({ slug: productSlug(product.name) })),
    ...groceryManifest.records.map((product) => ({ slug: product.productSlug })),
  ];
}

function groceryProduct(slug: string) {
  const item = groceryManifest.records.find((record) => record.productSlug === slug);
  if (!item) return undefined;
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    description: item.description,
    price: item.price,
    previousPrice: item.mrp,
    stockQuantity: 12 + (item.id % 24),
    imageUrl: item.imagePath,
    categoryName: "Grocery",
    subcategoryName: item.subcategory,
    size: item.size,
    discount: item.discount,
    bestSeller: item.bestSeller,
    rating: item.rating,
    reviews: item.ratingCount,
    shipping: "Free standard delivery · estimated arrival shown after PIN-code check",
    returnPolicy: "Damaged, expired or incorrect items are eligible for support",
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = fallbackProducts.find((item) => productSlug(item.name) === slug) ?? groceryProduct(slug);
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
  const product = fallbackProducts.find((item) => productSlug(item.name) === slug) ?? groceryProduct(slug);
  if (!product) notFound();
  return <Home initialView="product" initialProductSlug={slug} initialProduct={product} />;
}
