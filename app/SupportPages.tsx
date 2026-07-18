"use client";

import { FormEvent, useMemo, useState } from "react";

export type InfoPage =
  | "help-centre"
  | "delivery-returns"
  | "contact-us"
  | "our-standards"
  | "privacy-policy"
  | "terms-conditions";

type PageProps = {
  page: InfoPage;
  onHome: () => void;
  onNavigate: (page: InfoPage) => void;
  onMessage: (message: string) => void;
};

const pageNames: Record<InfoPage, string> = {
  "help-centre": "Help Centre",
  "delivery-returns": "Delivery & Returns",
  "contact-us": "Contact Us",
  "our-standards": "Our Standards",
  "privacy-policy": "Privacy Policy",
  "terms-conditions": "Terms & Conditions",
};

const faqGroups = [
  {
    icon: "▤",
    title: "Orders",
    description: "Placing, changing and tracking orders",
    questions: [
      ["Where can I see my orders?", "Open Account and select Order History to view your order number, payment state and latest fulfilment status."],
      ["Can I change an order?", "Contact support as quickly as possible. Changes are possible only before the order enters packing."],
    ],
  },
  {
    icon: "₹",
    title: "Payments",
    description: "UPI, verification and payment safety",
    questions: [
      ["How are UPI payments verified?", "Your order stays Payment Pending Verification after you upload proof. Nexora confirms it only after an administrator matches the amount, order and transfer details."],
      ["Is checkout secure?", "Nexora uses encrypted connections and never asks you to disclose a UPI PIN, OTP or banking password."],
    ],
  },
  {
    icon: "◇",
    title: "Shipping",
    description: "Delivery times, charges and tracking",
    questions: [
      ["When will my order arrive?", "Standard delivery takes 3–7 business days. Express delivery takes 1–3 business days after processing."],
      ["How do I track delivery?", "Open Order History in your account to review the latest tracking and order status."],
    ],
  },
  {
    icon: "↺",
    title: "Refunds",
    description: "Returns, inspections and refunds",
    questions: [
      ["When will I receive my refund?", "Approved refunds are credited to the original payment method within 5–7 working days after quality inspection."],
      ["What is eligible for return?", "Eligible products may be returned within 7 days when unused and supplied with their original packaging and accessories."],
    ],
  },
  {
    icon: "✓",
    title: "Warranty",
    description: "Product coverage and defects",
    questions: [
      ["How does warranty support work?", "Warranty terms vary by product and manufacturer. Keep your invoice and contact Nexora with the order number and issue details."],
      ["What if my item arrives damaged?", "Photograph the package and product, then contact support promptly. Eligible damaged or defective items can be replaced."],
    ],
  },
  {
    icon: "◎",
    title: "Account",
    description: "Profile, access and login help",
    questions: [
      ["I cannot sign in. What should I do?", "Check your internet connection, confirm you are using the correct account, refresh the page and try again. Contact support if the issue continues."],
      ["How is my information used?", "Account information is used to provide orders, support and service updates. It is encrypted and never sold."],
    ],
  },
];

const standards = [
  ["◆", "Genuine Products", "We prioritise authentic products sourced through responsible and traceable channels."],
  ["✓", "Quality Testing", "Listings and product condition are reviewed against clear quality requirements."],
  ["▣", "Secure Payments", "Encrypted checkout and manual UPI verification help protect every transaction."],
  ["♙", "Trusted Sellers", "Seller quality, fulfilment behaviour and product accuracy guide our standards."],
  ["↗", "Fast Shipping", "Orders are prepared quickly and supported by transparent delivery expectations."],
  ["♡", "Customer Satisfaction", "Clear policies and fair resolutions are designed around long-term trust."],
  ["♻", "Sustainable Packaging", "We encourage right-sized, recyclable packaging and reduced unnecessary material."],
  ["◉", "Reliable Support", "Real people and clear escalation paths help customers resolve issues confidently."],
];

export default function SupportPage({ page, onHome, onNavigate, onMessage }: PageProps) {
  if (page === "help-centre") return <HelpCentre onHome={onHome} onNavigate={onNavigate} />;
  if (page === "delivery-returns") return <DeliveryReturns onHome={onHome} onNavigate={onNavigate} />;
  if (page === "contact-us") return <ContactUs onHome={onHome} onMessage={onMessage} />;
  if (page === "our-standards") return <Standards onHome={onHome} />;
  if (page === "privacy-policy") return <PolicyPage page={page} onHome={onHome} />;
  return <PolicyPage page={page} onHome={onHome} />;
}

