import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../context/AuthContext.jsx';
import DashboardSidebar from '../../dashboard/components/DashboardSidebar.jsx';
import TopBar from '../../../components/layout/TopBar/index.jsx';
import AppFooter from '../../../components/common/AppFooter/index.jsx';
import ExportMenu from '../../../components/common/ExportMenu/index.jsx';
import SkeletonLoader from '../../../components/common/SkeletonLoader/index.jsx';
import SuccessToast from '../../user-management/components/SuccessToast.jsx';
import { useToast } from '../../../components/Toast/useToast';
import { downloadBlob, exportTable } from '../../../utils/exportUtils.js';
import '../../dashboard/pages/DashboardPage.css';
import '../pages/BillingPage.css';
import './PaymentHistoryPage.css';
import { getAllInvoices, getAllPayments, downloadInvoicePdfs, billingErrorDetail } from '../api/billingApi.js';
import { toInvoiceRows, toPaymentHistory } from '../api/adapters.js';
import PaymentHistoryTable from '../components/PaymentHistoryTable.jsx';
import TransactionDetailsModal from '../components/TransactionDetailsModal.jsx';
import PaymentHistoryFilterModal from '../components/PaymentHistoryFilterModal.jsx';
import ExportIcon from '../../../assets/dashboard/billing/export-icon.svg';

