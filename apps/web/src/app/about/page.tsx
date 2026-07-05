// ============================================================
// apps/web/src/app/about/page.tsx
// ============================================================
import type { Metadata } from "next";
import Link from "next/link";
import { Zap, Shield, Clock, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — SarkariTrack",
  description: "SarkariTrack is India's fastest government job portal, providing instant alerts for SSC, UPSC, Railway, Bank and State PSC recruitments.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F7F8FC] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0F172A] to-[#1E3A5F] px-8 py-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-2xl font-extrabold text-white">SarkariTrack</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">About Us</h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              India's fastest, cleanest, and most reliable government job alert portal.
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-8 space-y-8">
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Our Mission</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Millions of Indians prepare for government jobs every year. Yet finding reliable,
                up-to-date information about recruitments, results, and admit cards remains
                frustratingly difficult — buried under cluttered legacy portals full of ads and
                broken links.
              </p>
              <p className="text-gray-600 text-sm leading-relaxed mt-3">
                SarkariTrack was built to fix that. We aggregate official notifications from
                UPSC, SSC, IBPS, Railways, and all State PSCs into a single clean interface —
                updated automatically, 24 hours a day.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">What Makes Us Different</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Clock,  title: "Real-Time Updates",  desc: "Our AI agent monitors official portals daily and publishes new jobs within hours of notification." },
                  { icon: Shield, title: "Verified Links",     desc: "Every apply link and PDF is checked hourly. Dead links are flagged instantly so you never waste a click." },
                  { icon: Zap,    title: "Zero Clutter",       desc: "No fake jobs, no paid listings, no misleading content. Only verified official government recruitments." },
                  { icon: Users,  title: "Built for Aspirants",desc: "Free tools like age calculator, photo resizer, and eligibility engine — built for what job-seekers actually need." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={15} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 mb-0.5">{title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Disclaimer</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800 leading-relaxed">
                  SarkariTrack is an information aggregation service. We are not affiliated with
                  any government body. All job information is sourced from official government
                  websites and publications. Always verify details from the official recruitment
                  notification before applying.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Contact Us</h2>
              <p className="text-sm text-gray-600">
                For corrections, suggestions, or partnership enquiries:{" "}
                <a href="mailto:contact@sarkaritrack.in" className="text-blue-600 hover:underline font-medium">
                  contact@sarkaritrack.in
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}


// ============================================================
// apps/web/src/app/contact/page.tsx
// ============================================================
"use client";
import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import type { Metadata } from "next";

// Note: metadata export only works in Server Components.
// Move to a separate layout or use generateMetadata pattern for client components.

export default function ContactPage() {
  const [form, setForm]     = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // In production: POST to /api/contact which emails via Resend/SendGrid
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  };

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <main className="min-h-screen bg-[#F7F8FC] py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Contact Us</h1>
          <p className="text-gray-500 text-sm mb-6">
            For corrections, missing jobs, or feedback — we read every message.
          </p>

          {sent ? (
            <div className="text-center py-8">
              <CheckCircle size={40} className="text-emerald-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-gray-900 mb-1">Message Sent!</h2>
              <p className="text-sm text-gray-500">
                Thanks for reaching out. We'll get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: "Your Name", key: "name" as const, type: "text",  placeholder: "Rahul Kumar" },
                { label: "Email",     key: "email" as const, type: "email", placeholder: "rahul@email.com" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  <input
                    required type={type} value={form[key]}
                    onChange={set(key)} placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label>
                <select
                  value={form.subject} onChange={set("subject")} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                >
                  <option value="">Select a subject</option>
                  <option>Incorrect job information</option>
                  <option>Missing recruitment</option>
                  <option>Broken link / dead URL</option>
                  <option>Suggest a feature</option>
                  <option>Partnership / advertising</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Message</label>
                <textarea
                  required rows={4} value={form.message}
                  onChange={set("message")}
                  placeholder="Describe your issue or suggestion..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl transition-colors"
              >
                {loading ? "Sending..." : <><Send size={14} /> Send Message</>}
              </button>
            </form>
          )}
        </div>

        {/* Quick contact */}
        <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-5 text-center">
          <p className="text-xs text-gray-500">
            Or email us directly at{" "}
            <a href="mailto:contact@sarkaritrack.in" className="text-blue-600 hover:underline font-medium">
              contact@sarkaritrack.in
            </a>
            {" "}— we typically respond within 24 hours.
          </p>
        </div>
      </div>
    </main>
  );
}


