// src/app/page.js
// Public marketing landing page. No auth required.

import Link from "next/link";
import Logo from "@/components/Logo";

const features = [
  {
    title: "Invoice in seconds",
    desc: "Add products, quantities, and prices — the total calculates itself. Built for checkout-counter speed.",
  },
  {
    title: "WhatsApp delivery",
    desc: "Every invoice sends straight to the customer's WhatsApp, pre-filled and ready — no typing required.",
  },
  {
    title: "Shareable invoice link",
    desc: "Each message includes a link to a clean, permanent invoice page your customer can revisit anytime.",
  },
  {
    title: "Your data, isolated",
    desc: "Every shop's invoices are private by default. You only ever see your own customers and history.",
  },
  {
    title: "6 months of history",
    desc: "Your dashboard keeps the last 6 months of transactions instantly searchable and exportable.",
  },
  {
    title: "Start Free, Grow Faster",
    desc: "Enjoy a full 3-day free trial. Then, just Rs 500 for your first month and Rs 300 to renew. No hidden fees.",
  },
];

const faqs = [
  {
    question: "Do I need to download an app?",
    answer: "No, Invoicer works entirely in your web browser. You can access it on your phone, tablet, or computer without installing anything."
  },
  {
    question: "How does the WhatsApp delivery work?",
    answer: "When you finish an invoice, we generate a beautifully formatted WhatsApp message containing a secure link to the digital receipt. It opens your WhatsApp instantly, ready to send."
  },
  {
    question: "Is there a limit on how many invoices I can create?",
    answer: "No! Whether you are on the 3-day free trial or a paid bundle, you have unlimited access to create as many invoices as your shop needs."
  },
  {
    question: "How do I pay for my subscription?",
    answer: "We keep it extremely simple with zero hidden fees. You pay securely via UPI directly to our business number. Once paid, your account is instantly upgraded."
  },
  {
    question: "Can my staff use the same account?",
    answer: "Yes, you can stay logged in on multiple devices (like a checkout tablet and your personal phone) using the exact same shop email and password."
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/pricing"
              className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/login?signup=1"
              className="text-xs sm:text-sm font-medium bg-gray-900 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-gray-800 whitespace-nowrap"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-gray-900 leading-tight">
          Invoice customers.
          <br />
          Send it on WhatsApp. Done.
        </h1>
        <p className="mt-5 text-lg text-gray-500 max-w-2xl mx-auto">
          Invoicer gives every shop owner their own dashboard to bill customers
          and deliver invoices instantly over WhatsApp — with a shareable link
          the customer can always come back to.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login?signup=1"
            className="bg-gray-900 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-gray-800"
          >
            Create your shop account
          </Link>
          <Link
            href="/login"
            className="border border-gray-300 px-6 py-3 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-gray-100">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title}>
              <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                {f.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-16 border-t border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-900 mb-10 text-center">
          Frequently asked questions
        </h2>
        <div className="space-y-8">
          {faqs.map((faq, i) => (
            <div key={i}>
              <h3 className="text-base font-medium text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA footer */}
      <section className="border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            Set up your shop in under a minute
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Start your 3-day free trial instantly. No credit card required upfront.
          </p>
          <Link
            href="/login?signup=1"
            className="mt-6 inline-block bg-gray-900 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-gray-800"
          >
            Get started free
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Invoicer</span>
          <span>Built for small shops</span>
        </div>
      </footer>
    </div>
  );
}
