import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import StarRating from '../ui/StarRating';
import ReviewCard from './ReviewCard';

const MOCK_REVIEWS = [
  {
    name: 'Marcus T.',
    date: '2025-03-14',
    rating: 5,
    comment: 'Excellent build quality and crystal-clear audio. Setup was straightforward with GDMS cloud provisioning. Highly recommend for any small office deployment.',
    helpful: 12,
  },
  {
    name: 'Sarah K.',
    date: '2025-02-28',
    rating: 4,
    comment: 'Good phone overall. The WiFi connectivity is rock-solid and call quality is superb. Docking one star only because the user manual could be more detailed.',
    helpful: 7,
  },
  {
    name: 'James O.',
    date: '2025-01-19',
    rating: 5,
    comment: 'We replaced our entire office fleet with these. Zero issues after months of use. The HD audio makes a real difference in conference calls.',
    helpful: 9,
  },
];

function camelToTitleCase(str) {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

const TABS = ['Specifications', 'Features', 'Reviews', 'Compatibility'];

const STAR_BREAKDOWN = [
  { star: 5, percent: 65 },
  { star: 4, percent: 20 },
  { star: 3, percent: 8 },
  { star: 2, percent: 4 },
  { star: 1, percent: 3 },
];

export default function ProductTabs({ product }) {
  const [activeTab, setActiveTab] = useState('Specifications');

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'flex-shrink-0 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors duration-150 whitespace-nowrap',
              activeTab === tab
                ? 'border-[#1bb0ce] text-[#1bb0ce]'
                : 'border-transparent text-gray-500 hover:text-[#0a1628]',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {/* Tab 1: Specifications */}
        {activeTab === 'Specifications' && (
          <div>
            {product.specs && Object.keys(product.specs).length > 0 ? (
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[300px]">
                <tbody>
                  {Object.entries(product.specs).map(([key, value], index) => (
                    <tr
                      key={key}
                      className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                    >
                      <td className="px-4 py-2.5 font-medium text-[#0a1628] w-1/3">
                        {camelToTitleCase(key)}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {typeof value === 'boolean'
                          ? value ? 'Yes' : 'No'
                          : String(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No specifications available.</p>
            )}
          </div>
        )}

        {/* Tab 2: Features */}
        {activeTab === 'Features' && (
          <div>
            {product.features && product.features.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-[#22c55e] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No features listed.</p>
            )}
          </div>
        )}

        {/* Tab 3: Reviews */}
        {activeTab === 'Reviews' && (
          <div className="flex flex-col gap-6">
            {/* Star breakdown */}
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl font-bold text-[#0a1628]">{product.rating}</span>
                <div className="flex flex-col gap-1">
                  <StarRating rating={product.rating} />
                  <span className="text-xs text-gray-500">
                    Based on {product.reviews} review{product.reviews !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {STAR_BREAKDOWN.map(({ star, percent }) => (
                  <div key={star} className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500 w-4 text-right">{star}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-gray-400 w-8 text-right">{percent}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review cards */}
            <div className="flex flex-col gap-4">
              {MOCK_REVIEWS.map((review, i) => (
                <ReviewCard key={i} review={review} />
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Compatibility */}
        {activeTab === 'Compatibility' && (
          <div className="flex flex-col gap-5 text-sm text-gray-700">
            <p className="leading-relaxed">
              This device supports standard SIP (Session Initiation Protocol) and is compatible
              with all major VoIP providers. It can be provisioned via the{' '}
              <strong className="text-[#0a1628]">Grandstream Device Management System (GDMS)</strong>{' '}
              cloud platform for zero-touch deployment and remote management at scale.
            </p>

            <div>
              <p className="font-semibold text-[#0a1628] mb-2">Works with Major VoIP Providers</p>
              <ul className="flex flex-col gap-1.5 pl-4">
                {['RingCentral', 'Vonage Business', '8x8', 'Nextiva', 'Twilio', 'Zoom Phone', 'Microsoft Teams SIP Gateway', 'Amazon Chime'].map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-[#22c55e] flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold text-[#0a1628] mb-2">Grandstream GDMS Cloud Provisioning</p>
              <ul className="flex flex-col gap-1.5 pl-4">
                {[
                  'Zero-touch remote provisioning',
                  'Centralized device management',
                  'Firmware upgrade scheduling',
                  'Real-time monitoring & alerts',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-[#1bb0ce] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold text-[#0a1628] mb-2">Standard SIP Compatibility</p>
              <p className="leading-relaxed text-gray-600">
                Compliant with SIP RFC 3261. Supports SRTP for secure media, TLS for signaling
                encryption, and G.711/G.722/Opus codecs for HD voice quality. Compatible with any
                standards-based SIP server or IP-PBX (Asterisk, FreePBX, 3CX, Cisco CallManager, etc.).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