export function ProfessionalFooter({ onView, onInfo, onMessage }: { onView: (view: "home" | "catalog" | "cart" | "account") => void; onInfo: (page: InfoPage) => void; onMessage: (message: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError("Enter a valid email address"); return; }
    setError(""); setEmail(""); onMessage("Welcome to Nexora updates");
  }
  return <footer className="premium-footer"><div className="footer-newsletter"><div className="wrap"><div><p className="eyebrow">Nexora Notes</p><h2>Better choices, delivered thoughtfully.</h2><p>New arrivals, useful buying guides and considered offers—no clutter.</p></div><form onSubmit={subscribe} noValidate><label><span className="sr-only">Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" aria-invalid={Boolean(error)} /><button type="submit">Subscribe →</button></label>{error ? <small className="newsletter-error">{error}</small> : <small>By subscribing, you agree to receive Nexora updates.</small>}</form></div></div><div className="footer-main wrap"><div className="footer-brand"><div className="brand"><span className="brand-mark">N</span><span>Nexora</span></div><p>Thoughtful products. Clear choices. A better way to shop across India.</p><div className="ssl-badge"><span>▣</span><div><b>SSL Secure Checkout</b><small>Encrypted connection</small></div></div></div><div><h3>Quick links</h3><button onClick={() => onView("home")}>Home</button><button onClick={() => onView("catalog")}>Shop</button><button onClick={() => onView("catalog")}>Categories</button><button onClick={() => { onView("catalog"); onMessage("Your saved products are marked with a heart"); }}>Wishlist</button><button onClick={() => onView("cart")}>Cart</button><button onClick={() => onView("account")}>Account</button></div><div><h3>Support</h3><button onClick={() => onInfo("help-centre")}>Help Centre</button><button onClick={() => onInfo("delivery-returns")}>Delivery & Returns</button><button onClick={() => onInfo("contact-us")}>Contact Us</button><a href="mailto:suryakannan32123@gmail.com">Email support</a><a href="tel:+919150357320">+91 91503 57320</a></div><div><h3>About</h3><button onClick={() => onInfo("our-standards")}>Our Standards</button><button onClick={() => onInfo("privacy-policy")}>Privacy Policy</button><button onClick={() => onInfo("terms-conditions")}>Terms & Conditions</button><span>Proudly based in India</span></div></div><div className="footer-payments wrap"><span>Secure payments</span><div><b>VISA</b><b>Mastercard</b><b>RuPay</b><b>UPI</b><b>G Pay</b><b>PhonePe</b></div></div><div className="footer-bottom wrap"><span>© 2026 Nexora Commerce. All Rights Reserved.</span><span>Tamil Nadu, India · English</span><span><button onClick={() => onInfo("privacy-policy")}>Privacy</button> · <button onClick={() => onInfo("terms-conditions")}>Terms</button></span></div></footer>;
}

function PageHero({ page, eyebrow, intro, onHome }: { page: InfoPage; eyebrow: string; intro: string; onHome: () => void }) {
  return (
    <header className="content-hero">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <button onClick={onHome}>Home</button><span>›</span><span>{pageNames[page]}</span>
      </nav>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{pageNames[page]}</h1>
      <p>{intro}</p>
    </header>
  );
}

function HelpCentre({ onHome, onNavigate }: Pick<PageProps, "onHome" | "onNavigate">) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const matches = useMemo(() => faqGroups.flatMap((group) => group.questions.map(([question, answer]) => ({ group: group.title, question, answer }))).filter((item) => !query || `${item.group} ${item.question} ${item.answer}`.toLowerCase().includes(query)), [query]);
  return (
    <section className="content-page wrap page-enter">
      <PageHero page="help-centre" eyebrow="Nexora Support" intro="Quick answers, clear next steps and human support when you need it." onHome={onHome} />
      <label className="help-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search orders, payments, shipping, refunds…" aria-label="Search help topics" /></label>
      {!query ? <div className="help-categories">{faqGroups.map((group) => <article key={group.title}><span>{group.icon}</span><h2>{group.title}</h2><p>{group.description}</p></article>)}</div> : null}
      <div className="faq-section">
        <div><p className="eyebrow">Frequently asked questions</p><h2>{query ? `${matches.length} search results` : "Answers to common questions"}</h2></div>
        <div className="faq-list">{matches.map((item) => <details key={item.question}><summary><span>{item.question}</span><b>＋</b></summary><p>{item.answer}</p></details>)}</div>
      </div>
      <div className="support-cta"><div><span>◉</span><h2>Still need a hand?</h2><p>Contact Nexora support Monday–Saturday, 9:00 AM–7:00 PM.</p></div><button className="primary" onClick={() => onNavigate("contact-us")}>Contact support</button></div>
    </section>
  );
}

