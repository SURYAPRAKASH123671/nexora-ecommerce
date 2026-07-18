"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";
import type { Product } from "./catalog";
import {
  getProductProfile,
  resolveConfiguration,
  type ProductConfiguration,
  type ProductMedia,
} from "./product-details";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

type Props = {
  product: Product;
  liked: boolean;
  onBack: () => void;
  onWishlist: (productId: number) => void;
  onAdd: (product: Product, configuration?: ProductConfiguration) => void;
  onBuyNow: (product: Product, configuration?: ProductConfiguration) => void;
  onMessage: (message: string) => void;
};

export default function PremiumProductPage({
  product,
  liked,
  onBack,
  onWishlist,
  onAdd,
  onBuyNow,
  onMessage,
}: Props) {
  const profile = getProductProfile(product.id);
  const [colourId, setColourId] = useState(
    profile?.colours[0]?.id ?? "standard",
  );
  const [storageId, setStorageId] = useState(
    profile?.storage[0]?.id ?? "standard",
  );
  const [mediaIndex, setMediaIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [pin, setPin] = useState("560001");
  const [pinDraft, setPinDraft] = useState("560001");
  const [emiMonths, setEmiMonths] = useState(12);
  const [question, setQuestion] = useState("");
  const [questionStatus, setQuestionStatus] = useState("");
  const [questionBusy, setQuestionBusy] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<
    Array<{ id: number; question: string; answer: string }>
  >([]);

  useEffect(() => {
    let active = true;
    fetch(`/api/site/questions?productId=${product.id}`)
      .then((response) => (response.ok ? response.json() : []))
      .then(
        (items: Array<{ id: number; question: string; answer: string }>) => {
          if (active) setAnsweredQuestions(items);
        },
      )
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [product.id]);

  const colour =
    profile?.colours.find((candidate) => candidate.id === colourId) ??
    profile?.colours[0];
  const storage =
    profile?.storage.find((candidate) => candidate.id === storageId) ??
    profile?.storage[0];
  const configuration = resolveConfiguration(product, colourId, storageId);
  const media: ProductMedia[] = colour?.media ?? [
    { src: product.imageUrl, alt: product.name, label: "Product view" },
  ];
  const selectedMedia = media[Math.min(mediaIndex, media.length - 1)];
  const outOfStock = configuration.stockQuantity < 1;
  const monthly = Math.ceil(configuration.price / emiMonths);
  const isGrocery = product.categoryName === "Grocery";
  const savedAmount = configuration.previousPrice
    ? Math.max(0, configuration.previousPrice - configuration.price)
    : 0;
  const ingredientNote = product.description.match(/Ingredients: ([^.]+(?:\.[^.]+)*)/i)?.[1];

  function selectColour(nextColour: string) {
    setColourId(nextColour);
    setMediaIndex(0);
    setZoomed(false);
  }

  function checkDelivery() {
    if (!/^\d{6}$/.test(pinDraft.trim())) {
      onMessage("Enter a valid 6-digit Indian PIN code");
      return;
    }
    setPin(pinDraft.trim());
    onMessage(`Delivery availability updated for ${pinDraft.trim()}`);
  }

  async function submitQuestion(event: React.FormEvent) {
    event.preventDefault();
    setQuestionStatus("");
    if (question.trim().length < 10) {
      setQuestionStatus("Please enter a question with at least 10 characters.");
      return;
    }
    setQuestionBusy(true);
    try {
      const response = await fetch("/api/site/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, question }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok)
        throw new Error(body.message ?? "Question could not be submitted.");
      setQuestion("");
      setQuestionStatus(body.message ?? "Question submitted.");
    } catch (error) {
      setQuestionStatus(
        error instanceof Error
          ? error.message
          : "Question could not be submitted.",
      );
    } finally {
      setQuestionBusy(false);
    }
  }

  return (
    <section className="premium-product-page wrap">
      <button className="back-link" onClick={onBack}>
        ← Back to products
      </button>

      <div className="premium-product-layout">
        <div className="premium-gallery-column">
          <div className="gallery-toolbar">
            <span>
              {profile ? "Official manufacturer media" : "Product image"}
            </span>
            <div>
              <button onClick={() => setZoomed((value) => !value)}>
                {zoomed ? "Reset zoom" : "Zoom"}
              </button>
              <button onClick={() => setFullscreen(true)}>Fullscreen</button>
            </div>
          </div>
          <button
            className={`premium-main-image ${zoomed ? "is-zoomed" : ""}`}
            onClick={() => setZoomed((value) => !value)}
            aria-label={zoomed ? "Reset image zoom" : "Zoom product image"}
          >
            <Image
              key={selectedMedia.src}
              src={selectedMedia.src}
              unoptimized
              alt={selectedMedia.alt}
              width={1200}
              height={1200}
              priority
              sizes="(max-width: 1050px) 100vw, 58vw"
            />
          </button>
          <div className="premium-thumbnails" aria-label="Product gallery">
            {media.map((item, index) => (
              <button
                key={item.src}
                className={index === mediaIndex ? "active" : ""}
                onClick={() => {
                  setMediaIndex(index);
                  setZoomed(false);
                }}
                aria-label={`Show ${item.label}`}
              >
                <Image
                  src={item.src}
                  unoptimized
                  alt=""
                  width={180}
                  height={180}
                  loading="lazy"
                  sizes="104px"
                />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <SpinViewer
            frames={colour?.spinFrames ?? []}
            productName={product.name}
          />
        </div>

        <aside className="premium-buy-column">
          <div className="product-identity">
            <span className="eyebrow">{product.categoryName}</span>
            <h1>{profile?.model ?? product.name}</h1>
            {isGrocery && (
              <p className="model-line">
                {product.brand} · {product.subcategoryName} · Pack size {product.size}
              </p>
            )}
            {profile && (
              <p className="model-line">
                {profile.brand} · Introduced {profile.launchYear} · SKU{" "}
                {configuration.sku}
              </p>
            )}
            <p className="product-description">
              {profile?.officialDescription ?? product.description}
            </p>
          </div>

          <div className="verified-review-line">
            <strong>{product.reviews > 0 ? `${product.rating} ★` : "New listing"}</strong>
            <span>
              {product.reviews > 0
                ? `${product.reviews.toLocaleString("en-IN")} retailer ratings · source-verified catalogue snapshot`
                : "No unverified rating data"}
            </span>
          </div>

          <div className="price-line premium-price">
            <strong>{money.format(configuration.price)}</strong>
            {configuration.previousPrice && (
              <>
                <del>{money.format(configuration.previousPrice)}</del>
                <span>
                  Save{" "}
                  {money.format(
                    configuration.previousPrice - configuration.price,
                  )}
                </span>
              </>
            )}
          </div>
          {isGrocery && savedAmount > 0 && (
            <div className="grocery-offer-strip">
              <b>{product.discount}% off</b>
              <span>You save {money.format(savedAmount)}</span>
              <small>Limited-period catalogue price · coupons checked at checkout</small>
            </div>
          )}

          {profile && colour && (
            <div className="premium-choice-block">
              <div className="choice-heading">
                <b>Colour</b>
                <span>{colour.name}</span>
              </div>
              <div className="real-swatches">
                {profile.colours.map((candidate) => (
                  <button
                    key={candidate.id}
                    className={candidate.id === colour.id ? "active" : ""}
                    onClick={() => selectColour(candidate.id)}
                    aria-label={`Choose ${candidate.name}`}
                    title={candidate.name}
                  >
                    <i style={{ background: candidate.swatch }} />
                    <span>{candidate.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {profile && storage && (
            <div className="premium-choice-block">
              <div className="choice-heading">
                <b>Storage</b>
                <span>{storage.label}</span>
              </div>
              <div className="storage-options">
                {profile.storage.map((candidate) => {
                  const stock = colour
                    ? (candidate.stockByColour[colour.id] ?? 0)
                    : 0;
                  return (
                    <button
                      key={candidate.id}
                      className={candidate.id === storage.id ? "active" : ""}
                      onClick={() => {
                        setStorageId(candidate.id);
                        setZoomed(false);
                      }}
                    >
                      <b>{candidate.label}</b>
                      <span>{money.format(candidate.price)}</span>
                      <small>
                        {stock > 0
                          ? `${stock} in Nexora inventory`
                          : "Unavailable"}
                      </small>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={`stock-panel ${outOfStock ? "out" : "in"}`}>
            <span aria-hidden="true">{outOfStock ? "○" : "●"}</span>
            <div>
              <b>
                {outOfStock ? "This configuration is unavailable" : "In stock"}
              </b>
              <p>
                {outOfStock
                  ? "Choose another colour or storage option."
                  : `${configuration.stockQuantity} units available · free delivery estimated in 2–3 days to ${pin}`}
              </p>
            </div>
          </div>

          <div className="delivery-checker">
            <label htmlFor="delivery-pin">Check delivery PIN</label>
            <div>
              <input
                id="delivery-pin"
                inputMode="numeric"
                maxLength={6}
                value={pinDraft}
                onChange={(event) =>
                  setPinDraft(event.target.value.replace(/\D/g, ""))
                }
              />
              <button onClick={checkDelivery}>Check</button>
            </div>
          </div>

          <div className="emi-card">
            <div>
              <span>Illustrative EMI</span>
              <strong>{money.format(monthly)}/month</strong>
            </div>
            <label>
              {emiMonths} months
              <input
                type="range"
                min="3"
                max="24"
                step="3"
                value={emiMonths}
                onChange={(event) => setEmiMonths(Number(event.target.value))}
              />
            </label>
            <small>
              Simple price ÷ tenure estimate. Actual EMI, interest and
              eligibility depend on your bank; no bank offer is currently
              configured.
            </small>
          </div>

          <div className="premium-actions">
            <button
              className="primary"
              disabled={outOfStock}
              onClick={() => onAdd(product, configuration)}
            >
              Add to bag
            </button>
            <button
              className="buy-now"
              disabled={outOfStock}
              onClick={() => onBuyNow(product, configuration)}
            >
              Buy now · {money.format(configuration.price)}
            </button>
            <button
              className={`premium-wishlist ${liked ? "liked" : ""}`}
              onClick={() => onWishlist(product.id)}
              aria-label={liked ? "Remove from wishlist" : "Save to wishlist"}
            >
              {liked ? "♥" : "♡"}
            </button>
          </div>

          <div className="truthful-offers">
            <article>
              <span>UPI</span>
              <div>
                <b>Manual UPI verification</b>
                <p>
                  Orders confirm only after the merchant verifies payment
                  evidence.
                </p>
              </div>
            </article>
            <article>
              <span>↺</span>
              <div>
                <b>Exchange</b>
                <p>
                  No automated exchange quote is offered until a verified
                  valuation partner is connected.
                </p>
              </div>
            </article>
          </div>
        </aside>
      </div>

      {profile ? (
        <div className="product-facts-layout">
          <section className="product-facts-main">
            <div className="premium-section-heading">
              <span className="eyebrow">Verified product data</span>
              <h2>Technical specifications</h2>
              <p>
                Model-specific information sourced from the manufacturer.
                Storage reflects the selected configuration.
              </p>
            </div>
            {profile.specifications.map((group) => (
              <div className="spec-group" key={group.name}>
                <h3>{group.name}</h3>
                <dl>
                  {group.items.map((item) => (
                    <div key={item.label}>
                      <dt>{item.label}</dt>
                      <dd>
                        {item.label === "Storage"
                          ? configuration.storage
                          : item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </section>
          <aside className="product-facts-side">
            <FactCard title="In the box" items={profile.boxContents} />
            <FactCard
              title="Compatible accessories"
              items={profile.accessories}
            />
            <FactCard
              title="Warranty"
              items={[profile.warranty, profile.serviceInformation]}
            />
            <FactCard title="Returns" items={[profile.returnPolicy]} />
            <FactCard
              title="Origin and identifiers"
              items={[profile.countryOfOrigin, profile.gtin]}
            />
            <a
              className="source-card"
              href={profile.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span>Source</span>
              <b>{profile.sourceLabel}</b>
              <small>Verified {profile.verifiedOn} ↗</small>
            </a>
          </aside>
        </div>
      ) : isGrocery ? (
        <div className="product-facts-layout grocery-facts-layout">
          <section className="product-facts-main">
            <div className="premium-section-heading">
              <span className="eyebrow">Product information</span>
              <h2>Pack details and customer care</h2>
              <p>Retail catalogue facts are shown as recorded; variable legal declarations remain tied to the sealed pack.</p>
            </div>
            <div className="spec-group">
              <h3>Product</h3>
              <dl>
                <div><dt>Brand</dt><dd>{product.brand}</dd></div>
                <div><dt>Pack size</dt><dd>{product.size}</dd></div>
                <div><dt>Category</dt><dd>{product.subcategoryName}</dd></div>
                <div><dt>MRP</dt><dd>{money.format(product.previousPrice ?? product.price)}</dd></div>
                <div><dt>Selling price</dt><dd>{money.format(product.price)}</dd></div>
                <div><dt>Availability</dt><dd>In stock · {product.stockQuantity} units</dd></div>
              </dl>
            </div>
            <div className="spec-group">
              <h3>Food and pack declaration</h3>
              <dl>
                <div><dt>Ingredients</dt><dd>{ingredientNote ?? "Refer to the current sealed pack label"}</dd></div>
                <div><dt>Nutrition</dt><dd>{product.description.includes("nutrition grade") ? product.description.match(/Open Food Facts nutrition grade: ([A-E])/i)?.[1] ?? "See pack" : "Refer to the current sealed pack label"}</dd></div>
                <div><dt>Country of origin</dt><dd>Refer to the current sealed pack label</dd></div>
                <div><dt>Manufactured by</dt><dd>Refer to the current sealed pack label</dd></div>
              </dl>
            </div>
          </section>
          <aside className="product-facts-side">
            <FactCard title="Delivery" items={["Free standard delivery", "Estimated in 2–3 days after PIN-code check", "Express options depend on location"]} />
            <FactCard title="Returns" items={[product.returnPolicy ?? "Damaged, expired or incorrect items are eligible for support"]} />
            <FactCard title="Seller information" items={["Sold through Nexora Commerce", "Seller and tax details appear on the final invoice", "Availability remains subject to final order confirmation"]} />
            <FactCard title="Ratings policy" items={[`${product.rating} from ${product.reviews.toLocaleString("en-IN")} retailer ratings`, "Nexora verified-purchase reviews are kept separate"]} />
          </aside>
        </div>
      ) : (
        <section className="verification-pending">
          <span className="eyebrow">Accuracy first</span>
          <h2>Verified model data is not published here yet.</h2>
          <p>
            Nexora will not invent specifications, variants, ratings or 360°
            media for this product. Checkout remains available for the listed
            base item while its manufacturer data is reviewed.
          </p>
        </section>
      )}

      {profile && (
        <>
          <section className="variant-comparison">
            <div className="premium-section-heading">
              <span className="eyebrow">Configuration comparison</span>
              <h2>Choose the right storage</h2>
            </div>
            <div
              className="comparison-table"
              role="table"
              aria-label="Storage comparison"
            >
              <div role="row" className="comparison-head">
                <span role="columnheader">Storage</span>
                <span role="columnheader">Price</span>
                <span role="columnheader">Selected colour stock</span>
                <span role="columnheader">Nexora SKU</span>
              </div>
              {profile.storage.map((option) => (
                <div role="row" key={option.id}>
                  <b role="cell">{option.label}</b>
                  <span role="cell">{money.format(option.price)}</span>
                  <span role="cell">
                    {colour ? (option.stockByColour[colour.id] ?? 0) : 0}
                  </span>
                  <code role="cell">
                    {resolveConfiguration(product, colourId, option.id).sku}
                  </code>
                </div>
              ))}
            </div>
          </section>

          <section className="faq-section">
            <div className="premium-section-heading">
              <span className="eyebrow">Questions and answers</span>
              <h2>Frequently asked</h2>
            </div>
            <div className="faq-list">
              {profile.faqs.map((faq, index) => (
                <details key={faq.question} open={index === 0}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
              {answeredQuestions.map((item) => (
                <details key={`customer-${item.id}`}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
            <form className="ask-question" onSubmit={submitQuestion}>
              <div>
                <b>Still deciding?</b>
                <p>
                  Ask a product question. It will appear publicly only after an
                  administrator answers it.
                </p>
              </div>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={500}
                placeholder="Ask about compatibility, warranty, delivery or this configuration"
                aria-label="Product question"
              />
              <button className="primary" type="submit" disabled={questionBusy}>
                {questionBusy ? "Submitting…" : "Submit question"}
              </button>
              {questionStatus && <span role="status">{questionStatus}</span>}
            </form>
          </section>

          <section className="verified-reviews">
            <div>
              <span className="eyebrow">Verified-purchase reviews</span>
              <h2>No reviews yet</h2>
              <p>
                Only reviews linked to completed Nexora orders will appear here.
                No representative or imported rating is shown.
              </p>
            </div>
            <strong>0.0</strong>
          </section>
        </>
      )}

      <div className="mobile-purchase-bar">
        <div>
          <small>{configuration.variantName}</small>
          <b>{money.format(configuration.price)}</b>
        </div>
        <button
          disabled={outOfStock}
          onClick={() => onAdd(product, configuration)}
        >
          {outOfStock ? "Unavailable" : "Add to bag"}
        </button>
        <button
          disabled={outOfStock}
          onClick={() => onBuyNow(product, configuration)}
        >
          Buy now
        </button>
      </div>

      {fullscreen && (
        <div
          className="fullscreen-gallery"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen product gallery"
        >
          <button
            className="fullscreen-close"
            onClick={() => setFullscreen(false)}
            aria-label="Close fullscreen gallery"
          >
            ×
          </button>
          <button
            className="gallery-nav previous"
            onClick={() =>
              setMediaIndex(
                (value) => (value - 1 + media.length) % media.length,
              )
            }
            aria-label="Previous image"
          >
            ←
          </button>
          <Image
            src={selectedMedia.src}
            unoptimized
            alt={selectedMedia.alt}
            width={1536}
            height={1024}
            sizes="100vw"
          />
          <button
            className="gallery-nav next"
            onClick={() => setMediaIndex((value) => (value + 1) % media.length)}
            aria-label="Next image"
          >
            →
          </button>
          <p>
            {selectedMedia.label} · {mediaIndex + 1} of {media.length}
          </p>
        </div>
      )}
    </section>
  );
}

function FactCard({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="fact-card">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function SpinViewer({
  frames,
  productName,
}: {
  frames: string[];
  productName: string;
}) {
  const [frame, setFrame] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [loaded, setLoaded] = useState(0);
  const drag = useRef<{ x: number; frame: number } | null>(null);
  const supported = frames.length >= 24;

  const preload = useMemo(
    () => frames.slice(0, supported ? frames.length : 0),
    [frames, supported],
  );

  function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!supported) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, frame };
  }

  function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current || !supported) return;
    const delta = Math.round((event.clientX - drag.current.x) / 10);
    setFrame((drag.current.frame - delta + frames.length * 10) % frames.length);
  }

  function pointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current = null;
  }

  if (!supported) {
    return (
      <div className="spin-unavailable">
        <span>360°</span>
        <div>
          <b>Verified 360° media unavailable</b>
          <p>
            The manufacturer has not supplied a 24+ frame rotation set, so
            Nexora does not simulate one from duplicate images.
          </p>
        </div>
      </div>
    );
  }

  const viewer = (
    <div className="spin-viewer-shell">
      <div
        className="spin-stage"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        style={{ touchAction: "none" }}
      >
        <Image
          src={frames[frame]}
          unoptimized
          alt={`${productName} 360 degree frame ${frame + 1}`}
          width={1200}
          height={1200}
          sizes="(max-width: 760px) 100vw, 900px"
          style={{ transform: `scale(${zoom})` }}
          draggable={false}
        />
        {loaded < preload.length && (
          <span className="spin-loading">
            Loading {Math.round((loaded / preload.length) * 100)}%
          </span>
        )}
        <div className="spin-preload" aria-hidden="true">
          {preload.map((src) => (
            <Image
              key={src}
              src={src}
              unoptimized
              alt=""
              width={1}
              height={1}
              onLoad={() => setLoaded((value) => value + 1)}
            />
          ))}
        </div>
      </div>
      <div className="spin-controls">
        <span>Drag to rotate</span>
        <button onClick={() => setZoom((value) => Math.min(2, value + 0.25))}>
          Zoom +
        </button>
        <button onClick={() => setZoom((value) => Math.max(1, value - 0.25))}>
          Zoom −
        </button>
        <button onClick={() => setFullscreen((value) => !value)}>
          {fullscreen ? "Exit fullscreen" : "Fullscreen"}
        </button>
      </div>
    </div>
  );

  return fullscreen ? <div className="fullscreen-spin">{viewer}</div> : viewer;
}
