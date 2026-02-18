import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Plus, Calendar, Download, RefreshCw, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FinancialSummary {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  totalTax: number;
  totalDiscount: number;
  paymentMethods: {
    [key: string]: number;
  };
  dailyRevenue: Array<{ date: string; amount: number; count: number }>;
  topEquipment: Array<{ name: string; quantity: number; revenue: number }>;
  equipmentInventoryValue: number;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

export default function FinancePage() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [timeframe, setTimeframe] = useState("30days");
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: "",
    description: "",
    paymentMethod: "cash",
  });

  useEffect(() => {
    loadFinancialSummary();
  }, [dateRange]);

  const updateTimeframe = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    const today = new Date();
    let startDate = new Date();

    switch (newTimeframe) {
      case "7days":
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30days":
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90days":
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "ytd":
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
    }

    setDateRange({
      startDate: startDate.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    });
  };

  const loadFinancialSummary = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const res = await fetch(`/api/finance/summary?${params}`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to load financial summary: ${res.status}`);
      }
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error("Finance API error:", err);
      toast({
        title: "Error",
        description: "Failed to load financial data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          subtotal: parseFloat(newTransaction.amount),
          notes: newTransaction.description,
          type: "pos_sale",
        }),
      });

      if (!res.ok) throw new Error("Failed to add transaction");

      toast({
        title: "Success",
        description: "Transaction added successfully",
      });

      setShowAddTransaction(false);
      setNewTransaction({ amount: "", description: "", paymentMethod: "cash" });
      await loadFinancialSummary();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: "csv") => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format,
      });
      const res = await fetch(`/api/finance/export?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financial-report-${dateRange.startDate}-${dateRange.endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Success", description: "Report exported as CSV" });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6">
        <p className="text-gray-500">No financial data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="page-header mb-6 flex justify-between items-start">
        <div>
          <h1 className="page-title flex items-center gap-2 text-3xl font-bold">
            <DollarSign className="w-8 h-8" />
            Finance Dashboard
          </h1>
          <p className="page-description text-gray-600 mt-1">
            Revenue tracking & financial metrics
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record New Transaction</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newTransaction.amount}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, amount: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    placeholder="What was purchased?"
                    value={newTransaction.description}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, description: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleAddTransaction} className="w-full">
                  Save Transaction
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={() => loadFinancialSummary()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: "7 Days", value: "7days" },
          { label: "30 Days", value: "30days" },
          { label: "90 Days", value: "90days" },
          { label: "YTD", value: "ytd" },
        ].map((btn) => (
          <Button
            key={btn.value}
            variant={timeframe === btn.value ? "default" : "outline"}
            size="sm"
            onClick={() => updateTimeframe(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${Number(summary.totalRevenue || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${Number(summary.averageTransactionValue || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per sale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tax Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${Number(summary.totalTax || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">GST/VAT</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inventory Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              ${Number(summary.equipmentInventoryValue || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current value</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Summary & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Daily Revenue Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(summary.dailyRevenue || [])
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((day, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                    <div>
                      <p className="font-medium">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-gray-500">{day.count} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${Number(day.amount || 0).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">
                        Avg: ${Number((Number(day.amount || 0) / (day.count || 1))).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary.paymentMethods || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([method, amount]) => {
                  const percentage = Number(((Number(amount || 0) / (Number(summary.totalRevenue || 1))) * 100)).toFixed(1);
                  return (
                    <div key={method} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize font-medium">
                          {method.replace(/_/g, " ")}
                        </span>
                        <Badge variant="outline">{percentage}%</Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        ${Number(amount).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Equipment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Selling Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-semibold">Equipment</th>
                  <th className="text-right py-2 px-3 font-semibold">Qty</th>
                  <th className="text-right py-2 px-3 font-semibold">Revenue</th>
                  <th className="text-right py-2 px-3 font-semibold">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {(summary.topEquipment || [])
                  .slice(0, 8)
                  .map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium">{item.name}</td>
                      <td className="text-right py-3 px-3">{item.quantity}</td>
                      <td className="text-right py-3 px-3 font-semibold">
                        ${Number(item.revenue || 0).toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-3">
                        {Number(((Number(item.revenue || 0) / (Number(summary.totalRevenue || 1))) * 100)).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {(!summary.topEquipment || summary.topEquipment.length === 0) && (
              <div className="text-center py-8 text-gray-500">No sales data</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export & Actions */}
      <div className="flex gap-3 justify-end">
        <Button onClick={() => handleExport("csv")} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}
