const CA_PROVINCES = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Northwest Territories',
  'Nova Scotia',
  'Nunavut',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Yukon',
];

const inputClass =
  'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1bb0ce] focus:ring-1 focus:ring-[#1bb0ce] transition-colors duration-150';

const inputErrorClass =
  'w-full border border-red-400 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300 transition-colors duration-150';

function FormField({ label, name, type = 'text', value, onChange, error, placeholder, required }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-[#0a1628]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={error ? inputErrorClass : inputClass}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function CheckoutForm({ formData = {}, onFormChange, errors = {} }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFormChange({ ...formData, [name]: value });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Section 1: Contact Info */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
          Contact Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormField
              label="Full Name"
              name="fullName"
              value={formData.fullName || ''}
              onChange={handleChange}
              error={errors.fullName}
              placeholder="John Doe"
              required
            />
          </div>
          <FormField
            label="Email Address"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
            error={errors.email}
            placeholder="john@example.com"
            required
          />
          <FormField
            label="Phone Number"
            name="phone"
            type="tel"
            value={formData.phone || ''}
            onChange={handleChange}
            error={errors.phone}
            placeholder="+1 (555) 000-0000"
            required
          />
        </div>
      </div>

      {/* Section 2: Shipping Address */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
          Shipping Address
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormField
              label="Street Address"
              name="street"
              value={formData.street || ''}
              onChange={handleChange}
              error={errors.street}
              placeholder="123 Main St, Apt 4B"
              required
            />
          </div>
          <FormField
            label="City"
            name="city"
            value={formData.city || ''}
            onChange={handleChange}
            error={errors.city}
            placeholder="Toronto"
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#0a1628]">
              Province <span className="text-red-500">*</span>
            </label>
            <select
              name="state"
              value={formData.state || ''}
              onChange={handleChange}
              className={errors.state ? inputErrorClass : inputClass}
            >
              <option value="">Select province…</option>
              {CA_PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
          </div>
          <FormField
            label="Postal Code"
            name="zip"
            value={formData.zip || ''}
            onChange={handleChange}
            error={errors.zip}
            placeholder="A1A 1A1"
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#0a1628]">Country</label>
            <input
              type="text"
              value="Canada"
              readOnly
              className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
