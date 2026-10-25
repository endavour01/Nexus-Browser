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
        return <span className="markets-badge badge-open font-bold uppercase">Open Now</span>;
      case 'upcoming':
        return <span className="markets-badge badge-upcoming font-semibold uppercase">Upcoming</span>;
      case 'closed':
        return <span className="markets-badge badge-closed font-medium uppercase">Closed</span>;
      case 'listed':
        return <span className="markets-badge badge-listed font-semibold uppercase">Listed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="markets-stack">
      {/* Disclaimer Banner */}
      <div className="markets-notice-banner notice-amber">
        <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-400" />
        <div>
          <strong>Informational IPO Registry:</strong> Data is aggregated from official exchange regulatory filings (SEC, NSE, BSE, SEBI). NEXUS Markets does not publish speculative listing gains, grey-market premiums, or investment endorsements.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="markets-filter-toolbar">
        <div className="markets-pill-group">
          {['all', 'upcoming', 'open', 'closed', 'listed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`markets-filter-pill ${filterStatus === status ? 'active' : ''}`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="markets-search-box w-64 max-w-full">
          <input
            type="text"
            placeholder="Filter IPOs by company or symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="markets-input"
          />
        </div>
      </div>

      {/* IPO Table & Cards */}
      <div className="markets-ipo-table-container">
        <table className="markets-ipo-table">
          <thead>
            <tr>
              <th style={{ width: '28%', minWidth: '240px' }}>Company & Symbol</th>
              <th style={{ width: '10%', minWidth: '95px' }}>Status</th>
              <th style={{ width: '14%', minWidth: '130px' }}>Price Band</th>
              <th style={{ width: '13%', minWidth: '120px' }}>Issue & Lot</th>
              <th style={{ width: '17%', minWidth: '150px' }}>Dates</th>
              <th style={{ width: '12%', minWidth: '110px' }}>Subscription</th>
              <th style={{ width: '6%', minWidth: '75px', textAlign: 'right' }}>Filings</th>
            </tr>
          </thead>
          <tbody>
            {filteredIpos.map((ipo) => (
              <tr key={ipo.id} className="hover:bg-surface/40 transition-colors">
                <td>
                  <div className="flex items-start gap-2">
                    <Building size={15} className="text-secondary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-primary">{ipo.companyName}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-2xs text-secondary font-mono">
                        {ipo.symbol && (
                          <span className="ticker-pill">{ipo.symbol}</span>
                        )}
                        <span>{ipo.exchange}</span>
                        {ipo.isProvisional && (
                          <span className="text-amber-400 font-medium">Provisional</span>
                        )}
                      </div>
                      {ipo.provisionalNotes && (
                        <div className="markets-provisional-note" title={ipo.provisionalNotes}>
                          <AlertTriangle size={11} className="shrink-0 text-amber-400 mt-0.5" />
                          <span>{ipo.provisionalNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td>{getStatusBadge(ipo.status)}</td>
                <td className="font-mono">
                  {ipo.priceBandLow && ipo.priceBandHigh ? (
                    <div style={{ whiteSpace: 'nowrap' }}>
                      {ipo.currency} {ipo.priceBandLow} – {ipo.priceBandHigh}
                    </div>
                  ) : (
                    <span className="text-secondary text-2xs">TBD</span>
                  )}
                  {ipo.listingPrice && (
                    <div className="text-2xs text-emerald-400 font-semibold mt-0.5" style={{ whiteSpace: 'nowrap' }}>
                      Listed: {ipo.currency} {ipo.listingPrice.toFixed(2)}
                    </div>
                  )}
                </td>
                <td className="font-mono text-secondary">
                  <div style={{ whiteSpace: 'nowrap' }}>{ipo.issueSize || '—'}</div>
                  {ipo.lotSize && (
                    <div className="text-2xs" style={{ whiteSpace: 'nowrap' }}>
                      Lot: {ipo.lotSize} shares
                    </div>
                  )}
                </td>
                <td className="text-2xs text-secondary">
                  <div className="markets-date-item">
                    <Calendar size={11} className="text-secondary shrink-0" />
                    <span>Open: <strong>{ipo.openDate || 'TBD'}</strong></span>
                  </div>
                  <div className="markets-date-item">
                    <span style={{ paddingLeft: '15px' }}>Close: <strong>{ipo.closeDate || 'TBD'}</strong></span>
                  </div>
                  {ipo.listingDate && (
                    <div className="markets-date-item text-primary font-medium">
                      <span style={{ paddingLeft: '15px' }}>Listing: <strong>{ipo.listingDate}</strong></span>
                    </div>
                  )}
                </td>
                <td className="font-mono text-2xs">
                  {ipo.subscriptionTotal !== undefined ? (
                    <div style={{ whiteSpace: 'nowrap' }}>
                      <span className="font-bold text-primary">{ipo.subscriptionTotal}x</span> Total
                      <div className="text-secondary text-3xs mt-0.5">
                        QIB: {ipo.subscriptionQib ?? '—'}x | Retail: {ipo.subscriptionRetail ?? '—'}x
                      </div>
                    </div>
                  ) : (
                    <span className="text-secondary">—</span>
                  )}
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1.5" style={{ whiteSpace: 'nowrap' }}>
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
