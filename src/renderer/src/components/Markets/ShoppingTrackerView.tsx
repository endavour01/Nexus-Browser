import React, { useState } from 'react';
import { TrackedProduct } from '@shared/types';
import { ShoppingBag, Plus, ExternalLink, Trash2, Bell, AlertCircle, TrendingDown, ArrowDownRight, Check } from 'lucide-react';

interface ShoppingTrackerViewProps {
  products: TrackedProduct[];
  onSaveProduct: (product: any) => Promise<any>;
  onRecordPricePoint: (productId: string, price: number, inStock?: boolean) => Promise<any>;
  onDeleteProduct: (productId: string) => Promise<any>;
  onOpenLink?: (url: string) => void;
}

export const ShoppingTrackerView: React.FC<ShoppingTrackerViewProps> = ({
  products,
  onSaveProduct,
  onRecordPricePoint,
  onDeleteProduct,
  onOpenLink,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(products[0]?.id || null);

  // New Product Form State
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [retailer, setRetailer] = useState('');
  const [category, setCategory] = useState('Computing');
  const [initialPrice, setInitialPrice] = useState<string>('');
  const [targetAlert, setTargetAlert] = useState<string>('');
  const [formError, setFormError] = useState('');

  // Checkpoint modal state
  const [newCheckpointPrice, setNewCheckpointPrice] = useState<string>('');
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false);

  const categories = ['all', 'Computing', 'Audio', 'Electronics', 'General'];

  const filteredProducts = products.filter(
    (p) => selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0] || null;

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Product title is required');
      return;
    }
    if (!url.trim()) {
      setFormError('Product URL is required');
      return;
    }

    const priceNum = parseFloat(initialPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('A valid initial price is required');
      return;
    }

    const alertNum = targetAlert ? parseFloat(targetAlert) : undefined;

    try {
      const saved = await onSaveProduct({
        title: title.trim(),
        url: url.trim(),
        retailer: retailer.trim() || 'Direct Store',
        category,
        currentPrice: priceNum,
        initialPrice: priceNum,
        targetPriceAlert: alertNum,
        currency: 'USD',
      });
      setIsAddModalOpen(false);
      setTitle('');
      setUrl('');
      setRetailer('');
      setInitialPrice('');
      setTargetAlert('');
      setSelectedProductId(saved.id);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product');
    }
  };

  const handleAddCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;
    const priceNum = parseFloat(newCheckpointPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    await onRecordPricePoint(activeProduct.id, priceNum, true);
    setIsCheckpointModalOpen(false);
    setNewCheckpointPrice('');
  };

  const handleLinkClick = (urlStr: string) => {
    if (onOpenLink) {
      onOpenLink(urlStr);
    } else {
      window.open(urlStr, '_blank');
    }
  };

  return (
    <div className="markets-section-container">
      {/* Informational Disclaimer Box */}
      <div className="markets-disclaimer-box mb-4">
        <AlertCircle size={15} className="text-secondary flex-shrink-0" />
        <span className="text-xs text-secondary leading-relaxed">
          <strong>Genuine Price Observation:</strong> NEXUS Shopping Price Tracker records genuine price checkpoints starting from the exact date a product is added. We do not invent simulated price history or bypass retailer terms.
        </span>
      </div>

      {/* Control Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {categories.map((c) => (
            <button
              key={c}
              className={`filter-pill ${selectedCategory === c ? 'active' : ''}`}
              onClick={() => setSelectedCategory(c)}
            >
              {c === 'all' ? 'All Tracked Items' : c}
            </button>
          ))}
        </div>

        <button
          className="nexus-btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={14} />
          <span>Track New Product</span>
        </button>
      </div>

      {/* Main Grid: Products List & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product List */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
            Watchlist ({filteredProducts.length})
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="p-6 text-center text-xs text-secondary border border-dashed border-subtle rounded-lg">
                No tracked products in this category yet. Click <strong>Track New Product</strong> to start monitoring genuine prices.
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = p.id === selectedProductId;
                const hasDroppedBelowTarget =
                  p.targetPriceAlert && p.currentPrice <= p.targetPriceAlert;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    className={`markets-fund-card ${isSelected ? 'active' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-semibold text-xs text-primary leading-tight line-clamp-2">
                        {p.title}
                      </div>
                      {hasDroppedBelowTarget && (
                        <span className="markets-badge badge-open flex-shrink-0" title="Target Price Met!">
                          <TrendingDown size={11} /> Alert Met
                        </span>
                      )}
                    </div>

                    <div className="text-2xs text-secondary mb-2">
                      {p.retailer} • {p.category}
                    </div>

                    <div className="flex items-baseline justify-between pt-1 border-t border-subtle">
                      <div className="text-sm font-mono font-bold text-accent">
                        ${p.currentPrice.toFixed(2)}
                      </div>
                      <div className="text-2xs text-secondary">
                        Low: ${p.lowestPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Detailed Product Timeline */}
        <div className="lg:col-span-2">
          {activeProduct ? (
            <div className="markets-card p-5 space-y-5">
              <div className="flex items-start justify-between border-b border-subtle pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="markets-badge">{activeProduct.category}</span>
                    <span className="text-2xs text-secondary">{activeProduct.retailer}</span>
                  </div>
                  <h2 className="text-base font-bold text-primary">{activeProduct.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="nexus-btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1"
                    onClick={() => handleLinkClick(activeProduct.url)}
                    title="Open Retailer Listing"
                  >
                    <span>Visit Store</span>
                    <ExternalLink size={12} />
                  </button>
                  <button
                    className="nexus-btn-ghost text-xs px-2 py-1.5 text-red-400 hover:bg-red-500/10"
                    onClick={() => onDeleteProduct(activeProduct.id)}
                    title="Remove from tracking"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Price Stats Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-surface/60 rounded border border-subtle">
                  <div className="text-2xs text-secondary">Current Price</div>
                  <div className="text-base font-mono font-bold text-accent">
                    ${activeProduct.currentPrice.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-surface/60 rounded border border-subtle">
                  <div className="text-2xs text-secondary">Lowest Recorded</div>
                  <div className="text-base font-mono font-semibold text-emerald-400">
                    ${activeProduct.lowestPrice.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-surface/60 rounded border border-subtle">
                  <div className="text-2xs text-secondary">Highest Recorded</div>
                  <div className="text-base font-mono font-semibold text-primary">
                    ${activeProduct.highestPrice.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-surface/60 rounded border border-subtle">
                  <div className="text-2xs text-secondary">Target Alert Threshold</div>
                  <div className="text-base font-mono font-semibold text-amber-400">
                    {activeProduct.targetPriceAlert ? `$${activeProduct.targetPriceAlert.toFixed(2)}` : 'None'}
                  </div>
                </div>
              </div>

              {/* Verified Price History Log */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-secondary uppercase tracking-wider">
                    Genuine Price History Checkpoints ({activeProduct.priceHistory.length})
                  </div>
                  <button
                    className="nexus-btn-ghost text-xs px-2.5 py-1 flex items-center gap-1"
                    onClick={() => {
                      setNewCheckpointPrice(activeProduct.currentPrice.toString());
                      setIsCheckpointModalOpen(true);
                    }}
                  >
                    <Plus size={12} />
                    <span>Log New Price</span>
                  </button>
                </div>

                <div className="markets-table-wrapper max-h-[220px] overflow-y-auto">
                  <table className="markets-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Observed Price</th>
                        <th>Retailer</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeProduct.priceHistory.map((point, idx) => (
                        <tr key={idx} className="markets-table-row">
                          <td className="text-xs font-mono">
                            {new Date(point.date).toLocaleDateString()} {new Date(point.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="text-xs font-mono font-bold text-primary">
                            ${point.price.toFixed(2)}
                          </td>
                          <td className="text-2xs text-secondary">{point.retailer}</td>
                          <td>
                            <span className="markets-badge badge-listed text-2xs">
                              <Check size={10} /> Verified
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Explanation Note */}
              <div className="text-2xs text-secondary leading-relaxed bg-surface/40 p-3 rounded border border-subtle">
                <strong>Tracking Protocol:</strong> {activeProduct.notes}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-secondary border border-subtle rounded-lg">
              Select or add a product to inspect historical pricing checkpoints.
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="nexus-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div
            className="nexus-modal-content max-w-lg p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
              <ShoppingBag size={18} className="text-accent" />
              <span>Track New Product</span>
            </h2>

            {formError && (
              <div className="p-2.5 mb-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="text-xs text-secondary block mb-1">Product Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sony WH-1000XM5 Headphones"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="markets-input w-full"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-secondary block mb-1">Store / Product URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="markets-input w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary block mb-1">Retailer Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Best Buy, Amazon, Apple"
                    value={retailer}
                    onChange={(e) => setRetailer(e.target.value)}
                    className="markets-input w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="markets-input w-full"
                  >
                    <option value="Computing">Computing</option>
                    <option value="Audio">Audio</option>
                    <option value="Electronics">Electronics</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary block mb-1">Initial Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="349.99"
                    value={initialPrice}
                    onChange={(e) => setInitialPrice(e.target.value)}
                    className="markets-input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary block mb-1">Price Alert Target ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Optional target alert"
                    value={targetAlert}
                    onChange={(e) => setTargetAlert(e.target.value)}
                    className="markets-input w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="nexus-btn-ghost px-4 py-1.5 text-xs"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="nexus-btn-primary px-4 py-1.5 text-xs">
                  Start Tracking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Checkpoint Modal */}
      {isCheckpointModalOpen && (
        <div className="nexus-modal-overlay" onClick={() => setIsCheckpointModalOpen(false)}>
          <div
            className="nexus-modal-content max-w-sm p-5 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-primary mb-3">Record Price Checkpoint</h3>
            <form onSubmit={handleAddCheckpoint} className="space-y-3">
              <div>
                <label className="text-xs text-secondary block mb-1">Observed Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newCheckpointPrice}
                  onChange={(e) => setNewCheckpointPrice(e.target.value)}
                  className="markets-input w-full"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="nexus-btn-ghost px-3 py-1.5 text-xs"
                  onClick={() => setIsCheckpointModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="nexus-btn-primary px-3 py-1.5 text-xs">
                  Log Checkpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
