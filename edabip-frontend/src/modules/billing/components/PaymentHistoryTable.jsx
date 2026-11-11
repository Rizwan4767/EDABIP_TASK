import { useMemo, useState } from 'react';
import DownloadIcon from '../../../assets/dashboard/payment-history/download-icon.svg';
import FilterIcon from '../../../assets/dashboard/payment-history/filter-icon.svg';
import SearchIcon from '../../../assets/dashboard/search.svg';
import SearchClear from '../../../assets/dashboard/charts/search-clear.svg';

const PAGE_SIZE = 10;

function statusClass(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'paid' || value === 'completed') return 'is-paid';
  if (value === 'failed' || value === 'overdue') return 'is-failed';
  return 'is-pending';
}

function pageList(page, pageCount) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const pages = [];
  for (let i = 1; i <= pageCount; i += 1) {
    if (i <= 3 || i === pageCount || Math.abs(i - page) <= 1) pages.push(i);
  }
  return [...new Set(pages)].sort((a, b) => a - b);
}

function PaymentHistoryTable({
  rows = [],
  page,
  onPageChange,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onSearchChange,
  onDownload,
  onFilter,
  filterActive = false,
  onOpenRow,
  isDownloading = false,
}) {
  const [search, setSearch] = useState('');

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.invoiceNumber, row.date, row.period, row.amount, row.status]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query)),
    );
  }, [rows, search]);

  const total = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = filteredRows.slice(start, start + PAGE_SIZE);
  const allSelected = visible.length > 0 && visible.every((row) => selectedIds.includes(row.id));
  const pages = pageList(safePage, pageCount);

  const canDownload = selectedIds.length > 0;

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    onSearchChange?.(event.target.value);
    onPageChange(1);
  };

  const handleDownload = () => {
    if (!canDownload || isDownloading) return;
    const selected = filteredRows.filter((row) => selectedIds.includes(row.id));
    if (!selected.length) return;
    onDownload?.({
      rows: selected,
      isNarrowed: true,
    });
  };

  return (
    <section className="bl-card bl-invoices ph-table-card" aria-label="Invoices">
      <div className="bl-card__header">
        <h3>Invoice</h3>
        <div className="bl-invoices__controls">
          <div className="bl-invoices__search">
            <img src={SearchIcon} alt="" className="bl-invoices__search-icon" width="14" height="14" />
            <input
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search"
              aria-label="Search invoices"
            />
            {search ? (
              <button
                type="button"
                className="bl-invoices__search-clear"
                onClick={() => {
                  setSearch('');
                  onSearchChange?.('');
                  onPageChange(1);
                }}
                aria-label="Clear search"
              >
                <img src={SearchClear} alt="" width="14" height="14" />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className="db-btn db-btn--outline bl-invoices__download"
            onClick={handleDownload}
            disabled={!canDownload || isDownloading}
            aria-busy={isDownloading}
            aria-label={canDownload ? 'Download selected invoices' : 'Download. Select at least one invoice first'}
          >
            <img src={DownloadIcon} alt="" width="16" height="16" />
            Download
          </button>
          <button
            type="button"
            className={`db-btn db-btn--outline bl-invoices__download${filterActive ? ' is-active' : ''}`}
            onClick={onFilter}
            aria-pressed={filterActive}
          >
            <img src={FilterIcon} alt="" width="12" height="12" />
            Filter
          </button>
        </div>
      </div>

      <div className="bl-table-wrap">
        <table className="bl-table ph-table">
          <thead>
            <tr>
              <th className="bl-table__check">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(event) => onToggleAll(visible.map((row) => row.id), event.target.checked)}
                  aria-label="Select all invoices on this page"
                />
              </th>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Period</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.length ? (
              visible.map((row) => (
                <tr key={row.id}>
                  <td className="bl-table__check">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => onToggleRow(row.id)}
                      aria-label={`Select ${row.invoiceNumber}`}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="ph-table__invoice"
                      onClick={() => onOpenRow(row)}
                    >
                      {row.invoiceNumber}
                    </button>
                  </td>
                  <td>{row.date}</td>
                  <td>{row.period}</td>
                  <td>{row.amount}</td>
                  <td>
                    <span className={`ph-status ${statusClass(row.status)}`}>{row.status}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="ph-table__empty">
                  No invoices match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bl-pagination">
        <p>
          Showing {total === 0 ? 0 : start + 1} to {Math.min(start + PAGE_SIZE, total)} of {total} invoices
        </p>
        <div className="bl-pagination__controls">
          <button type="button" onClick={() => onPageChange(safePage - 1)} disabled={safePage <= 1}>
            &lt; Back
          </button>
          {pages.map((pageNumber, index) => {
            const prev = pages[index - 1];
            return (
              <span key={pageNumber} className="bl-pagination__cluster">
                {prev && pageNumber - prev > 1 ? <span className="bl-pagination__ellipsis">...</span> : null}
                <button
                  type="button"
                  className={pageNumber === safePage ? 'bl-pagination__page is-active' : 'bl-pagination__page'}
                  onClick={() => onPageChange(pageNumber)}
                >
                  {pageNumber}
                </button>
              </span>
            );
          })}
          <button type="button" onClick={() => onPageChange(safePage + 1)} disabled={safePage >= pageCount}>
            Next &gt;
          </button>
        </div>
      </div>
    </section>
  );
}

export default PaymentHistoryTable;
