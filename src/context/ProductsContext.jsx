import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { products as productsApi } from '../lib/api';
import { products as localProducts } from '../data/products';

const ProductsContext = createContext(null);

function mapFromDB(p) {
  // MySQL returns DECIMAL columns as strings ("140.00") — coerce to
  // numbers or every .toFixed()/comparison downstream breaks.
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    originalPrice: parseFloat(p.original_price ?? p.price) || 0,
    price: parseFloat(p.price) || 0,
    onSale: p.on_sale ?? false,
    stock: parseInt(p.stock) || 0,
    rating: parseFloat(p.rating) || 0,
    reviews: parseInt(p.review_count) || 0,
    image: p.image_url ?? '',
    badge: p.badge ?? '',
    shortDesc: p.short_desc ?? '',
    specs: p.specs ?? {},
    features: p.features ?? [],
    status: p.is_active !== false,
  };
}

function mapToDB(p) {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    original_price: parseFloat(p.originalPrice) || parseFloat(p.price) || 0,
    price: parseFloat(p.price) || 0,
    on_sale: !!p.onSale,
    stock: parseInt(p.stock) || 0,
    rating: parseFloat(p.rating) || 0,
    review_count: parseInt(p.reviews) || 0,
    image_url: p.image || '',
    badge: p.badge || (p.onSale ? 'Sale' : ''),
    short_desc: p.shortDesc || '',
    specs: p.specs || {},
    features: p.features || [],
    is_active: p.status !== false,
  };
}

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('local');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await productsApi.list();
      if (error) throw error;
      if (data && data.length > 0) {
        setProducts(data.map(mapFromDB));
        setSource('mysql');
      } else {
        setProducts(localProducts);
        setSource('local');
      }
    } catch {
      setProducts(localProducts);
      setSource('local');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllProducts = useCallback(async () => {
    try {
      const { data, error } = await productsApi.listAll();
      if (error) throw error;
      if (data && data.length > 0) {
        return { products: data.map(mapFromDB), fromSupabase: true };
      }
      return { products: localProducts.map(p => ({ ...p, status: true })), fromSupabase: false };
    } catch {
      return { products: localProducts.map(p => ({ ...p, status: true })), fromSupabase: false };
    }
  }, []);

  const seedProductsToDB = useCallback(async () => {
    const results = [];
    for (const p of localProducts) {
      const { data, error } = await productsApi.create(mapToDB({ ...p, status: true }));
      if (!error) results.push(mapFromDB(data));
    }
    setProducts(results);
    setSource('mysql');
    return results;
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  async function addProduct(formData) {
    const row = mapToDB({ ...formData, onSale: !!formData.onSale, status: true });
    const { data, error } = await productsApi.create(row);
    if (error) throw new Error(error.message || 'Failed to save product.');
    const mapped = mapFromDB(data);
    setProducts(prev => [mapped, ...prev]);
    return mapped;
  }

  async function updateProduct(id, formData) {
    const row = mapToDB({ ...formData, id });
    const { data, error } = await productsApi.update(id, row);
    if (error) throw new Error(error.message || 'Failed to update product.');
    const mapped = mapFromDB(data);
    setProducts(prev => prev.map(p => p.id === id ? mapped : p));
  }

  async function toggleProduct(id) {
    const { error } = await productsApi.toggle(id);
    if (!error) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: !p.status } : p));
    }
  }

  async function deleteProduct(id) {
    const { error } = await productsApi.remove(id);
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  }

  return (
    <ProductsContext.Provider value={{
      products,
      loading,
      source,
      loadProducts,
      loadAllProducts,
      seedProductsToDB,
      addProduct,
      updateProduct,
      toggleProduct,
      deleteProduct,
    }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be inside ProductsProvider');
  return ctx;
}
