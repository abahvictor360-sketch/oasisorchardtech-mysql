import { useState } from 'react';
import {
  Search,
  CreditCard,
  Wrench,
  User,
  RotateCcw,
  Phone,
  Mail,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useToast } from '../../hooks/useToast';
import SEO from '../../components/seo/SEO';

const quickLinks = [
  {
    icon: CreditCard,
    title: 'Billing',
    description: 'Invoices, payments, plan changes',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Wrench,
    title: 'Technical Support',
    description: 'Device setup, call quality, troubleshooting',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: User,
    title: 'Account',
    description: 'Profile, security, preferences',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: RotateCcw,
    title: 'Returns & Exchanges',
    description: 'Return policy, RMA requests',
    color: 'bg-orange-50 text-orange-600',
  },
];

const faqs = [
  {
    category: 'Billing',
    question: 'How do I update my payment method?',
    answer:
      'Log in to your account, go to Settings > Billing, and click "Update Payment Method." You can add a new card or update your existing one. Changes take effect immediately.',
  },
  {
    category: 'Billing',
    question: 'When will I be charged?',
    answer:
      'Monthly plans are billed on the same date each month (the date you signed up). Annual plans are billed once per year. You\'ll receive an email invoice before each charge.',
  },
  {
    category: 'Technical',
    question: 'My phone has no dial tone. What should I do?',
    answer:
      'First, check that your phone is connected to power and your internet router. Restart the phone by unplugging it for 30 seconds, then plug it back in. If the issue persists, check your internet connection and contact our support team.',
  },
  {
    category: 'Technical',
    question: 'How do I configure my Grandstream phone?',
    answer:
      'After ordering, we\'ll send you a configuration email with your SIP credentials. Most Grandstream phones support auto-provisioning — just connect the phone to your network and it will configure itself. Manual setup guides are available in your account dashboard.',
  },
  {
    category: 'Technical',
    question: 'Why is my call quality poor?',
    answer:
      'Poor call quality is usually related to internet bandwidth or WiFi interference. Try connecting your phone via ethernet cable for best results. Also ensure you have at least 100 kbps upload/download per active call. Restarting your router often helps.',
  },
  {
    category: 'Account',
    question: 'How do I change my password?',
    answer:
      'Go to Account Settings > Security and click "Change Password." You\'ll need to enter your current password and then your new password twice. For security, use at least 8 characters with a mix of letters, numbers, and symbols.',
  },
  {
    category: 'Account',
    question: 'Can I have multiple users on one account?',
    answer:
      'Yes! Business Connect plan supports multiple users and extensions. You can invite team members from the Admin section of your dashboard and assign them different permission levels.',
  },
  {
    category: 'Returns',
    question: 'What is your return policy?',
    answer:
      'We offer a 30-day return policy on all hardware purchases. Items must be in original condition with all accessories. To initiate a return, contact support with your order number and we\'ll issue an RMA within 1 business day.',
  },
  {
    category: 'General',
    question: 'How do I port my existing phone number?',
    answer:
      'Number porting is available on all plans at no extra charge. Submit a porting request from your dashboard with your current provider\'s account number and PIN. The process typically takes 5-10 business days.',
  },
  {
    category: 'General',
    question: 'Do you offer a free trial?',
    answer:
      'We offer a 7-day money-back guarantee on all new accounts. If you\'re not completely satisfied within the first 7 days, contact us for a full refund — no questions asked.',
  },
];