function DeliveryReturns({ onHome, onNavigate }: Pick<PageProps, "onHome" | "onNavigate">) {
  return (
    <section className="content-page wrap page-enter">
      <PageHero page="delivery-returns" eyebrow="Simple, transparent policies" intro="Clear delivery timelines and a fair return process for customers across India." onHome={onHome} />
      <div className="policy-highlights"><article><span>◇</span><b>3–7 days</b><small>Standard delivery</small></article><article><span>↗</span><b>1–3 days</b><small>Express delivery</small></article><article><span>↺</span><b>7-day returns</b><small>On eligible products</small></article><article><span>₹</span><b>Free above ₹999</b><small>Otherwise ₹99</small></article></div>
      <div className="delivery-grid">
        <article className="content-card"><p className="eyebrow">Shipping policy</p><h2>Fast delivery across India</h2><p>Orders are processed within 24 hours. Delivery estimates begin after processing and may vary for remote locations, holidays or exceptional carrier delays.</p><div className="timeline"><div><b>01</b><span><strong>Order confirmed</strong><small>Payment and order details recorded</small></span></div><div><b>02</b><span><strong>Processed within 24 hours</strong><small>Items checked and prepared for dispatch</small></span></div><div><b>03</b><span><strong>Delivered securely</strong><small>Track progress through Order History</small></span></div></div></article>
        <article className="content-card"><p className="eyebrow">Returns & exchanges</p><h2>A straightforward resolution</h2><ul className="check-list"><li>Request a return within 7 days of delivery.</li><li>The item must be unused and in original packaging.</li><li>Refunds follow a successful quality inspection.</li><li>Approved refunds arrive within 5–7 working days.</li><li>Damaged or defective products may qualify for replacement.</li></ul><button className="secondary" onClick={() => onNavigate("contact-us")}>Start with support</button></article>
      </div>
      <div className="tracking-banner"><span>⌖</span><div><h2>Track every delivery from your account</h2><p>Open Account → Order History to review the latest order and delivery status.</p></div><button className="secondary" onClick={onHome}>Return home</button></div>
    </section>
  );
}

function ContactUs({ onHome, onMessage }: Pick<PageProps, "onHome" | "onMessage">) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); event.currentTarget.reset(); onMessage("Thanks — your support request has been prepared"); }
  return (
    <section className="content-page wrap page-enter">
      <PageHero page="contact-us" eyebrow="Talk to Nexora" intro="Questions about an order, return or product? Our support team is ready to help." onHome={onHome} />
      <div className="contact-layout"><aside className="contact-aside"><div className="contact-method"><span>✉</span><div><small>Email</small><a href="mailto:suryakannan32123@gmail.com">suryakannan32123@gmail.com</a></div></div><div className="contact-method"><span>☎</span><div><small>Phone</small><a href="tel:+919150357320">+91 91503 57320</a></div></div><div className="contact-method"><span>◷</span><div><small>Working hours</small><b>Monday–Saturday<br />9:00 AM–7:00 PM</b></div></div><div className="contact-method"><span>⌖</span><div><small>Address</small><b>Nexora Commerce<br />Tamil Nadu, India</b></div></div><div className="social-row" aria-label="Social channels"><a href="mailto:suryakannan32123@gmail.com" aria-label="Email Nexora">✉</a><a href="tel:+919150357320" aria-label="Call Nexora">☎</a><a href="https://github.com/SURYAPRAKASH123671" target="_blank" rel="noreferrer" aria-label="Nexora on GitHub">GH</a></div></aside><form className="contact-form content-card" onSubmit={submit}><p className="eyebrow">Send a message</p><h2>How can we help?</h2><div className="field-grid"><label>Name<input name="name" required placeholder="Your full name" /></label><label>Email<input name="email" type="email" required placeholder="you@example.com" /></label><label>Phone<input name="phone" type="tel" required pattern="[0-9+ ]{10,16}" placeholder="+91 98765 43210" /></label><label>Subject<input name="subject" required placeholder="Order, return, product…" /></label><label className="full">Message<textarea name="message" required minLength={10} placeholder="Tell us how we can help" /></label></div><button className="primary" type="submit">Submit request →</button></form></div>
      <div className="map-placeholder"><div><span>⌖</span><b>Nexora Commerce</b><small>Tamil Nadu, India</small></div><i></i><i></i><i></i></div>
    </section>
  );
}