const INVOICE_COLUMNS = [
  { key: 'invoiceNumber', label: 'Invoice #' },
  { key: 'date', label: 'Date' },
  { key: 'period', label: 'Period' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
];

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function toDdMmYyyy(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

function inRange(date, from, to) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
  if (from && date < startOfDay(from)) return false;
  if (to && date > endOfDay(to)) return false;
  return true;
}

function joinInvoicePayments(invoices, payments) {
  const paymentByInvoice = new Map();
  payments.forEach((payment) => {
    if (payment.invoiceNumber && !paymentByInvoice.has(payment.invoiceNumber)) {
      paymentByInvoice.set(payment.invoiceNumber, payment);
    }
  });

  if (invoices.length) {
    return invoices.map((invoice) => ({
      ...invoice,
      payment: paymentByInvoice.get(invoice.invoiceNumber) || null,
    }));
  }

  return payments.map((payment) => ({
    id: payment.id,
    invoiceNumber: payment.invoiceNumber || payment.transactionId,
    date: payment.date,
    period: '—',
    amount: payment.amount,
    status: payment.status === 'Completed' ? 'Paid' : payment.status,
    issuedAt: payment.paidAt,
    payment,
  }));
}

function detailsForRow(row) {
  const payment = row.payment;
  const paid = String(row.status).toLowerCase() === 'paid';
  return {
    amount: payment?.amount || row.amount,
    status: payment?.status || (paid ? 'Completed' : row.status),
    date: payment?.date || toDdMmYyyy(row.issuedAt),
    transactionId: payment?.transactionId || '—',
    paymentMethod: payment?.paymentMethod || '—',
    cardNumber: payment?.cardNumber || '—',
    nameOnCard: payment?.nameOnCard || '—',
  };
}

function PaymentHistorySkeleton() {
  return (
    <section className="bl-card bl-invoices" aria-busy="true" aria-live="polite">
      <p className="visually-hidden">Loading payment history</p>
      <div className="bl-card__header">
        <SkeletonLoader width={90} height={18} />
        <SkeletonLoader width={320} height={36} borderRadius={8} />
      </div>
      {Array.from({ length: 8 }, (_, index) => (
        <SkeletonLoader key={index} width="100%" height={42} />
      ))}
    </section>
  );
}

function PaymentHistoryPage() {
  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({ from: null, to: null, preset: null });
  const [selectedRow, setSelectedRow] = useState(null);
  const [toast, setToast] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.allSettled([getAllInvoices(), getAllPayments()])
      .then(([invoiceResult, paymentResult]) => {
        if (!active) return;

        const invoices =
          invoiceResult.status === 'fulfilled' ? toInvoiceRows(invoiceResult.value).rows : [];
        const payments =
          paymentResult.status === 'fulfilled' ? toPaymentHistory(paymentResult.value).rows : [];

        if (invoiceResult.status === 'rejected' && paymentResult.status === 'rejected') {
          showError('Unable to Load Payment History', "We couldn't load your payment history right now.");
        }

        setRows(joinInvoicePayments(invoices, payments));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleRows = useMemo(() => {
    if (!dateFilter.from && !dateFilter.to) return rows;
    return rows.filter((row) => inRange(row.issuedAt || row.payment?.paidAt, dateFilter.from, dateFilter.to));
  }, [rows, dateFilter]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleAll = (ids, checked) => {
    setSelectedIds((prev) => {
      if (checked) return [...new Set([...prev, ...ids])];
      return prev.filter((id) => !ids.includes(id));
    });
  };

  const exportRows = selectedIds.length
    ? visibleRows.filter((row) => selectedIds.includes(row.id))
    : visibleRows;

  const handleExport = (format) => {
    exportTable({
      format,
      filename: 'payment-history',
      title: 'Payment History',
      columns: INVOICE_COLUMNS,
      rows: exportRows,
    });
    setToast({
      title: 'Downloaded Successfully',
      message: 'The file has been downloaded',
    });
  };

  const handleDownload = async ({ rows: downloadRows }) => {
    const invoices = downloadRows.filter((row) => row.invoiceNumber);
    if (!invoices.length) return;
    setDownloading(true);
    try {
      const file = await downloadInvoicePdfs(invoices.map((row) => row.invoiceNumber));
      downloadBlob(file.blob, file.filename);
      setToast({
        title: 'Downloaded Successfully',
        message:
          invoices.length === 1
            ? 'The tax invoice PDF has been downloaded'
            : `${invoices.length} tax invoices have been combined into one PDF`,
      });
    } catch (error) {
      showError(
        'Unable to Download Invoice',
        billingErrorDetail(error, "We couldn't generate that invoice PDF right now."),
      );
    } finally {
      setDownloading(false);
    }
  };

  const filterActive = Boolean(dateFilter.from || dateFilter.to);

  return (
    <div className="db-page ph-page">
      <DashboardSidebar onLogout={handleLogout} />

      <div className="db-main">
        <TopBar />

        <div className="db-content ph-content">
          <div className="ph-page-head">
            <h1>Payment History</h1>
            <ExportMenu
              iconSrc={ExportIcon}
              iconWidth={16}
              iconHeight={16}
              buttonClassName="db-btn db-btn--solid bl-download-btn"
              filename="payment-history"
              title="Payment History"
              columns={INVOICE_COLUMNS}
              rows={exportRows}
              onExport={handleExport}
            />
          </div>

          {loading ? (
            <PaymentHistorySkeleton />
          ) : (
            <PaymentHistoryTable
              rows={visibleRows}
              page={page}
              onPageChange={setPage}
              selectedIds={selectedIds}
              onToggleRow={toggleRow}
              onToggleAll={toggleAll}
              onDownload={handleDownload}
              isDownloading={downloading}
              onFilter={() => setFilterOpen(true)}
              filterActive={filterActive}
              onOpenRow={setSelectedRow}
            />
          )}

          <AppFooter />
        </div>
      </div>

      <TransactionDetailsModal
        isOpen={Boolean(selectedRow)}
        details={selectedRow ? detailsForRow(selectedRow) : null}
        onClose={() => setSelectedRow(null)}
      />

      <PaymentHistoryFilterModal
        isOpen={filterOpen}
        value={dateFilter}
        onApply={(next) => {
          setDateFilter(next);
          setPage(1);
          setFilterOpen(false);
        }}
        onClose={() => setFilterOpen(false)}
      />

      <SuccessToast
        isOpen={!!toast}
        title={toast?.title}
        message={toast?.message}
        onClose={() => setToast(null)}
      />
    </div>
  );
}

export default PaymentHistoryPage;