const contactOptions = [
  {
    icon: Phone,
    title: 'Call Us',
    detail: '+1 (902) 593-4442',
    href: 'tel:+19025934442',
    sub: 'Mon–Fri, 8am–8pm CST',
    color: 'text-[#1bb0ce]',
    bg: 'bg-[#1bb0ce]/10',
  },
  {
    icon: Mail,
    title: 'Email Support',
    detail: 'support@oasisorchard.com',
    href: 'mailto:support@oasisorchard.com',
    sub: 'Response within 4 hours',
    color: 'text-[#22c55e]',
    bg: 'bg-[#22c55e]/10',
  },
  {
    icon: MessageCircle,
    title: 'Live Chat',
    detail: 'Chat with an expert',
    sub: 'Available 24/7',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
];

const subjectCategories = ['Billing', 'Technical Support', 'Account', 'Returns & Exchanges', 'General Inquiry'];

export default function Support() {
  const [openFaq, setOpenFaq] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
  });
  const toast = useToast();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((res) => setTimeout(res, 1000));
    setSubmitting(false);
    toast.success('Message sent! We\'ll get back to you within 4 hours.');
    setForm({ name: '', email: '', subject: '', category: '', message: '' });
  };

  return (
    <>
      <SEO
        title="Support — Get Help with Your Phone Service"
        description="Need help? Contact Oasis Orchard Technologies support by phone, email, or live chat. Browse FAQs and troubleshooting guides for your wireless VoIP phone."
        canonical="/support"
      />
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden py-24"
        style={{ background: '#0a1628' }}
      >
        <div className="absolute -right-40 -top-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #1bb0ce 0%, transparent 70%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-[#1bb0ce] text-xs font-bold tracking-[0.18em] uppercase mb-5">Real People · 24/7</span>
          <h1 className="font-display text-4xl sm:text-5xl text-white mb-6" style={{ fontWeight: 560 }}>
            How can we help?
          </h1>
          <p className="text-blue-100/80 text-lg mb-10">
            Search our help center or browse categories below.
          </p>
          {/* Search bar (decorative) */}
          <div className="relative max-w-xl mx-auto">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-800 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#1bb0ce] text-base"
            />
          </div>
        </div>
      </section>

      {/* ── QUICK LINKS ── */}
      <section className="py-16" style={{ background: 'var(--paper)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl text-[#0a1628] text-center mb-8" style={{ fontWeight: 560 }}>
            Browse by category
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map(({ icon: Icon, title, description, color }) => (
              <Card key={title} hover className="p-6 text-center cursor-pointer">
                <div
                  className={`w-14 h-14 rounded-full ${color} flex items-center justify-center mx-auto mb-4`}
                >
                  <Icon size={26} />
                </div>
                <h3 className="font-bold text-[#0a1628] mb-1">{title}</h3>
                <p className="text-gray-400 text-sm">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl text-[#0a1628] mb-4" style={{ fontWeight: 560 }}>
              Frequently asked questions
            </h2>
            <p className="text-[--ink-soft]">Quick answers to our most common questions.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-xl overflow-hidden bg-white"
                >
                  <button
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-left">
                      <span className="text-xs bg-[#1bb0ce]/10 text-[#1bb0ce] px-2 py-0.5 rounded-full font-semibold shrink-0">
                        {faq.category}
                      </span>
                      <span className="font-semibold text-[#0a1628]">{faq.question}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp size={20} className="text-[#1bb0ce] shrink-0 ml-2" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400 shrink-0 ml-2" />
                    )}
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: isOpen ? '400px' : '0px' }}
                  >
                    <p className="px-6 pb-5 text-[--ink-soft] leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CONTACT OPTIONS ── */}
      <section className="py-20" style={{ background: 'var(--paper)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl text-[#0a1628] mb-4" style={{ fontWeight: 560 }}>Contact us</h2>
            <p className="text-[--ink-soft]">
              Can't find what you need? Our team is standing by.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {contactOptions.map(({ icon: Icon, title, detail, href, sub, color, bg }) => (
              <Card key={title} hover className="p-6 text-center">
                <div
                  className={`w-14 h-14 rounded-full ${bg} flex items-center justify-center mx-auto mb-4`}
                >
                  <Icon size={26} className={color} />
                </div>
                <h3 className="font-bold text-[#0a1628] mb-1">{title}</h3>
                {href ? (
                  <a href={href} className="text-gray-700 font-medium text-sm hover:text-[#1bb0ce] transition-colors duration-150 break-all">{detail}</a>
                ) : (
                  <p className="text-gray-700 font-medium text-sm">{detail}</p>
                )}
                <p className="text-gray-400 text-xs mt-1">{sub}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT FORM ── */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl text-[#0a1628] mb-4" style={{ fontWeight: 560 }}>Send us a message</h2>
            <p className="text-[--ink-soft]">
              Fill out the form below and we'll respond within 4 hours during business hours.
            </p>
          </div>
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-[#ef4444]">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-[#ef4444]">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-[#ef4444]">*</span>
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce] focus:border-transparent bg-white"
                >
                  <option value="">Select a category...</option>
                  {subjectCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  placeholder="Brief description of your issue"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-[#ef4444]">*</span>
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Describe your issue or question in detail..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce] focus:border-transparent resize-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
              >
                {!submitting && <Send size={16} />}
                {submitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </Card>
        </div>
      </section>
    </div>
    </>
  );
}