function Standards({ onHome }: Pick<PageProps, "onHome">) {
  return <section className="content-page wrap page-enter"><PageHero page="our-standards" eyebrow="The Nexora promise" intro="The principles behind every product, order and customer conversation." onHome={onHome} /><div className="standards-grid">{standards.map(([icon, title, body], index) => <article key={title} style={{ animationDelay: `${index * 45}ms` }}><span>{icon}</span><small>0{index + 1}</small><h2>{title}</h2><p>{body}</p></article>)}</div><div className="standards-quote"><p>“Commerce should feel clear, dependable and genuinely helpful.”</p><span>Nexora Commerce · India</span></div></section>;
}

const privacySections = [
  ["Information We Collect", "We collect information you provide when creating an account, contacting support, placing an order or submitting payment evidence."],
  ["Personal Data", "This may include your name, email, phone number, delivery address, order history and support messages."],
  ["Cookies", "Essential cookies and similar storage help maintain sessions, remember preferences and provide core storefront functions."],
  ["Analytics", "Aggregated usage information may be used to understand performance, improve navigation and identify service issues."],
  ["Payments", "Nexora records payment references and uploaded evidence for manual verification. Never share a UPI PIN, OTP or banking password."],
  ["Security", "Customer information is protected using encrypted connections, access controls and limited administrative access. Personal information is never sold."],
  ["Third-party Services", "Delivery, hosting, analytics and payment applications may process only the information required to provide their specific service."],
  ["User Rights", "You may request access, correction or deletion of eligible personal information by contacting Nexora."],
  ["Data Retention", "Information is retained only as long as needed for orders, support, security, legal and accounting obligations."],
  ["Contact Information", "Privacy questions may be sent to suryakannan32123@gmail.com or discussed by phone at +91 91503 57320."],
];

const termsSections = [
  ["Acceptance of Terms", "By accessing or using Nexora, you agree to these terms and the policies referenced on this website."],
  ["User Accounts", "You are responsible for accurate account information and for protecting access to your account and devices."],
  ["Orders", "An order is an offer to purchase and remains subject to availability, payment review and acceptance by Nexora."],
  ["Pricing", "Prices are shown in Indian Rupees. Nexora may correct genuine pricing or catalogue errors before dispatch."],
  ["Payments", "Customers must use authorised payment methods. Direct UPI orders are confirmed only after manual verification."],
  ["Delivery", "Delivery estimates are reasonable targets and may be affected by location, carrier operations and events outside Nexora’s control."],
  ["Returns", "Eligible products follow the published 7-day return policy and must pass quality inspection."],
  ["Warranty", "Manufacturer or seller warranty terms differ by product and apply alongside rights available under Indian law."],
  ["Intellectual Property", "Nexora branding, interface, written material and original assets may not be copied or commercially reused without permission."],
  ["Limitation of Liability", "To the extent permitted by law, liability is limited to direct, reasonably foreseeable loss connected to the affected order."],
  ["Governing Law", "These terms are governed by the laws of India, with applicable jurisdiction in Tamil Nadu."],
  ["Contact Details", "Questions may be sent to suryakannan32123@gmail.com or +91 91503 57320."],
];

function PolicyPage({ page, onHome }: { page: "privacy-policy" | "terms-conditions"; onHome: () => void }) {
  const isPrivacy = page === "privacy-policy";
  const sections = isPrivacy ? privacySections : termsSections;
  return <section className="content-page wrap page-enter"><PageHero page={page} eyebrow={isPrivacy ? "Your information, respected" : "Clear terms, fair commerce"} intro={isPrivacy ? "How Nexora collects, protects and uses information responsibly." : "The terms that help keep every Nexora interaction transparent and dependable."} onHome={onHome} /><div className="legal-layout"><aside><b>On this page</b>{sections.map(([title], index) => <a key={title} href={`#section-${index + 1}`}>{title}</a>)}</aside><div className="legal-copy"><div className="legal-notice"><span>✓</span><p>{isPrivacy ? "Customer information is encrypted and never sold." : "Effective 17 July 2026 · Applies to Nexora Commerce in India."}</p></div>{sections.map(([title, body], index) => <article id={`section-${index + 1}`} key={title}><small>{String(index + 1).padStart(2, "0")}</small><div><h2>{title}</h2><p>{body}</p></div></article>)}</div></div></section>;
}
