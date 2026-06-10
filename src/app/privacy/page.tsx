// src/app/privacy/page.tsx
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-white/10 pb-6">
          <Link href="/" className="text-sm text-indigo-400 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-white/40 text-sm mt-2">Last Updated: June 1, 2026</p>
        </div>

        {/* Introduction */}
        <p className="text-white/70 leading-relaxed">
          At Netsyra AI, accessible from netsyraai.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Netsyra AI and how we use it. If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.
        </p>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Information We Collect and How We Use It</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            We only collect information that is strictly necessary to provide the Netsyra AI orchestration service:
          </p>
          <ul className="list-disc pl-5 text-white/60 text-sm space-y-2">
            <li>
              <strong className="text-white/80">Account Identification:</strong> When you register or sign in, we collect your name and email address to verify your identity and maintain your active secure session.
            </li>
            <li>
              <strong className="text-white/80">Service Data:</strong> Your chat messages and prompts are stored securely within our authenticated Supabase database infrastructure solely to display your chat history back to you.
            </li>
          </ul>
        </section>

        {/* Section 2 - CRITICAL FOR GOOGLE OAUTH */}
        <section className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
          <h2 className="text-xl font-semibold text-indigo-400">2. Google API Services Usage & Data Disclosure</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Netsyra AI uses Google OAuth services strictly for user authentication purposes. 
          </p>
          <p className="text-white/60 text-sm leading-relaxed">
            Our application only requests access to basic profile fields (<code className="text-indigo-300">openid</code>, <code className="text-indigo-300">https://www.googleapis.com/auth/userinfo.email</code>, and <code className="text-indigo-300">https://www.googleapis.com/auth/userinfo.profile</code>). We do not request, access, read, or store any other personal Google user data, including but not limited to Google Drive files, Gmail messages, or calendar events.
          </p>
          <p className="text-white/60 text-sm leading-relaxed font-medium text-white/80">
            Netsyra AI's use and transfer to any other app of information received from Google APIs will adhere to Google API Services User Data Policy, including the Limited Use requirements.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Data Protection and Third Parties</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            We take data security very seriously. We never sell, trade, or share your personal data, chat logs, or account information with outside third parties. All communication between your client browser and our database infrastructure is fully encrypted in transit and at rest.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. User Rights: Data Control and Deletion</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            You retain full ownership and control over your data. You have the right to request access to, correction of, or permanent deletion of your personal data at any time. You can delete your account and all associated chat records immediately by contacting our support team.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Contact Information</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            For any data requests, privacy inquiries, or account closure support, please email us directly at:
          </p>
          <p className="text-indigo-400 font-medium text-sm">
            support@netsyraai.com
          </p>
        </section>

        {/* Footer Link */}
        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-white/30 text-xs">© 2026 Netsyra AI. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
}