import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
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

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms & Conditions"
        description="Terms and conditions for using Oasis Orchard Technologies' website, phone plans, and wireless phone products."
        canonical="/terms"
      />
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="relative py-16" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1bb0ce 100%)' }}>
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
              <FileText size={26} className="text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Terms &amp; Conditions</h1>
            <p className="text-blue-100 text-sm">Effective date: {EFFECTIVE_DATE}</p>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">

            <p className="text-gray-600 text-sm leading-relaxed mb-8">
              These Terms &amp; Conditions ("Terms") govern your use of the Oasis Orchard Technologies
              website, our wireless phone products, and our phone service plans. By creating an account,
              placing an order, or using our services, you agree to these Terms. If you do not agree,
              please do not use our services.
            </p>

            <Section number={1} title="Who We Are">
              <p>
                Oasis Orchard Technologies ("we", "us", "our") is an authorized reseller of wireless
                VoIP phone products and phone service plans, located at 1505 Barrington Street,
                Suite 200, Halifax, NS B3J 3K5, Canada.
              </p>
            </Section>

            <Section number={2} title="Accounts">
              <p>
                You must provide accurate information when creating an account and keep your login
                credentials confidential. You are responsible for all activity under your account.
                We may suspend or terminate accounts that violate these Terms, engage in fraud, or
                misuse our services.
              </p>
            </Section>

            <Section number={3} title="Products & Orders">
              <p>
                Product descriptions, images, and prices are provided in good faith and may be updated
                at any time. All prices are in Canadian Dollars (CAD) unless stated otherwise.
                Placing an order constitutes an offer to purchase; we reserve the right to refuse or
                cancel any order (for example, due to stock issues, pricing errors, or suspected fraud).
                If we cancel a paid order, you will receive a full refund.
              </p>
            </Section>

            <Section number={4} title="Payments">
              <p>
                Payments are processed securely through third-party payment providers (Stripe and
                PayPal). We do not store your full card details on our servers. By submitting a
                payment, you confirm that you are authorized to use the payment method provided.
              </p>
            </Section>

            <Section number={5} title="Phone Service Plans">
              <p>
                Our phone plans (Basic Connect, Smart Connect, and Business Connect) are billed
                monthly. Plan features, included minutes, and pricing are described on our{' '}
                <Link to="/pricing" className="text-[#1bb0ce] hover:underline">Pricing page</Link>.
                Service requires an active internet connection; call quality depends on your network.
                We may modify plan features or pricing with reasonable advance notice.
              </p>
              <p>
                Fair use: plans are for normal personal or business use. Automated dialing, call-centre
                style traffic, or resale of service without authorization may result in suspension.
              </p>
            </Section>

            <Section number={6} title="Shipping & Delivery">
              <p>
                We ship physical products across Canada. Delivery estimates are provided at checkout
                and are not guaranteed. Risk of loss passes to you upon delivery to the address you
                provided. Please inspect your order on arrival and report any damage within 48 hours.
              </p>
            </Section>

            <Section number={7} title="Returns & Refunds">
              <p>
                Unopened products in original packaging may be returned within 14 days of delivery for
                a refund of the product price (shipping costs are non-refundable). Defective products
                are covered by the manufacturer's warranty — contact our{' '}
                <Link to="/support" className="text-[#1bb0ce] hover:underline">support team</Link>{' '}
                and we will assist with the warranty process. Service plan charges for a started
                billing period are non-refundable unless required by law.
              </p>
            </Section>

            <Section number={8} title="Acceptable Use">
              <p>
                You agree not to use our services for any unlawful purpose, including fraud, harassment,
                spam calls, or violating telecommunications regulations. Emergency services (911) over
                VoIP may work differently than traditional phone lines — location information may not be
                automatically available to emergency operators. Keep your registered address up to date.
              </p>
            </Section>

            <Section number={9} title="Intellectual Property">
              <p>
                All content on this website (text, graphics, logos, images) belongs to Oasis Orchard
                Technologies or its licensors and may not be reproduced without permission. Product
                names and trademarks (e.g., Grandstream) belong to their respective owners.
              </p>
            </Section>

            <Section number={10} title="Limitation of Liability">
              <p>
                To the maximum extent permitted by law, our total liability for any claim arising from
                these Terms or your use of our services is limited to the amount you paid us in the
                12 months preceding the claim. We are not liable for indirect, incidental, or
                consequential damages, including lost profits or data, or for service interruptions
                caused by events beyond our reasonable control.
              </p>
            </Section>

            <Section number={11} title="Changes to These Terms">
              <p>
                We may update these Terms from time to time. The "Effective date" above reflects the
                latest revision. Continued use of our services after changes take effect constitutes
                acceptance of the updated Terms.
              </p>
            </Section>

            <Section number={12} title="Governing Law">
              <p>
                These Terms are governed by the laws of the Province of Nova Scotia and the federal
                laws of Canada applicable therein. Any disputes shall be resolved in the courts of
                Nova Scotia.
              </p>
            </Section>

            <Section number={13} title="Contact Us">
              <p>
                Questions about these Terms? Contact us at{' '}
                <a href="mailto:support@oasisorchard.com" className="text-[#1bb0ce] hover:underline">
                  support@oasisorchard.com
                </a>{' '}
                or +1 (902) 593-4442, or visit our{' '}
                <Link to="/support" className="text-[#1bb0ce] hover:underline">Support page</Link>.
              </p>
            </Section>

            <div className="pt-6 border-t border-gray-100 text-xs text-gray-400">
              See also our <Link to="/privacy" className="text-[#1bb0ce] hover:underline">Privacy Policy</Link>.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
