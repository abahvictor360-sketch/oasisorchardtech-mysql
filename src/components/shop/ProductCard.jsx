import { useState } from 'react';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import StarRating from '../ui/StarRating';
import PriceDisplay from '../ui/PriceDisplay';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../hooks/useToast';

export default function ProductCard({ product, onQuickView }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const toast = useToast();
  const [adding, setAdding] = useState(false);

  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = () => {
    setAdding(true);
    addToCart(product, 1);
    toast.success('Added to cart!');
    setTimeout(() => setAdding(false), 600);
  };

  const handleWishlist = () => {
    toggleWishlist(product);
  };

  const categoryLabel = product.category === 'home-phone' ? 'Home Phone' : 'Mobile';

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
      {/* Image area */}
      <div className="relative h-48 bg-gray-50 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-4 hover:scale-105 transition-transform duration-300"
        />

        {/* Sale badge */}
        {product.onSale && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            Sale
          </span>
        )}

        {/* Wishlist heart */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors duration-150"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={18}
            className={wishlisted ? 'text-red-500' : 'text-gray-400'}
            fill={wishlisted ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        {/* Category tag */}
        <span className="inline-block self-start bg-[#e0f7fb] text-[#1bb0ce] text-xs font-medium px-2 py-0.5 rounded-full">
          {categoryLabel}
        </span>

        {/* Product name */}
        <h3 className="font-semibold text-[#0a1628] text-sm leading-snug truncate" title={product.name}>
          {product.name}
        </h3>

        {/* SKU */}
        <p className="text-xs text-gray-400">SKU: {product.sku}</p>

        {/* Star rating */}
        <StarRating rating={product.rating} reviews={product.reviews} showCount />

        {/* Price */}
        <PriceDisplay price={product.price} originalPrice={product.originalPrice} size="sm" />

        {/* Stock urgency */}
        {product.stock > 0 && product.stock < 6 && (
          <p className="text-xs font-medium text-orange-500">Only {product.stock} left!</p>
        )}
        {product.stock === 0 && (
          <p className="text-xs font-medium text-red-500">Out of stock</p>
        )}

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex gap-2 mt-1">
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || adding}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#1bb0ce] hover:bg-[#159bb8] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors duration-150"
          >
            <ShoppingCart size={15} />
            {adding ? 'Adding...' : 'Add to Cart'}
          </button>
          <button
            onClick={() => onQuickView && onQuickView(product)}
            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:text-[#1bb0ce] hover:border-[#1bb0ce] transition-colors duration-150"
            aria-label="Quick view"
            title="Quick view"
          >
            <Eye size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
