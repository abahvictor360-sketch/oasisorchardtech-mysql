import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { auth } from '../../lib/api';

export default function VerifyEmail() {
  const [params]          = useSearchParams();
  const token             = params.get('token') || '';
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    auth.verifyEmail(token).then(({ error }) => {
      setStatus(error ? 'error' : 'success');
    });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
          {status === 'loading' && (
            <>
              <Loader className="w-12 h-12 text-[#1bb0ce] animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900">Verifying your email...</h2>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Email verified!</h2>
              <p className="text-gray-500 text-sm mb-6">Your account is now active. You can log in.</p>
              <Link to="/login"
                className="inline-block bg-[#0a1628] text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#1bb0ce] transition-colors">
                Go to Login
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Verification failed</h2>
              <p className="text-gray-500 text-sm mb-6">This link is invalid or has expired. Log in and request a new verification email.</p>
              <Link to="/login"
                className="inline-block bg-[#0a1628] text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#1bb0ce] transition-colors">
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
