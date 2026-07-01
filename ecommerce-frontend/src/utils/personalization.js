const STORAGE_KEY = "nexora_personalization_v1";
const MAX_RECENT = 12;

const EMPTY_PROFILE = {
  clicks: {},
  wishlist: {},
  cartAdds: {},
  orders: {},
  recentlyViewed: [],
  updatedAt: null,
};

export const readPersonalization = () => {
  if (typeof window === "undefined") return EMPTY_PROFILE;

  try {
    return {
      ...EMPTY_PROFILE,
      ...JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}"),
    };
  } catch (error) {
    return EMPTY_PROFILE;
  }
};

export const trackProductSignal = (product, signal) => {
  if (!product?.id || typeof window === "undefined") return;

  const profile = readPersonalization();
  const id = String(product.id);
  const bucket = {
    view: "clicks",
    click: "clicks",
    wishlist: "wishlist",
    cart: "cartAdds",
    order: "orders",
  }[signal];

  if (bucket) {
    profile[bucket] = {
      ...profile[bucket],
      [id]: (profile[bucket][id] || 0) + 1,
    };
  }

  if (signal === "view" || signal === "click") {
    profile.recentlyViewed = [
      id,
      ...profile.recentlyViewed.filter((itemId) => itemId !== id),
    ].slice(0, MAX_RECENT);
  }

  profile.updatedAt = new Date().toISOString();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
};

export const trackOrderItems = (items) => {
  items.forEach((item) => trackProductSignal(item, "order"));
};

export const rankProducts = (products, query = "") => {
  const search = query.trim().toLowerCase();
  const profile = readPersonalization();

  return [...products]
    .map((product, index) => ({
      product,
      score: productScore(product, profile, search) - index * 0.001,
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product);
};

export const getRecentlyViewedProducts = (products, limit = 8) => {
  const profile = readPersonalization();
  const productMap = new Map(products.map((product) => [String(product.id), product]));

  return profile.recentlyViewed
    .map((id) => productMap.get(String(id)))
    .filter(Boolean)
    .slice(0, limit);
};

export const getRecommendations = (products, currentProduct, limit = 8) => {
  const profile = readPersonalization();
  const candidates = products.filter((product) => product.id !== currentProduct?.id);

  return candidates
    .map((product) => ({
      product,
      score:
        productScore(product, profile, "") +
        similarityScore(product, currentProduct) +
        categoryMomentum(product.category, profile, products),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product)
    .slice(0, limit);
};

export const getSimilarProducts = (products, currentProduct, limit = 6) =>
  products
    .filter((product) => product.id !== currentProduct?.id)
    .map((product) => ({
      product,
      score: similarityScore(product, currentProduct),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product)
    .slice(0, limit);

export const getFrequentlyBoughtTogether = (products, currentProduct, limit = 3) => {
  const categories = {
    automotive: ["watches", "electronics", "travel"],
    mobiles: ["electronics", "watches"],
    electronics: ["home", "travel", "mobiles"],
    fashion: ["watches", "beauty"],
    watches: ["fashion", "electronics"],
    home: ["electronics", "beauty"],
  };
  const preferred = categories[currentProduct?.category] || ["electronics", "fashion", "home"];

  return products
    .filter((product) => product.id !== currentProduct?.id)
    .filter((product) => preferred.includes(product.category))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, limit);
};

export const getDynamicHomeSections = (products) => {
  const profile = readPersonalization();
  const topCategory = preferredCategory(profile, products);
  const categoryProducts = rankProducts(
    products.filter((product) => product.category === topCategory)
  ).slice(0, 4);
  const recent = getRecentlyViewedProducts(products, 4);
  const recommended = rankProducts(products).slice(0, 4);

  return [
    {
      title: topCategory === "automotive" ? "Performance garage picks" : "Recommended for your taste",
      subtitle: topCategory === "automotive"
        ? "Because your browsing leans toward premium cars."
        : "Based on clicks, cart adds, wishlist, and orders.",
      products: categoryProducts.length ? categoryProducts : recommended,
    },
    {
      title: "Recently viewed",
      subtitle: "Quickly return to products you inspected.",
      products: recent,
    },
    {
      title: "You may also like",
      subtitle: "Ranked by your shopping signals.",
      products: recommended,
    },
  ].filter((section) => section.products.length > 0);
};

const productScore = (product, profile, search) => {
  const id = String(product.id);
  const text = `${product.name} ${product.brand} ${product.category}`.toLowerCase();
  const searchScore = search
    ? (text.includes(search) ? 40 : 0) + (product.name.toLowerCase().startsWith(search) ? 18 : 0)
    : 0;

  return searchScore
    + (profile.clicks[id] || 0) * 5
    + (profile.wishlist[id] || 0) * 8
    + (profile.cartAdds[id] || 0) * 12
    + (profile.orders[id] || 0) * 18
    + categoryMomentum(product.category, profile, [product])
    + (product.rating || 0);
};

const similarityScore = (product, currentProduct) => {
  if (!currentProduct) return product.rating || 0;

  let score = 0;
  if (product.category === currentProduct.category) score += 30;
  if (product.brand === currentProduct.brand) score += 10;
  if ((product.price || 0) >= (currentProduct.price || 0) * 0.65 &&
      (product.price || 0) <= (currentProduct.price || 0) * 1.45) {
    score += 7;
  }
  score += product.rating || 0;
  return score;
};

const categoryMomentum = (category, profile, products) => {
  const idsByCategory = new Set(
    products.filter((product) => product.category === category).map((product) => String(product.id))
  );
  const allSignals = [profile.clicks, profile.wishlist, profile.cartAdds, profile.orders];

  return allSignals.reduce((sum, signalBucket, index) => {
    const multiplier = [1, 2, 3, 4][index];
    return sum + Object.entries(signalBucket).reduce((bucketSum, [id, value]) => (
      idsByCategory.has(id) ? bucketSum + value * multiplier : bucketSum
    ), 0);
  }, 0);
};

const preferredCategory = (profile, products) => {
  const scores = {};
  products.forEach((product) => {
    scores[product.category] = (scores[product.category] || 0) + productScore(product, profile, "");
  });

  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || "electronics";
};
