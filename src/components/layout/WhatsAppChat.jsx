import { useState } from 'react';
import { X } from 'lucide-react';
import { useSiteSettings } from '../../context/SiteSettingsContext';

function WAIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
      <path
        d="M16 2C8.268 2 2 8.268 2 16c0 2.47.672 4.784 1.84 6.77L2 30l7.46-1.814A13.94 13.94 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z"
        fill="#25D366"
      />
      <path
        d="M22.52 19.44c-.32-.16-1.894-.934-2.188-1.04-.293-.106-.507-.16-.72.16-.213.32-.826 1.04-.96 1.254-.133.213-.267.24-.587.08-.32-.16-1.35-.498-2.572-1.587-.95-.847-1.59-1.894-1.777-2.214-.186-.32-.02-.493.14-.652.145-.143.32-.374.48-.56.16-.187.213-.32.32-.534.107-.213.053-.4-.026-.56-.08-.16-.72-1.734-.986-2.374-.26-.614-.524-.534-.72-.534-.187-.006-.4-.01-.614-.01s-.56.08-.854.4c-.293.32-1.12 1.094-1.12 2.667 0 1.574 1.147 3.094 1.307 3.307.16.213 2.254 3.44 5.467 4.827.764.33 1.36.527 1.824.674.766.24 1.464.207 2.014.126.614-.09 1.894-.774 2.16-1.52.268-.748.268-1.387.188-1.52-.08-.134-.294-.214-.614-.374z"
        fill="#fff"
      />
    </svg>
  );
}

const PRE_TEXT = encodeURIComponent(
  "Hi! I'm interested in Oasis Orchard Technologies wireless phone service. Can you help me?"
);

export default function WhatsAppChat() {
  const { footer } = useSiteSettings();
  const [open, setOpen] = useState(false);

  const rawPhone = footer?.contact?.phone || '';
  const phone    = rawPhone.replace(/\D/g, '');

  if (!phone) return null;

  const waHref = `https://wa.me/${phone}?text=${PRE_TEXT}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Pop-up card */}
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-72 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center gap-3 bg-[#25D366] px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <WAIcon />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white text-sm leading-none">Oasis Orchard Support</p>
              <p className="text-green-100 text-xs mt-0.5">Typically replies in minutes</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Chat bubble */}
          <div className="bg-[#e5ddd5] px-4 py-4">
            <div className="bg-white rounded-xl rounded-tl-none px-3 py-2 shadow-sm max-w-[90%] text-sm text-gray-700 leading-relaxed">
              Hello! How can we help you today? 👋
              <br />
              Click the button below to start a WhatsApp chat with our team.
              <span className="block text-[10px] text-gray-400 mt-1 text-right">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="px-4 py-3 bg-white">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold text-sm py-2.5 rounded-xl transition-colors duration-200"
            >
              <WAIcon />
              Start Chat on WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Chat on WhatsApp"
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
      >
        {open ? <X size={24} className="text-white" /> : <WAIcon />}
      </button>
    </div>
  );
}
