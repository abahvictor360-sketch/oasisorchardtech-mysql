import { useState } from 'react';
import { CreditCard, Wallet, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const inputClass =
  'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1bb0ce] focus:ring-1 focus:ring-[#1bb0ce] transition-colors duration-150';

function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

const METHODS = [
  { id: 'card', label: 'Credit Card', icon: CreditCard },
  { id: 'wallet', label: 'Wallet Balance', icon: Wallet },
  { id: 'later', label: 'Pay Later', icon: Clock },
];

export default function PaymentMethod({ selectedMethod, onMethodChange, walletBalance = 0, orderTotal = 0 }) {
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  });
  const [showCvv, setShowCvv] = useState(false);

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    let formatted = value;
    if (name === 'number') formatted = formatCardNumber(value);
    if (name === 'expiry') formatted = formatExpiry(value);
    if (name === 'cvv') formatted = value.replace(/\D/g, '').slice(0, 4);
    setCardData((prev) => ({ ...prev, [name]: formatted }));
  };

  const walletSufficient = walletBalance >= orderTotal;

  return (
    <div className="flex flex-col gap-4">
      {/* Method tabs */}
      <div className="flex gap-2">
        {METHODS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onMethodChange(id)}
            className={[
              'flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-all duration-150',
              selectedMethod === id
                ? 'border-[#1bb0ce] bg-[#e0f7fb] text-[#1bb0ce]'
                : 'border-gray-200 text-gray-500 hover:border-gray-300',
            ].join(' ')}
          >
            <Icon size={18} />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* Credit Card Form */}
      {selectedMethod === 'card' && (
        <div className="flex flex-col gap-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-[#0a1628] mb-1">Card Number</label>
            <input
              name="number"
              type="text"
              inputMode="numeric"
              value={cardData.number}
              onChange={handleCardChange}
              placeholder="1234 5678 9012 3456"
              className={inputClass}
              maxLength={19}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0a1628] mb-1">Expiry (MM/YY)</label>
              <input
                name="expiry"
                type="text"
                inputMode="numeric"
                value={cardData.expiry}
                onChange={handleCardChange}
                placeholder="MM/YY"
                className={inputClass}
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0a1628] mb-1">CVV</label>
              <div className="relative">
                <input
                  name="cvv"
                  type={showCvv ? 'text' : 'password'}
                  inputMode="numeric"
                  value={cardData.cvv}
                  onChange={handleCardChange}
                  placeholder="•••"
                  className={inputClass}
                  maxLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowCvv((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  {showCvv ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0a1628] mb-1">Name on Card</label>
            <input
              name="name"
              type="text"
              value={cardData.name}
              onChange={handleCardChange}
              placeholder="John Doe"
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Wallet Balance */}
      {selectedMethod === 'wallet' && (
        <div className="pt-2">
          <div className={[
            'rounded-xl p-5 border-2',
            walletSufficient
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200',
          ].join(' ')}>
            <div className="flex items-center gap-3 mb-3">
              <Wallet size={22} className={walletSufficient ? 'text-green-500' : 'text-red-500'} />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Your Balance</p>
                <p className={`text-2xl font-bold ${walletSufficient ? 'text-green-700' : 'text-red-600'}`}>
                  {formatCurrency(walletBalance)}
                </p>
              </div>
            </div>
            {walletSufficient ? (
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <CheckCircle size={16} />
                <span>Sufficient balance to complete this order.</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-red-600 text-sm">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>
                  Insufficient balance. You need{' '}
                  <strong>{formatCurrency(orderTotal - walletBalance)}</strong> more.
                  Please top up or choose another payment method.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pay Later */}
      {selectedMethod === 'later' && (
        <div className="pt-2">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex gap-3">
            <Clock size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-1">Pay Later — Invoice on Delivery</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                You will be invoiced within 24 hours of placing your order. Payment is due within 7
                business days. Available for verified business accounts only.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
