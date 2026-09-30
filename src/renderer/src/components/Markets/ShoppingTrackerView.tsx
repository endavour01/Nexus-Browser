import React, { useState } from 'react';
import { TrackedProduct } from '@shared/types';
import {
  ShoppingBag,
  Plus,
  Trash2,
  ExternalLink,
  Tag,
  TrendingDown,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface ShoppingTrackerViewProps {
  products: TrackedProduct[];
  onSaveProduct: (product: any) => Promise<TrackedProduct | undefined>;
  onRecordPricePoint: (productId: string, price: number, inStock?: boolean) => Promise<TrackedProduct | undefined>;
  onDeleteProduct: (id: string) => Promise<void>;
  onOpenLink?: (url: string) => void;
}

export const ShoppingTrackerView: React.FC<ShoppingTrackerViewProps> = ({
  products,
  onSaveProduct,
  onRecordPricePoint,
  onDeleteProduct,
  onOpenLink,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newUrl, setNewUrl] = useState<string>('');
  const [newRetailer, setNewRetailer] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Electronics');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newTargetAlert, setNewTargetAlert] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick price update dialog state
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);
  const [updatedPriceInput, setUpdatedPriceInput] = useState<string>('');

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice.trim()) return;

    setIsSubmitting(true);
    try {
      await onSaveProduct({
        title: newTitle.trim(),
        url: newUrl.trim() || 'https://example.com',
        retailer: newRetailer.trim() || 'Online Retailer',
        category: newCategory.trim() || 'General',
        initialPrice: parseFloat(newPrice),
        targetPriceAlert: newTargetAlert.trim() ? parseFloat(newTargetAlert) : undefined,
        notes: newNotes.trim() || undefined,
        inStock: true,
      });

      setShowAddModal(false);
      setNewTitle('');
      setNewUrl('');
      setNewRetailer('');
      setNewPrice('');
      setNewTargetAlert('');
      setNewNotes('');
    } catch (err) {
      console.error('Failed to add product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickRecord = async (productId: string) => {
    if (!updatedPriceInput.trim()) return;
    const priceNum = parseFloat(updatedPriceInput);
    if (isNaN(priceNum)) return;

    await onRecordPricePoint(productId, priceNum, true);
    setUpdatingProductId(null);
    setUpdatedPriceInput('');
  };

  return (
    <div className="space-y-4">
      {/* Disclaimer Banner */}
      <div className="p-3 bg-surface border border-subtle rounded-lg flex items-start gap-2.5 text-xs text-secondary">
        <Clock size={16} className="shrink-0 mt-0.5 text-primary" />
        <div>
          <strong>Verified Price History Principle:</strong> NEXUS Markets starts price tracking strictly from the date an item is added. We never fabricate, guess, or extrapolate past prices before your tracking began.
        </div>
      </div>

      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-primary flex items-center gap-2">
          <ShoppingBag size={16} /> Tracked Products ({products.length})
        </div>
        <button
          className="nexus-btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={14} /> Add Product to Track
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((prod) => {
          const isAtLowest = prod.currentPrice <= prod.lowestPrice;
          const hasTargetAlert = prod.targetPriceAlert !== undefined && prod.targetPriceAlert > 0;
          const isTargetReached = hasTargetAlert && prod.currentPrice <= prod.targetPriceAlert!;

          return (
            <div key={prod.id} className="markets-card p-4 space-y-3 relative flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-3xs uppercase font-mono bg-surface px-1.5 py-0.5 rounded border border-subtle text-secondary">
                      {prod.category} • {prod.retailer}
                    </span>
                    <h3 className="font-semibold text-sm text-primary mt-1 leading-snug">{prod.title}</h3>
                  </div>
                  <button
                    className="nexus-icon-btn text-secondary hover:text-red-400 p-1"
                    onClick={() => onDeleteProduct(prod.id)}
                    title="Delete tracked product"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Price Stats */}
                <div className="flex items-baseline gap-3 my-2">
                  <span className="text-2xl font-mono font-bold text-primary">
                    ${prod.currentPrice.toFixed(2)}
                  </span>
                  {isAtLowest && (
                    <span className="text-2xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <TrendingDown size={11} /> Lowest Recorded
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-2xs font-mono bg-surface/50 p-2 rounded border border-subtle">
                  <div>
                    <span className="text-secondary font-sans">Lowest: </span>
                    <span className="font-semibold text-primary">${prod.lowestPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-secondary font-sans">Highest: </span>
                    <span className="font-semibold text-primary">${prod.highestPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Alert Badge */}
                {hasTargetAlert && (
                  <div
                    className={`mt-2 text-2xs p-1.5 rounded flex items-center gap-1.5 ${
                      isTargetReached
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-surface text-secondary border border-subtle'
                    }`}
                  >
                    <Bell size={12} className={isTargetReached ? 'text-emerald-400' : 'text-secondary'} />
                    <span>
                      Alert target: <strong>${prod.targetPriceAlert?.toFixed(2)}</strong>{' '}
                      {isTargetReached ? '(Target Reached!)' : ''}
                    </span>
                  </div>
                )}

                {/* Price Checkpoints History */}
                <div className="mt-3 text-3xs text-secondary space-y-1 border-t border-subtle pt-2">
                  <div className="font-semibold uppercase tracking-wider text-2xs text-secondary mb-1">
                    Recorded Checkpoints ({prod.priceHistory?.length || 0})
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1 font-mono">
                    {prod.priceHistory?.map((h, i) => (
                      <div key={i} className="flex justify-between items-center bg-surface/30 px-2 py-0.5 rounded">
                        <span>{new Date(h.date).toLocaleDateString()}</span>
                        <span className="font-semibold text-primary">${h.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between border-t border-subtle pt-3 text-xs">
                <button
                  className="text-xs text-secondary hover:text-primary flex items-center gap-1"
                  onClick={() => onOpenLink ? onOpenLink(prod.url) : window.open(prod.url, '_blank')}
                >
                  <span>Visit Store</span>
                  <ExternalLink size={12} />
                </button>

                {updatingProductId === prod.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="New Price"
                      value={updatedPriceInput}
                      onChange={(e) => setUpdatedPriceInput(e.target.value)}
                      className="nexus-input text-2xs py-1 px-1.5 w-20 font-mono"
                      autoFocus
                    />
                    <button
                      className="nexus-btn-primary text-2xs px-2 py-1"
                      onClick={() => handleQuickRecord(prod.id)}
                    >
                      Save
                    </button>
                    <button
                      className="nexus-btn-ghost text-2xs px-1.5 py-1"
                      onClick={() => setUpdatingProductId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="nexus-btn-ghost text-2xs px-2 py-1 flex items-center gap-1"
                    onClick={() => {
                      setUpdatingProductId(prod.id);
                      setUpdatedPriceInput(prod.currentPrice.toString());
                    }}
                  >
                    <RefreshCw size={11} /> Record New Price
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {products.length === 0 && (
          <div className="col-span-full p-12 text-center text-secondary border border-subtle rounded-lg space-y-2">
            <ShoppingBag size={32} className="mx-auto text-secondary/50 mb-2" />
            <p className="text-sm font-semibold text-primary">No products currently tracked</p>
            <p className="text-xs text-secondary max-w-sm mx-auto">
              Add any item you are researching with its current price and desired alert threshold. NEXUS will record new price points and alert you when price drops.
            </p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="markets-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <h3 className="font-bold text-sm text-primary">Add Tracked Product</h3>
              <button
                className="text-secondary hover:text-primary text-xs"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-secondary text-2xs mb-1 font-medium">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="nexus-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-secondary text-2xs mb-1 font-medium">Store URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="nexus-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-secondary text-2xs mb-1 font-medium">Retailer Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Best Buy, Amazon"
                    value={newRetailer}
                    onChange={(e) => setNewRetailer(e.target.value)}
                    className="nexus-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-secondary text-2xs mb-1 font-medium">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Audio, Hardware"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="nexus-input w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-secondary text-2xs mb-1 font-medium">Current Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="399.99"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="nexus-input w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-secondary text-2xs mb-1 font-medium">Target Alert Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="349.99"
                    value={newTargetAlert}
                    onChange={(e) => setNewTargetAlert(e.target.value)}
                    className="nexus-input w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-secondary text-2xs mb-1 font-medium">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Wait for holiday discount"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="nexus-input w-full text-xs"
                />
              </div>

              <div className="text-3xs text-secondary/70 italic pt-1">
                Tracking history starts today. Past prices will not be simulated.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-subtle">
                <button
                  type="button"
                  className="nexus-btn-ghost text-xs px-3 py-1.5"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="nexus-btn-primary text-xs px-4 py-1.5"
                >
                  {isSubmitting ? 'Adding...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
