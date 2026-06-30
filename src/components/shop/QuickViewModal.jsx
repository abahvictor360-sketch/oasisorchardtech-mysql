import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, ExternalLink } from 'lucide-react';
import Modal from '../ui/Modal';
import StarRating from '../ui/StarRating';
import PriceDisplay from '../ui/PriceDisplay';
import QuantitySelector from '../ui/QuantitySelector';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../hooks/useToast';
import { getStockStatus } from '../../utils/helpers';

export default function QuickViewModal({ product, isOpen, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const toast = useToast();

  if (!product) return null;

  const stockStatus = getStockStatus(product.stock);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`${product.name} added to cart!`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick View" size="lg">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Left: Image */}
        <div className="sm:w-56 flex-shrink-0 bg-gray-50 rounded-xl flex items-center justify-center p-4 min-h-[180px]">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-44 object-contain"
          />
        </div>

        {/* Right: Details */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Category */}
          <span className="inline-block self-start bg-[#e0f7fb] text-[#1bb0ce] text-xs font-medium px-2 py-0.5 rounded-full">
            {product.category === 'home-phone' ? 'Home Phone' : 'Mobile'}
          </span>

          {/* Name */}
          <h3 className="text-xl font-bold text-[#0a1628] leading-snug">{product.name}</h3>

          {/* SKU */}
          <p className="text-xs text-gray-400">SKU: {product.sku}</p>

          {/* Rating */}
          <StarRating rating={product.rating} reviews={product.reviews} showCount />

          {/* Price */}
          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
            size="md"
            showSavings
          />

          {/* Short description */}
          {product.shortDesc && (
            <p className="text-sm text-gray-600 leading-relaxed">{product.shortDesc}</p>
          )}

          {/* Stock status */}
          <p className={`text-sm font-medium ${stockStatus.color}`}>{stockStatus.label}</p>

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <QuantitySelector
              value={quantity}
              min={1}
              max={product.stock || 99}
              onChange={setQuantity}
            />
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex items-center gap-2 bg-[#1bb0ce] hover:bg-[#159bb8] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors duration-150"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
          </div>

          {/* View full details link */}
          <Link
            to={`/shop/${product.id}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-sm text-[#1bb0ce] hover:text-[#159bb8] font-medium transition-colors duration-150 mt-1"
          >
            View Full Details
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>
    </Modal>
  );
}
