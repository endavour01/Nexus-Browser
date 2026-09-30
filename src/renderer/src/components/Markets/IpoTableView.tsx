import React, { useState } from 'react';
import { IpoItem, IpoStatus } from '@shared/types';
import { ExternalLink, AlertCircle, CheckCircle2, Clock, Calendar, Search } from 'lucide-react';

interface IpoTableViewProps {
  ipos: IpoItem[];
  onOpenLink?: (url: string) => void;
}

export const IpoTableView: React.FC<IpoTableViewProps> = ({ ipos, onOpenLink }) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const statusFilters: { label: string; value: string }[] = [
    { label: 'All Issues', value: 'all' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Open Now', value: 'open' },
    { label: 'Closed', value: 'closed' },
    { label: 'Listed', value: 'listed' },
  ];

  const filteredIpos = ipos.filter((item) => {
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesQuery =
      searchQuery === '' ||
      item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.symbol && item.symbol.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.exchange.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const getStatusBadge = (status: IpoStatus, isProvisional: boolean) => {
    switch (status) {
      case 'open':
        return (
          <span className="markets-badge badge-open">
            <span className="live-dot" /> Open Now
          </span>
        );
      case 'upcoming':
        return (
          <span className="markets-badge badge-upcoming">
            <Clock size={11} /> {isProvisional ? 'Upcoming (Provisional)' : 'Upcoming'}
          </span>
        );
      case 'closed':
        return (
          <span className="markets-badge badge-closed">
            <Calendar size={11} /> Closed
          </span>
        );
      case 'listed':
        return (
          <span className="markets-badge badge-listed">
            <CheckCircle2 size={11} /> Listed on {status}
          </span>
        );
      default:
        return <span className="markets-badge">{status}</span>;
    }
  };

  const handleLinkClick = (url?: string) => {
    if (!url) return;
    if (onOpenLink) {
      onOpenLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="markets-section-container">
      {/* Disclaimer Alert */}
      <div className="markets-disclaimer-box mb-4">
        <AlertCircle size={15} className="text-secondary flex-shrink-0" />
        <span className="text-xs text-secondary leading-relaxed">
          <strong>Official Filings & Prospectus Data:</strong> IPO dates, price bands, and subscription ratios are compiled strictly from regulatory filings (SEC Forms S-1/F-1, SEBI DRHP, and exchange notices). NEXUS Markets does not predict listing day premiums or provide investment advice.
        </span>
      </div>

      {/* Control Row: Search & Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              className={`filter-pill ${selectedStatus === f.value ? 'active' : ''}`}
              onClick={() => setSelectedStatus(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="markets-search-box">
          <Search size={14} className="text-secondary" />
          <input
            type="text"
            placeholder="Search company, symbol, or exchange..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="markets-input"
          />
        </div>
      </div>

      {/* IPO Table */}
      <div className="markets-table-wrapper">
        <table className="markets-table">
          <thead>
            <tr>
              <th>Company & Symbol</th>
              <th>Status</th>
              <th>Price Band</th>
              <th>Lot Size</th>
              <th>Issue Size</th>
              <th>Timeline</th>
              <th>Subscription</th>
              <th>Official Filings</th>
            </tr>
          </thead>
          <tbody>
            {filteredIpos.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-secondary">
                  No IPO filings found matching your filter criteria.
                </td>
              </tr>
            ) : (
              filteredIpos.map((ipo) => (
                <tr key={ipo.id} className="markets-table-row">
                  <td>
                    <div className="font-semibold text-primary">{ipo.companyName}</div>
                    <div className="text-2xs text-secondary flex items-center gap-1.5 mt-0.5">
                      <span>{ipo.exchange}</span>
                      {ipo.symbol && <span className="ticker-pill">{ipo.symbol}</span>}
                      {ipo.isProvisional && (
                        <span className="text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded text-2xs">
                          Provisional
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{getStatusBadge(ipo.status, ipo.isProvisional)}</td>
                  <td>
                    {ipo.priceBandLow && ipo.priceBandHigh ? (
                      <span className="font-mono text-sm">
                        ${ipo.priceBandLow.toFixed(2)} - ${ipo.priceBandHigh.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-secondary text-xs">TBD / Unannounced</span>
                    )}
                    {ipo.listingPrice && (
                      <div className="text-2xs text-accent mt-0.5 font-mono">
                        Listed: ${ipo.listingPrice.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="font-mono text-sm">
                    {ipo.lotSize ? `${ipo.lotSize} shares` : '—'}
                  </td>
                  <td className="text-xs text-secondary font-mono">{ipo.issueSize || '—'}</td>
                  <td>
                    <div className="text-xs">
                      {ipo.openDate && <div>Open: {ipo.openDate}</div>}
                      {ipo.closeDate && <div>Close: {ipo.closeDate}</div>}
                      {ipo.listingDate && (
                        <div className="text-accent">List: {ipo.listingDate}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    {ipo.subscriptionTotal ? (
                      <div>
                        <div className="text-sm font-semibold font-mono">
                          {ipo.subscriptionTotal}x
                        </div>
                        {ipo.subscriptionQib && (
                          <div className="text-2xs text-secondary">
                            QIB: {ipo.subscriptionQib}x
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-secondary text-xs">
                        {ipo.status === 'upcoming' ? 'Not Open' : '—'}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {ipo.exchangeFilingUrl && (
                        <button
                          className="nexus-btn-ghost text-xs px-2 py-1 flex items-center gap-1"
                          onClick={() => handleLinkClick(ipo.exchangeFilingUrl)}
                          title="View Official SEC/Exchange Filing"
                        >
                          <span>Filing</span>
                          <ExternalLink size={11} />
                        </button>
                      )}
                      {ipo.prospectusUrl && (
                        <button
                          className="nexus-btn-ghost text-xs px-2 py-1 flex items-center gap-1"
                          onClick={() => handleLinkClick(ipo.prospectusUrl)}
                          title="View Official Prospectus"
                        >
                          <span>Prospectus</span>
                          <ExternalLink size={11} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
