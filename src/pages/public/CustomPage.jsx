import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { content as contentApi } from '../../lib/api';
import Spinner from '../../components/ui/Spinner';

export default function CustomPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await contentApi.get(`custom_page_${slug}`);
        if (data) {
          setPage(data);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <p className="text-6xl font-extrabold text-gray-200 mb-4">404</p>
        <h1 className="text-2xl font-bold text-[#0a1628] mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-6">This page doesn't exist or may have been removed.</p>
        <Link to="/" className="inline-flex items-center gap-2 text-[#1bb0ce] font-semibold hover:underline">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#1bb0ce] hover:underline mb-8">
          <ArrowLeft size={14} /> Home
        </Link>

        {/* Page title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0a1628] mb-4">{page.title}</h1>

        {page.subtitle && (
          <p className="text-lg text-gray-500 mb-10 border-b border-gray-100 pb-8">{page.subtitle}</p>
        )}

        {/* Body content — supports multiple blocks */}
        <div className="prose prose-gray max-w-none space-y-6">
          {(page.blocks || []).map((block, i) => {
            if (block.type === 'text') {
              return (
                <div key={i}>
                  {block.heading && <h2 className="text-xl font-bold text-[#0a1628] mt-8 mb-3">{block.heading}</h2>}
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{block.body}</p>
                </div>
              );
            }
            if (block.type === 'cta') {
              return (
                <div key={i} className="rounded-xl p-6 text-center mt-10" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1bb0ce 100%)' }}>
                  <p className="text-white font-bold text-xl mb-2">{block.heading}</p>
                  {block.body && <p className="text-blue-100 mb-4">{block.body}</p>}
                  {block.button && (
                    <Link to={block.link || '/signup'}>
                      <span className="inline-block bg-white text-[#0a1628] font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-50 transition-colors">
                        {block.button}
                      </span>
                    </Link>
                  )}
                </div>
              );
            }
            return null;
          })}
          {/* Plain body fallback for pages without blocks */}
          {!page.blocks?.length && page.body && (
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{page.body}</p>
          )}
        </div>
      </div>
    </div>
  );
}
