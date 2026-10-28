import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { RequisitionsPage } from './pages/RequisitionsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { RfqsPage } from './pages/RfqsPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { GoodsReceiptsPage } from './pages/GoodsReceiptsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected App Layout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/requisitions" element={<RequisitionsPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/rfqs" element={<RfqsPage />} />
          <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="/goods-receipts" element={<GoodsReceiptsPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
