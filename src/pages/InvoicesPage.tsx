import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';
import { apiClient } from '@/integrations/api/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  name: string;
  date: string;
  reference: string;
  amount: number;
  status: 'open' | 'paid' | 'cancelled' | 'refunded';
  balance: number;
}

export default function InvoicesPage() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const [newInvoice, setNewInvoice] = useState({
    name: '',
    reference: '',
    amount: '',
    status: 'open',
  });

  const filterInvoices = () => {
    let filtered = invoices;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (inv) =>
          inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, statusFilter, searchTerm]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/invoices', {
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to load invoices: ${res.status}`);
      }

      const data: Invoice[] = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };



  const handleAddInvoice = async () => {
    if (!newInvoice.name || !newInvoice.amount) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newInvoice.name,
          reference: newInvoice.reference || null,
          amount: parseFloat(newInvoice.amount),
          status: newInvoice.status,
        }),
      });

      if (!res.ok) throw new Error('Failed to create invoice');

      toast({
        title: 'Success',
        description: 'Invoice created successfully',
      });

      setShowAddInvoice(false);
      setNewInvoice({ name: '', reference: '', amount: '', status: 'open' });
      await loadInvoices();
    } catch (err) {
      console.error('Failed to create invoice:', err);
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'refunded':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusCounts = () => {
    return {
      all: invoices.length,
      open: invoices.filter((i) => i.status === 'open').length,
      paid: invoices.filter((i) => i.status === 'paid').length,
      cancelled: invoices.filter((i) => i.status === 'cancelled').length,
      refunded: invoices.filter((i) => i.status === 'refunded').length,
    };
  };

  const counts = getStatusCounts();
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage and track your invoices</p>
        </div>
        <Dialog open={showAddInvoice} onOpenChange={setShowAddInvoice}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4" />
              Add Invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="inv-name">Invoice Name *</Label>
                <Input
                  id="inv-name"
                  placeholder="e.g., INV-001"
                  value={newInvoice.name}
                  onChange={(e) => setNewInvoice({ ...newInvoice, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="inv-reference">Reference</Label>
                <Input
                  id="inv-reference"
                  placeholder="e.g., PO-123"
                  value={newInvoice.reference}
                  onChange={(e) => setNewInvoice({ ...newInvoice, reference: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="inv-amount">Amount *</Label>
                <Input
                  id="inv-amount"
                  type="number"
                  placeholder="0.00"
                  value={newInvoice.amount}
                  onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="inv-status">Status</Label>
                <select
                  id="inv-status"
                  title="Invoice Status"
                  value={newInvoice.status}
                  onChange={(e) => setNewInvoice({ ...newInvoice, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="open">Open</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <Button onClick={handleAddInvoice} className="w-full">
                Create Invoice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="all"
              checked={statusFilter === 'all'}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-4 h-4"
            />
            <span className="text-sm">All ({counts.all})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="open"
              checked={statusFilter === 'open'}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-4 h-4"
            />
            <span className="text-sm">Open ({counts.open})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="paid"
              checked={statusFilter === 'paid'}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-4 h-4"
            />
            <span className="text-sm">Paid ({counts.paid})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="cancelled"
              checked={statusFilter === 'cancelled'}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-4 h-4"
            />
            <span className="text-sm">Cancelled ({counts.cancelled})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="refunded"
              checked={statusFilter === 'refunded'}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-4 h-4"
            />
            <span className="text-sm">Refunded ({counts.refunded})</span>
          </label>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <select
            title="Items per page"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-muted-foreground">entries</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Search:</span>
          <Input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading invoices...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Reference</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3 text-sm">
                        <a href="#" className="text-blue-600 hover:underline">
                          {invoice.id}
                        </a>
                      </td>
                      <td className="px-6 py-3 text-sm">{invoice.name}</td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">
                        {invoice.date || 'N/A'}
                      </td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">
                        {invoice.reference || '-'}
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold">
                        {Number(invoice.amount || 0).toFixed(2)} USD
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold">
                        {Number(invoice.balance || 0).toFixed(2)} USD
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {paginatedInvoices.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length}{' '}
          entries
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              onClick={() => setCurrentPage(page)}
              className={currentPage === page ? 'bg-blue-600' : ''}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
