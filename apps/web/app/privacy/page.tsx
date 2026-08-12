import Link from "next/link";
import { Zap } from "lucide-react";

export default function PrivacyPolicyPage() {
  const lastUpdated = "August 12, 2026";
  const appUrl = "https://astraweb-production.up.railway.app";
  const contactEmail = "privacy@astra-intelligence.com";

  return (
    <div className="min-h-screen bg-gradient-to-br from-astra-950 via-slate-900 to-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-astra-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Astra Intelligence</span>
          </Link>
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition">
            Sign in
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-white/50 mb-12">Last updated: {lastUpdated}</p>

        <div className="prose prose-invert max-w-none space-y-8 text-white/80">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>Astra Intelligence ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI marketing platform at {appUrl}.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3"><strong className="text-white">Account Information:</strong> When you register, we collect your name, email address, and password.</p>
            <p className="mb-3"><strong className="text-white">Brand Information:</strong> We collect brand details, uploaded documents, website URLs, and other content you provide to train your Brand Brain.</p>
            <p className="mb-3"><strong className="text-white">Content:</strong> We store marketing content you generate, campaigns you create, and publishing history.</p>
            <p className="mb-3"><strong className="text-white">Usage Data:</strong> We collect information about how you use the platform including pages visited and features used.</p>
            <p><strong className="text-white">Connected Accounts:</strong> When you connect social media accounts, we store OAuth tokens to enable publishing on your behalf.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To provide and improve our AI marketing services</li>
              <li>To generate personalized content based on your brand guidelines</li>
              <li>To authenticate your identity and secure your account</li>
              <li>To publish content to your connected social media accounts when you request it</li>
              <li>To communicate with you about your account and our services</li>
              <li>To analyze usage patterns and improve platform performance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. AI and Your Data</h2>
            <p className="mb-3">Your uploaded documents, brand guidelines, and content are used exclusively to power your Brand Brain — the AI system that generates personalized marketing content for your account. We do not use your data to train shared AI models or share your content with other users.</p>
            <p>AI-generated content is stored in your account and is only accessible by you and team members you authorize.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Storage and Security</h2>
            <p className="mb-3">Your data is stored securely using Supabase (PostgreSQL) with row-level security policies ensuring data isolation between accounts. File uploads are stored in secure cloud storage with access controls.</p>
            <p>We implement industry-standard security measures including encryption in transit (HTTPS) and at rest.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-white">Supabase</strong> — database and authentication</li>
              <li><strong className="text-white">Google AI</strong> — AI content generation (your content is sent to Google AI API)</li>
              <li><strong className="text-white">Twitter/X API</strong> — when you connect and publish to Twitter</li>
              <li><strong className="text-white">LinkedIn API</strong> — when you connect and publish to LinkedIn</li>
              <li><strong className="text-white">Railway</strong> — hosting and infrastructure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Access and download your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Disconnect social media accounts at any time</li>
              <li>Export your content and documents</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Data Retention</h2>
            <p>We retain your data for as long as your account is active. When you delete your account, we delete your personal data within 30 days, except where required by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or your data, contact us at: <a href={`mailto:${contactEmail}`} className="text-astra-400 hover:text-astra-300">{contactEmail}</a></p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex items-center gap-6 text-sm text-white/40">
          <Link href="/" className="hover:text-white/70 transition">Home</Link>
          <Link href="/terms" className="hover:text-white/70 transition">Terms of Service</Link>
        </div>
      </main>
    </div>
  );
}
