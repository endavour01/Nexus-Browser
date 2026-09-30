import React, { useState, useMemo } from 'react';
import { IpoItem, IpoStatus } from '@shared/types';
import { ExternalLink, AlertTriangle, ShieldCheck, FileText, Calendar, Building } from 'lucide-react';

interface IpoTableViewProps {
  ipos: IpoItem[];
  onOpenLink?: (url: string) => void;
}

export const IpoTableView: React.FC<IpoTableViewProps> = ({ ipos, onOpenLink }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredIpos = useMemo(() => {
    return ipos.filter((item) => {
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      const matchesSearch =
        !searchQuery ||
        item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.symbol && item.symbol.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.exchange.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [ipos, filterStatus, searchQuery]);

  const getStatusBadge = (status: IpoStatus) => {
    switch (status) {
      case 'open':
        return <span className="markets-badge badge-realtime font-bold uppercase">Open Now</span>;
      case 'upcoming':
        return <span className="markets-badge badge-delayed font-semibold uppercase">Upcoming</span>;
      case 'closed':
        return <span className="markets-badge badge-historical font-medium uppercase">Closed</span>;
      case 'listed':
        return (
          <span className="markets-badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase">
            Listed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Disclaimer Banner */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2.5 text-xs text-amber-300">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <div>
          <strong>Informational IPO Registry:</strong> Data is aggregated from official exchange regulatory filings (SEC, NSE, BSE, SEBI). NEXUS Markets does not publish speculative listing gains, grey-market premiums, or investment endorsements.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3 rounded-lg border border-subtle">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['all', 'upcoming', 'open', 'closed', 'listed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 text-xs font-semibold rounded capitalize transition-colors ${
                filterStatus === status
                  ? 'bg-primary text-background'
                  : 'text-secondary hover:text-primary hover:bg-surface/80'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Filter IPOs by company or symbol..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="nexus-input text-xs w-64 max-w-full"
        />
      </div>

      {/* IPO Table & Cards */}
      <div className="overflow-x-auto rounded-lg border border-subtle">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface/60 border-b border-subtle text-secondary font-medium uppercase text-2xs tracking-wider">
              <th className="p-3">Company & Symbol</th>
              <th className="p-3">Status</th>
              <th className="p-3">Price Band</th>
              <th className="p-3">Issue & Lot</th>
              <th className="p-3">Dates</th>
              <th className="p-3">Subscription</th>
              <th className="p-3 text-right">Filings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {filteredIpos.map((ipo) => (
              <tr key={ipo.id} className="hover:bg-surface/40 transition-colors">
                <td className="p-3">
                  <div className="flex items-start gap-2">
                    <Building size={15} className="text-secondary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-primary">{ipo.companyName}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-2xs text-secondary font-mono">
                        {ipo.symbol && <span className="bg-surface px-1 py-0.5 rounded border border-subtle">{ipo.symbol}</span>}
                        <span>{ipo.exchange}</span>
                        {ipo.isProvisional && (
                          <span className="text-amber-400 font-medium">Provisional</span>
                        )}
                      </div>
                      {ipo.provisionalNotes && (
                        <div className="text-2xs text-amber-300/80 mt-1 max-w-sm italic">
                          {ipo.provisionalNotes}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">{getStatusBadge(ipo.status)}</td>
                <td className="p-3 font-mono">
                  {ipo.priceBandLow && ipo.priceBandHigh ? (
                    <div>
                      {ipo.currency} {ipo.priceBandLow} – {ipo.priceBandHigh}
                    </div>
                  ) : (
                    <span className="text-secondary text-2xs">TBD</span>
                  )}
                  {ipo.listingPrice && (
                    <div className="text-2xs text-emerald-400 font-semibold mt-0.5">
                      Listed: {ipo.currency} {ipo.listingPrice.toFixed(2)}
                    </div>
                  )}
                </td>
                <td className="p-3 font-mono text-secondary">
                  <div>{ipo.issueSize || '—'}</div>
                  {ipo.lotSize && <div className="text-2xs">Lot: {ipo.lotSize} shares</div>}
                </td>
                <td className="p-3 text-2xs text-secondary">
                  <div className="flex items-center gap-1">
                    <Calendar size={11} />
                    <span>Open: {ipo.openDate || 'TBD'}</span>
                  </div>
                  <div>Close: {ipo.closeDate || 'TBD'}</div>
                  {ipo.listingDate && (
                    <div className="text-primary font-medium">Listing: {ipo.listingDate}</div>
                  )}
                </td>
                <td className="p-3 font-mono text-2xs">
                  {ipo.subscriptionTotal !== undefined ? (
                    <div>
                      <span className="font-bold text-primary">{ipo.subscriptionTotal}x</span> Total
                      <div className="text-secondary text-3xs mt-0.5">
                        QIB: {ipo.subscriptionQib ?? '—'}x | Retail: {ipo.subscriptionRetail ?? '—'}x
                      </div>
                    </div>
                  ) : (
                    <span className="text-secondary">—</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {ipo.exchangeFilingUrl && (
                      <button
                        className="nexus-icon-btn p-1.5 hover:text-primary"
                        onClick={() => onOpenLink ? onOpenLink(ipo.exchangeFilingUrl!) : window.open(ipo.exchangeFilingUrl, '_blank')}
                        title="Official Exchange Filing"
                      >
                        <FileText size={14} />
                      </button>
                    )}
                    {ipo.prospectusUrl && (
                      <button
                        className="nexus-icon-btn p-1.5 hover:text-primary"
                        onClick={() => onOpenLink ? onOpenLink(ipo.prospectusUrl!) : window.open(ipo.prospectusUrl, '_blank')}
                        title="Regulatory Prospectus"
                      >
                        <ExternalLink size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filteredIpos.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-secondary">
                  No IPO entries found matching the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
