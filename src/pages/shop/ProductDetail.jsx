import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  ShoppingCart,
  Zap,
  Heart,
  Share2,
  Copy,
  BookOpen,
  Shield,
  Lock,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../hooks/useToast';
import { formatCurrency, getStockStatus, calculateDiscount } from '../../utils/helpers';
import StarRating from '../../components/ui/StarRating';
import QuantitySelector from '../../components/ui/QuantitySelector';
import ProductTabs from '../../components/shop/ProductTabs';
import ProductCard from '../../components/shop/ProductCard';
import QuickViewModal from '../../components/shop/QuickViewModal';
import SEO from '../../components/seo/SEO';
import { productSchema } from '../../lib/schemas';

const TRUST_BADGES = [
  { icon: BookOpen, label: 'Free Setup Guide' },
  { icon: Shield, label: '1-Year Warranty' },
  { icon: Lock, label: 'Secure Checkout' },
  { icon: RotateCcw, label: 'Easy Returns' },
];

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const toast = useToast();
  const { products, loading } = useProducts();

  const product = products.find((p) => p.id === productId);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [copyDone, setCopyDone] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1bb0ce] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
          <h1 className="text-2xl font-bold text-[#0a1628] mb-2">Product Not Found</h1>
          <p className="text-gray-500 mb-6">
            The product you are looking for does not exist or may have been removed.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-[#1bb0ce] hover:bg-[#159bb8] text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-150"
          >
            <ShoppingCart size={18} />
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const thumbnails = [product.image, product.image, product.image];
  const stockStatus = getStockStatus(product.stock);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const { savings, percent } = hasDiscount
    ? calculateDiscount(product.originalPrice, product.price)
    : { savings: 0, percent: 0 };

  const wishlisted = isWishlisted(product.id);

  const categoryLabel = product.category === 'home-phone' ? 'Home Phone' : 'Mobile';

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`${product.name} added to cart!`);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const handleWishlist = () => {
    toggleWishlist(product);
    toast.info(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    });
  };

  return (
    <>
      <SEO
        title={`${product.name} — Grandstream Wireless VoIP Phone`}
        description={product.shortDesc + ` Buy the ${product.name} from Oasis Orchard Technologies, Canada's authorized Grandstream reseller. CA$${product.price.toFixed(2)}.`}
        canonical={`/shop/${product.id}`}
        image={`https://oasisorchardtech.com${product.image}`}
        type="og:product"
        schema={productSchema(product)}
      />
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 flex-wrap">
          <Link to="/" className="hover:text-[#1bb0ce] flex items-center gap-1 transition-colors duration-150">
            <Home size={14} />
            <span>Home</span>
          </Link>
          <ChevronRight size={14} />
          <Link to="/shop" className="hover:text-[#1bb0ce] transition-colors duration-150">
            Shop
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-400">{categoryLabel}</span>
          <ChevronRight size={14} />
          <span className="text-[#0a1628] font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* LEFT: Images */}
          <div className="flex flex-col gap-4">
            {/* Main image */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex items-center justify-center p-6 h-80 sm:h-96">
              <img
                src={thumbnails[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3">
              {thumbnails.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={[
                    'w-20 h-20 bg-white rounded-lg border-2 overflow-hidden flex items-center justify-center p-2 transition-all duration-150',
                    selectedImage === i
                      ? 'border-[#1bb0ce] shadow-sm'
                      : 'border-gray-200 hover:border-gray-300',
                  ].join(' ')}
                  aria-label={`View image ${i + 1}`}
                >
                  <img
                    src={src}
                    alt={`${product.name} thumbnail ${i + 1}`}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Product info */}
          <div className="flex flex-col gap-4">
            {/* Category + SKU */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#e0f7fb] text-[#1bb0ce] text-xs font-medium px-2.5 py-1 rounded-full">
                {categoryLabel}
              </span>
              <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-1 rounded-full">
                SKU: {product.sku}
              </span>
              {product.onSale && (
                <span className="bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                  Sale
                </span>
              )}
            </div>

            {/* Product name */}
            <h1 className="font-display text-2xl sm:text-3xl text-[#0a1628] leading-snug" style={{ fontWeight: 560 }}>
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 flex-wrap">
              <StarRating rating={product.rating} reviews={product.reviews} showCount />
              <button className="text-xs text-[#1bb0ce] hover:underline font-medium transition-colors duration-150">
                Write a Review
              </button>
            </div>

            {/* Price */}
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-mono-num text-3xl font-bold text-[#0a1628]">
                  {formatCurrency(product.price)}
                </span>
                {hasDiscount && (
                  <span className="font-mono-num text-lg text-gray-400 line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>
              {hasDiscount && (
                <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-sm font-medium px-3 py-1.5 rounded-lg self-start">
                  <CheckCircle size={14} />
                  You save {formatCurrency(savings)} ({percent}% off)
                </div>
              )}
            </div>

            {/* Stock status */}
            <p className={`text-sm font-semibold ${stockStatus.color}`}>{stockStatus.label}</p>

            {/* Short description */}
            <p className="text-sm text-gray-600 leading-relaxed">{product.shortDesc}</p>

            {/* Quantity selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#0a1628]">Quantity</label>
              <QuantitySelector
                value={quantity}
                min={1}
                max={product.stock || 1}
                onChange={setQuantity}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap mt-1">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-[#1bb0ce] hover:bg-[#159bb8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-5 rounded-xl transition-colors duration-150"
              >
                <ShoppingCart size={18} />
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-[#0a1628] hover:bg-[#0d1f38] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-5 rounded-xl transition-colors duration-150"
              >
                <Zap size={18} />
                Buy Now
              </button>
              <button
                onClick={handleWishlist}
                className={[
                  'p-3 rounded-xl border-2 transition-all duration-150',
                  wishlisted
                    ? 'border-red-300 bg-red-50 text-red-500'
                    : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400',
                ].join(' ')}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart size={20} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 border border-gray-100"
                  style={{ background: 'var(--paper)' }}
                >
                  <Icon size={16} className="text-[#1bb0ce] flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-600">{label}</span>
                </div>
              ))}
            </div>

            {/* Share */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
                <Share2 size={14} />
                Share:
              </span>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#1bb0ce] bg-gray-100 hover:bg-[#e0f7fb] px-3 py-1.5 rounded-lg transition-colors duration-150"
              >
                <Copy size={13} />
                {copyDone ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="mb-12">
          <ProductTabs product={product} />
        </div>

        {/* You May Also Like */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="font-display text-xl text-[#0a1628] mb-6" style={{ fontWeight: 560 }}>You may also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick view modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
    </>
  );
}
