import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Phone, Check, AlertCircle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { servicePlans } from '../../data/products';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Signup() {
  const navigate = useNavigate();
  const toast = useToast();
  const { signup, login } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    plan: 'smart',
    terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    // Clear field error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required.';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required.';
    if (!form.password) {
      newErrors.password = 'Password is required.';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    if (!form.terms) newErrors.terms = 'You must agree to the Terms of Service.';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      // Create the account in Supabase
      await signup(form.email, form.password, {
        name: form.name,
        phone: form.phone,
        plan: form.plan,
        role: 'user',
      });

      // Try to auto-login immediately so we can land on the plan/subscribe page
      try {
        await login(form.email, form.password);
        toast.success(`Welcome, ${form.name}! Please activate your subscription below.`);
        navigate('/dashboard/plan?welcome=1');
      } catch {
        // Email confirmation may be required — send them to login
        toast.success('Account created! Please check your email to confirm, then sign in.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1bb0ce 100%)' }}
    >
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-[#1bb0ce] flex items-center justify-center shadow-lg">
              <Phone size={24} className="text-white" />
            </div>
            <span className="text-white text-2xl font-extrabold tracking-tight">
              Oasis Orchard
            </span>
          </div>
          <p className="text-blue-200 text-sm">Crystal-Clear Calls. Unbeatable Price.</p>
        </div>

        <Card className="p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-[#0a1628] mb-1 text-center">
            Create your account
          </h1>
          <p className="text-gray-400 text-sm text-center mb-6">
            Get started with crystal-clear phone service today.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Smith"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce] focus:border-transparent transition-colors ${
                  errors.name ? 'border-[#ef4444]' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="flex items-center gap-1 text-[#ef4444] text-xs mt-1">
                  <AlertCircle size={12} /> {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jane@example.com"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce] focus:border-transparent transition-colors ${
                  errors.email ? 'border-[#ef4444]' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="flex items-center gap-1 text-[#ef4444] text-xs mt-1">
                  <AlertCircle size={12} /> {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce] focus:border-transparent transition-colors ${
                  errors.phone ? 'border-[#ef4444]' : 'border-gray-300'
                }`}
              />
              {errors.phone && (
                <p className="flex items-center gap-1 text-[#ef4444] text-xs mt-1">
                  <AlertCircle size={12} /> {errors.phone}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password <span className="text-[#ef4444]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className={`w-full border rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce] focus:border-transparent transition-colors ${
                    errors.password ? 'border-[#ef4444]' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="flex items-center gap-1 text-[#ef4444] text-xs mt-1">
                  <AlertCircle size={12} /> {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password <span className="text-[#ef4444]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className={`w-full border rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce] focus:border-transparent transition-colors ${
                    errors.confirmPassword ? 'border-[#ef4444]' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="flex items-center gap-1 text-[#ef4444] text-xs mt-1">
                  <AlertCircle size={12} /> {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Plan selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select a Plan <span className="text-[#ef4444]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {servicePlans.map((plan) => {
                  const selected = form.plan === plan.id;
                  return (
                    <label
                      key={plan.id}
                      className={[
                        'relative flex flex-col items-center text-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-150',
                        selected
                          ? 'border-[#1bb0ce] bg-[#1bb0ce]/5 shadow-md'
                          : 'border-gray-200 hover:border-[#1bb0ce]/50',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={selected}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      {plan.popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#1bb0ce] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                          Popular
                        </span>
                      )}
                      <span className="font-bold text-[#0a1628] text-sm mt-1">{plan.name}</span>
                      <span className="text-2xl font-extrabold text-[#1bb0ce] my-1">
                        ${plan.price}
                        <span className="text-xs text-gray-400 font-normal">/mo</span>
                      </span>
                      {selected && (
                        <span className="w-5 h-5 rounded-full bg-[#1bb0ce] flex items-center justify-center mt-1">
                          <Check size={12} className="text-white" />
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="terms"
                  checked={form.terms}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 accent-[#1bb0ce] rounded shrink-0"
                />
                <span className="text-sm text-gray-600">
                  I agree to the{' '}
                  <Link to="/terms" className="text-[#1bb0ce] hover:underline font-medium">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-[#1bb0ce] hover:underline font-medium">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.terms && (
                <p className="flex items-center gap-1 text-[#ef4444] text-xs mt-1">
                  <AlertCircle size={12} /> {errors.terms}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              className="mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#1bb0ce] font-semibold hover:underline">
              Login
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
