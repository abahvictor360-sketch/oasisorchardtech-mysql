import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, RefreshCw, Upload } from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const CATEGORIES = [
  { value: 'mobile',     label: 'Mobile' },
  { value: 'home-phone', label: 'Home Phone' },
  { value: 'desk-phone', label: 'Desk Phone' },
];

function stockColor(stock) {
  if (stock > 10) return { text: 'text-green-600', bar: 'bg-green-500' };
  if (stock >= 5)  return { text: 'text-yellow-600', bar: 'bg-yellow-400' };
  return { text: 'text-red-500', bar: 'bg-red-500' };
}

const emptyForm = {
  name: '', sku: '', category: 'mobile', price: '', originalPrice: '',
  stock: '', shortDesc: '', image: '', onSale: false, badge: '',
};

export default function Products() {
  const { addToast } = useApp();
  const { loadAllProducts, seedProductsToDB, addProduct, updateProduct, toggleProduct, deleteProduct } = useProducts();

  const [allProducts, setAllProducts] = useState([]);
  const [loadingAll, setLoadingAll]   = useState(true);
  const [saving, setSaving]           = useState(false);
  const [seeding, setSeeding]         = useState(false);
  const [isLocal, setIsLocal]         = useState(false);
  const [modal, setModal]             = useState(null); // { mode:'add'|'edit', id? }
  const [deleteModal, setDeleteModal] = useState(null);
  const [form, setForm]               = useState(emptyForm);
  const [activeTab, setActiveTab]     = useState('all');

  const load = async () => {
    setLoadingAll(true);
    try {
      const { products: prods, fromSupabase } = await loadAllProducts();
      setAllProducts(prods);
      setIsLocal(!fromSupabase);
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const seeded = await seedProductsToDB();
      setAllProducts(seeded);
      setIsLocal(false);
      addToast(`${seeded.length} products saved to database!`, 'success');
    } catch (err) {
      addToast(err.message || 'Seeding failed.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const categoryTabs = ['all', ...CATEGORIES.map(c => c.value)];
  const displayed = activeTab === 'all'
    ? allProducts
    : allProducts.filter(p => p.category === activeTab);

  const openAdd  = () => { setForm(emptyForm); setModal({ mode: 'add' }); };
  const openEdit = (p) => {
    setForm({
      name: p.name, sku: p.sku, category: p.category,
      price: String(p.price), originalPrice: String(p.originalPrice ?? p.price),
      stock: String(p.stock), shortDesc: p.shortDesc ?? '',
      image: p.image ?? '', onSale: !!p.onSale, badge: p.badge ?? '',
    });
    setModal({ mode: 'edit', id: p.id });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim() || !form.price) {
      addToast('Name, SKU and Price are required.', 'error'); return;
    }
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        const p = await addProduct({ ...form, onSale: form.onSale });
        setAllProducts(prev => [p, ...prev]);
        addToast('Product added successfully!', 'success');
      } else {
        await updateProduct(modal.id, form);
        setAllProducts(prev => prev.map(p =>
          p.id === modal.id
            ? { ...p, ...form, price: parseFloat(form.price), originalPrice: parseFloat(form.originalPrice), stock: parseInt(form.stock) }
            : p
        ));
        addToast('Product updated!', 'success');
      }
      setModal(null);
    } catch (err) {
      addToast(err.message || 'Failed to save product.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (p) => {
    await toggleProduct(p.id);
    setAllProducts(prev => prev.map(x => x.id === p.id ? { ...x, status: !x.status } : x));
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteProduct(deleteModal.id);
      setAllProducts(prev => prev.filter(p => p.id !== deleteModal.id));
      addToast('Product deleted.', 'success');
      setDeleteModal(null);
    } catch { addToast('Delete failed.', 'error'); }
    finally { setSaving(false); }
  };

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0a1628]">Products</h2>
          <p className="text-sm text-gray-500 mt-0.5">{allProducts.length} total products</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={load} disabled={loadingAll}>
            <RefreshCw size={15} className={loadingAll ? 'animate-spin' : ''} />
          </Button>
          {isLocal && (
            <Button
              variant="secondary"
              loading={seeding}
              onClick={handleSeed}
              className="gap-1.5"
            >
              <Upload size={15} />
              Save to Database
            </Button>
          )}
          <Button onClick={openAdd}><Plus size={16} className="mr-1" />Add Product</Button>
        </div>
      </div>

      {/* Local data notice */}
      {isLocal && !loadingAll && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <span className="text-lg leading-none">⚠️</span>
          <div>
            <span className="font-semibold">Products are loaded from local data</span> — the database table is empty.
            Click <strong>Save to Database</strong> to persist all {allProducts.length} products to Supabase so
            they are editable, and visible in the shop.
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-gray-200">
        {categoryTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors',
              activeTab === tab
                ? 'border-[#1bb0ce] text-[#1bb0ce]'
                : 'border-transparent text-gray-500 hover:text-[#0a1628]',
            ].join(' ')}
          >
            {tab === 'all' ? 'All' : CATEGORIES.find(c => c.value === tab)?.label ?? tab}
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
              {tab === 'all' ? allProducts.length : allProducts.filter(p => p.category === tab).length}
            </span>
          </button>
        ))}
      </div>

      <Card>
        {loadingAll ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Product', 'SKU', 'Category', 'Price', 'Original', 'Stock', 'Sale', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`text-left px-4 py-3 text-gray-500 font-medium ${
                      ['SKU','Category','Original'].includes(h) ? 'hidden md:table-cell' : ''
                    }`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-400">No products in this category.</td></tr>
                ) : displayed.map(p => {
                  const sc = stockColor(p.stock);
                  return (
                    <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.image
                            ? <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-contain bg-gray-50 border flex-shrink-0" />
                            : <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0" />
                          }
                          <span className="font-medium text-[#0a1628] truncate max-w-[140px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 hidden md:table-cell">{p.sku}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant="info" size="sm">{CATEGORIES.find(c => c.value === p.category)?.label ?? p.category}</Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#0a1628]">{formatCurrency(p.price)}</td>
                      <td className="px-4 py-3 text-gray-400 line-through text-xs hidden md:table-cell">{formatCurrency(p.originalPrice)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${sc.bar}`} style={{ width: `${Math.min(100,(p.stock/20)*100)}%` }} />
                          </div>
                          <span className={`text-xs font-medium ${sc.text}`}>{p.stock}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {p.onSale
                          ? <Badge variant="danger" size="sm">Sale</Badge>
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={p.status ? 'success' : 'default'} size="sm">
                          {p.status ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button title="Edit" onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"><Pencil size={14} /></button>
                          <button title={p.status ? 'Deactivate' : 'Activate'} onClick={() => handleToggle(p)} className="p-1.5 rounded hover:bg-gray-100 transition-colors">
                            {p.status ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} className="text-gray-400" />}
                          </button>
                          <button title="Delete" onClick={() => setDeleteModal(p)} className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'add' ? 'Add New Product' : 'Edit Product'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {modal?.mode === 'add' ? 'Add Product' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
            <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Grandstream WP816"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40 focus:border-[#1bb0ce]" />
          </div>
          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">SKU *</label>
            <input value={form.sku} onChange={e => f('sku', e.target.value)} placeholder="e.g. WP816"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40 focus:border-[#1bb0ce]" />
          </div>
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
            <select value={form.category} onChange={e => f('category', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sale Price ($) *</label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={e => f('price', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40 focus:border-[#1bb0ce]" />
          </div>
          {/* Original Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Original Price ($)</label>
            <input type="number" min="0" step="0.01" value={form.originalPrice} onChange={e => f('originalPrice', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40 focus:border-[#1bb0ce]" />
          </div>
          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Quantity</label>
            <input type="number" min="0" value={form.stock} onChange={e => f('stock', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40 focus:border-[#1bb0ce]" />
          </div>
          {/* On Sale toggle */}
          <div className="flex items-center gap-3 pt-5">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.onSale} onChange={e => f('onSale', e.target.checked)} className="sr-only peer" />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-[#1bb0ce] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
              <span className="ml-2 text-sm font-medium text-gray-700">Mark as On Sale</span>
            </label>
          </div>
          {/* Badge */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Badge Text</label>
            <input value={form.badge} onChange={e => f('badge', e.target.value)} placeholder="e.g. Sale, New, Hot"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40 focus:border-[#1bb0ce]" />
          </div>
          {/* Image URL */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL</label>
            <input value={form.image} onChange={e => f('image', e.target.value)} placeholder="/images/product.png or https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40 focus:border-[#1bb0ce]" />
          </div>
          {/* Short Desc */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
            <textarea rows={2} value={form.shortDesc} onChange={e => f('shortDesc', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40 focus:border-[#1bb0ce] resize-none" />
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Product"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={saving}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>{deleteModal?.name}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