// ============================================================
// apps/web/src/app/privacy/page.tsx
// ============================================================
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — SarkariTrack",
  description: "Privacy policy for SarkariTrack government job portal.",
};

const LAST_UPDATED = "June 2025";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F7F8FC] py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Privacy Policy</h1>
        <p className="text-xs text-gray-400 mb-8">Last updated: {LAST_UPDATED}</p>

        {[
          {
            title: "1. Information We Collect",
            body: `We collect minimal information necessary to provide our service:
• Usage data: Pages visited, search queries (anonymized), tools used — collected via Google Analytics.
• Push notification subscriptions: Browser endpoint keys to send job alerts (no personal info).
• Contact form submissions: Name and email if you contact us directly.
• Cookies: Session cookies for basic site functionality and analytics.
We do NOT collect Aadhaar numbers, government IDs, passwords, payment information, or any sensitive personal data.`,
          },
          {
            title: "2. How We Use Your Information",
            body: `• To send government job alerts you have subscribed to (push notifications).
• To improve site performance and understand which content is most useful.
• To respond to contact form enquiries.
• To prevent abuse and maintain site security.
We never sell your data to third parties.`,
          },
          {
            title: "3. Third-Party Services",
            body: `We use the following third-party services that may collect data:
• Google Analytics — website traffic analysis (anonymized IPs).
• Google AdSense — ad serving (subject to Google's privacy policy).
• Cloudflare — CDN and DDoS protection.
• Upstash Redis — temporary session caching (no personal data).
Each of these services has its own privacy policy governing data use.`,
          },
          {
            title: "4. Push Notifications",
            body: `If you subscribe to push notifications, we store your browser subscription endpoint to send job alerts. You can unsubscribe at any time through your browser's notification settings. We do not link push subscriptions to personal identifiers.`,
          },
          {
            title: "5. Cookies",
            body: `We use:
• Essential cookies: Required for the site to function.
• Analytics cookies: Google Analytics (anonymized). You can opt out via browser settings or Google's opt-out plugin.
• Advertising cookies: Google AdSense. You can manage ad preferences at adssettings.google.com.`,
          },
          {
            title: "6. Data Retention",
            body: `• Analytics data: Retained for 14 months (Google Analytics default).
• Push subscriptions: Retained until you unsubscribe or the subscription expires.
• Contact form data: Deleted after 90 days.`,
          },
          {
            title: "7. Your Rights",
            body: `You have the right to:
• Access the personal data we hold about you.
• Request deletion of your data.
• Opt out of analytics and advertising cookies.
• Unsubscribe from push notifications at any time.
To exercise these rights, email: contact@sarkaritrack.in`,
          },
          {
            title: "8. Children's Privacy",
            body: `SarkariTrack is intended for users 18 years and older. We do not knowingly collect personal information from children under 13.`,
          },
          {
            title: "9. Changes to This Policy",
            body: `We may update this policy periodically. Material changes will be announced via a site notification. Continued use of the site after changes constitutes acceptance of the updated policy.`,
          },
          {
            title: "10. Contact",
            body: `For privacy-related queries: contact@sarkaritrack.in`,
          },
        ].map(({ title, body }) => (
          <section key={title} className="mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}


// ============================================================
// apps/web/src/app/disclaimer/page.tsx
// ============================================================
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer — SarkariTrack",
  description: "Disclaimer for SarkariTrack government job information portal.",
};

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-[#F7F8FC] py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Disclaimer</h1>
        <p className="text-xs text-gray-400 mb-8">Please read this disclaimer carefully before using SarkariTrack.</p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
          <p className="text-sm text-amber-800 font-semibold">
            ⚠️ SarkariTrack is an independent information aggregator and is NOT affiliated with,
            endorsed by, or connected to any government body, ministry, or official recruitment agency.
          </p>
        </div>

        {[
          {
            title: "Information Accuracy",
            body: "While we strive to provide accurate and up-to-date information, SarkariTrack does not guarantee the completeness, accuracy, or timeliness of any job notification, result, admit card, or other recruitment information displayed on this website. All information is sourced from official government websites and publications, but errors or delays may occur.",
          },
          {
            title: "Verify from Official Sources",
            body: "Candidates are strongly advised to verify all recruitment details — including eligibility criteria, application dates, fees, and vacancies — directly from the official government notification and the recruiting organization's official website before applying. Do not rely solely on information displayed on SarkariTrack.",
          },
          {
            title: "No Guarantee of Employment",
            body: "SarkariTrack does not guarantee employment or selection in any government job. The display of a recruitment notice on our platform does not constitute an endorsement of the position or the recruiting organization.",
          },
          {
            title: "External Links",
            body: "SarkariTrack contains links to external government websites. We do not control these websites and are not responsible for their content, availability, or accuracy. The inclusion of a link does not imply endorsement.",
          },
          {
            title: "No Application Processing",
            body: "SarkariTrack does not process applications, collect application fees, or facilitate the hiring process in any way. All applications must be submitted directly through the official government portal mentioned in the recruitment notification.",
          },
          {
            title: "Beware of Fraud",
            body: "SarkariTrack will NEVER ask you to pay money to apply for a job or to access job information. If anyone claims to represent SarkariTrack and asks for payment, it is fraudulent. Report such incidents to cybercrime.gov.in.",
          },
          {
            title: "Limitation of Liability",
            body: "SarkariTrack, its owners, and its operators shall not be liable for any loss, damage, or inconvenience arising from the use of, or inability to use, information on this website. Use of this website is entirely at your own risk.",
          },
        ].map(({ title, body }) => (
          <section key={title} className="mb-5">
            <h2 className="text-sm font-bold text-gray-900 mb-1.5">{title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}


// ============================================================
// apps/web/src/app/terms/page.tsx
// ============================================================
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use — SarkariTrack",
  description: "Terms and conditions for using the SarkariTrack government job portal.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F7F8FC] py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Terms of Use</h1>
        <p className="text-xs text-gray-400 mb-8">Last updated: June 2025 · Governing law: India</p>

        {[
          {
            title: "1. Acceptance of Terms",
            body: "By accessing and using SarkariTrack (sarkaritrack.in), you accept and agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use this website.",
          },
          {
            title: "2. Use of Content",
            body: `The content on SarkariTrack is for personal, non-commercial informational use only. You may not:
• Copy, reproduce, or redistribute our content without written permission.
• Use our data for commercial purposes, scraping, or to build competing services.
• Misrepresent SarkariTrack as an official government portal.
• Use the site in any way that violates applicable Indian or international laws.`,
          },
          {
            title: "3. Intellectual Property",
            body: "The SarkariTrack name, logo, and original content (excluding government-issued recruitment content) are the intellectual property of SarkariTrack. Government recruitment notifications and official documents remain the property of the respective government bodies.",
          },
          {
            title: "4. User Conduct",
            body: `Users agree not to:
• Attempt to gain unauthorized access to our systems.
• Submit false, misleading, or fraudulent contact form submissions.
• Use automated tools to scrape or harvest data from the site.
• Interfere with the proper functioning of the website.`,
          },
          {
            title: "5. Advertising",
            body: "SarkariTrack displays advertisements through Google AdSense and may include affiliate links to study materials and test series. These are clearly displayed and do not influence the accuracy of job information we publish.",
          },
          {
            title: "6. Modifications to Service",
            body: "SarkariTrack reserves the right to modify, suspend, or discontinue any part of the service at any time without notice. We may also update these Terms of Use at any time. Continued use of the site constitutes acceptance of updated terms.",
          },
          {
            title: "7. Governing Law",
            body: "These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.",
          },
          {
            title: "8. Contact",
            body: "For any terms-related queries: contact@sarkaritrack.in",
          },
        ].map(({ title, body }) => (
          <section key={title} className="mb-5">
            <h2 className="text-sm font-bold text-gray-900 mb-1.5">{title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
