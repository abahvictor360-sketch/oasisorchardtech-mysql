import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import SEO from '../../components/seo/SEO';

const EFFECTIVE_DATE = 'July 7, 2026';

function Section({ number, title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-[#0a1628] mb-3">
        {number}. {title}
      </h2>
      <div className="text-gray-600 text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="How Oasis Orchard Technologies collects, uses, and protects your personal information."
        canonical="/privacy"
      />
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="relative py-16" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1bb0ce 100%)' }}>
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={26} className="text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
            <p className="text-blue-100 text-sm">Effective date: {EFFECTIVE_DATE}</p>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">

            <p className="text-gray-600 text-sm leading-relaxed mb-8">
              Oasis Orchard Technologies ("we", "us", "our") respects your privacy. This Privacy Policy
              explains what personal information we collect, how we use it, and the choices you have.
              This policy applies to our website, phone service plans, and wireless phone products.
            </p>

            <Section number={1} title="Information We Collect">
              <p><strong>Account information:</strong> name, email address, phone number, mailing/shipping address, and password (stored as a secure one-way hash — we never see or store your plain-text password).</p>
              <p><strong>Order information:</strong> products purchased, shipping details, order history, and payment status (we do not store full card numbers — see Section 3).</p>
              <p><strong>Support information:</strong> messages you send us via the support form, email, or WhatsApp, so we can respond to your inquiry.</p>
              <p><strong>Usage information:</strong> pages visited, device/browser type, and IP address, collected automatically to keep the site secure and improve performance.</p>
            </Section>

            <Section number={2} title="How We Use Your Information">
              <ul className="list-disc list-inside space-y-1.5">
                <li>To create and manage your account</li>
                <li>To process orders, payments, and shipping</li>
                <li>To provide and bill your phone service plan</li>
                <li>To respond to support requests</li>
                <li>To send order confirmations and, if enabled, order/account notifications by email or WhatsApp</li>
                <li>To detect and prevent fraud, abuse, or unauthorized access (e.g., login rate-limiting)</li>
                <li>To comply with legal obligations</li>
              </ul>
            </Section>

            <Section number={3} title="Payment Information">
              <p>
                All payments are processed by Stripe and/or PayPal, both PCI-DSS compliant payment
                processors. Your card details are sent directly to these providers and are never
                stored on our servers. We only retain the payment status and a transaction reference
                needed to fulfill and support your order.
              </p>
            </Section>

            <Section number={4} title="Cookies & Local Storage">
              <p>
                We use browser local storage to remember your shopping cart between visits and to keep
                you signed in. We do not use third-party advertising trackers. If we add analytics
                tools in the future, this policy will be updated accordingly.
              </p>
            </Section>

            <Section number={5} title="Sharing Your Information">
              <p>We do not sell your personal information. We share information only with:</p>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Payment processors (Stripe, PayPal) to complete transactions</li>
                <li>Shipping carriers to deliver your order</li>
                <li>Service providers that help us operate the site (e.g., hosting, email/WhatsApp delivery for notifications you or we enable)</li>
                <li>Law enforcement or regulators, only where required by law</li>
              </ul>
            </Section>

            <Section number={6} title="Data Retention">
              <p>
                We retain account and order information for as long as your account is active and as
                needed to comply with tax, accounting, and legal requirements. You may request deletion
                of your account at any time (see Section 8); some order records may be retained where
                required by law.
              </p>
            </Section>

            <Section number={7} title="Data Security">
              <p>
                We use industry-standard measures to protect your data, including encrypted password
                storage (bcrypt), HTTPS encryption in transit, session-based authentication, and
                login rate-limiting to prevent brute-force attacks. No method of transmission or storage
                is 100% secure, but we work to protect your information using currently accepted standards.
              </p>
            </Section>

            <Section number={8} title="Your Rights & Choices">
              <p>You may, at any time:</p>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Access or update your profile information from your account dashboard</li>
                <li>Change your password from Account settings</li>
                <li>Request a copy of your personal information</li>
                <li>Request deletion of your account and associated data</li>
                <li>Opt out of email or WhatsApp notifications (if enabled for your account)</li>
              </ul>
              <p>
                To exercise these rights, contact us at{' '}
                <a href="mailto:support@oasisorchard.com" className="text-[#1bb0ce] hover:underline">support@oasisorchard.com</a>.
              </p>
            </Section>

            <Section number={9} title="Children's Privacy">
              <p>
                Our services are not directed to children under 13, and we do not knowingly collect
                personal information from children under 13.
              </p>
            </Section>

            <Section number={10} title="Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. The "Effective date" above reflects
                the latest revision. We encourage you to review this page periodically.
              </p>
            </Section>

            <Section number={11} title="Contact Us">
              <p>
                Questions about this Privacy Policy or your data? Contact us at{' '}
                <a href="mailto:support@oasisorchard.com" className="text-[#1bb0ce] hover:underline">
                  support@oasisorchard.com
                </a>{' '}
                or +1 (902) 593-4442, 1505 Barrington Street, Suite 200, Halifax, NS B3J 3K5, Canada.
              </p>
            </Section>

            <div className="pt-6 border-t border-gray-100 text-xs text-gray-400">
              See also our <Link to="/terms" className="text-[#1bb0ce] hover:underline">Terms &amp; Conditions</Link>.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
