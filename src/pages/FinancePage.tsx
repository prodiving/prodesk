import { useState, useEffect } from "react";
import { 
  DollarSign, TrendingUp, TrendingDown, DollarSignIcon, 
  CreditCard, Banknote, RefreshCw, Download, Filter,
  BarChart3, PieChart as PieChartIcon, Calendar, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ExportButtons from "@/components/ExportButtons";

interface FinancialSummary {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  totalTax: number;
  totalDiscount: number;
  paymentMethods: {
    [key: string]: number;
  };
  paymentMethodCounts: {
    [key: string]: number;
  };
  dailyRevenue: Array<{ date: string; amount: number; count: number }>;
  monthlyRevenue: Array<{ month: string; amount: number; count: number }>;
  topEquipment: Array<{ name: string; quantity: number; revenue: number }>;
  equipmentInventoryValue: number;
  equipmentCost: number;
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

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
      case "all":
        startDate = new Date("2020-01-01");
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
      const res = await fetch(`/api/finance/summary?${params}`);
      if (!res.ok) throw new Error("Failed to load financial summary");
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format,
      });
      const res = await fetch(`/api/finance/export?${params}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financial-report-${dateRange.startDate}-${dateRange.endDate}.${format === "pdf" ? "pdf" : format === "excel" ? "xlsx" : "csv"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: `Report exported as ${format.toUpperCase()}`,
      });
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
        <p>No financial data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Finance Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {new Date(dateRange.startDate).toLocaleDateString()} -{" "}
            {new Date(dateRange.endDate).toLocaleDateString()}
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Custom Date
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Date Range</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <Button onClick={() => loadFinancialSummary()} className="w-full">
                  Apply Filter
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Select value={timeframe} onValueChange={updateTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => loadFinancialSummary()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Timeframe Quick Select Buttons */}
      <div className="flex gap-2">
        {[
          { label: "7D", value: "7days" },
          { label: "30D", value: "30days" },
          { label: "90D", value: "90days" },
          { label: "YTD", value: "ytd" },
          { label: "All", value: "all" },
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${summary.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {summary.totalTransactions} transactions
            </p>
            <div className="flex items-center mt-2 text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span className="text-xs">+12% from previous period</span>
            </div>
          </CardContent>
        </Card>

        {/* Average Transaction */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${summary.averageTransactionValue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Per sale
            </p>
            <div className="mt-4 bg-blue-50 rounded p-2">
              <p className="text-xs text-blue-700">
                Total Transactions: {summary.totalTransactions}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tax Collected */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tax Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${summary.totalTax.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((summary.totalTax / summary.totalRevenue) * 100 || 0).toFixed(1)}% of revenue
            </p>
            <Badge className="mt-2" variant="outline">GST/VAT</Badge>
          </CardContent>
        </Card>

        {/* Discounts Given */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Discounts Given
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              ${summary.totalDiscount.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {((summary.totalDiscount / summary.totalRevenue) * 100 || 0).toFixed(1)}% of revenue
            </p>
            <div className="mt-4 bg-orange-50 rounded p-2">
              <p className="text-xs text-orange-700">
                Cost to business
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods & Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary.paymentMethods || {}).map(([method, amount]) => {
                const count = summary.paymentMethodCounts?.[method] || 0;
                const percentage = (
                  (amount / summary.totalRevenue) *
                  100
                ).toFixed(1);
                return (
                  <div
                    key={method}
                    className="cursor-pointer hover:bg-gray-50 p-2 rounded transition"
                    onClick={() =>
                      setSelectedPaymentMethod(
                        selectedPaymentMethod === method ? null : method
                      )
                    }
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {method === "cash" && <Banknote className="w-4 h-4" />}
                        {method === "credit_card" && <CreditCard className="w-4 h-4" />}
                        {method === "debit_card" && <CreditCard className="w-4 h-4" />}
                        {method === "bank_transfer" && <TrendingDown className="w-4 h-4" />}
                        <span className="font-medium capitalize">{method.replace(/_/g, " ")}</span>
                      </div>
                      <Badge variant="outline">{percentage}%</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      ${Number(amount).toFixed(2)} ({count} transactions)
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Valuation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Inventory Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Current Inventory Value</p>
                <p className="text-3xl font-bold text-green-600">
                  ${summary.equipmentInventoryValue.toFixed(2)}
                </p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">Total Equipment Cost</p>
                <p className="text-2xl font-bold">
                  ${summary.equipmentCost.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-50 rounded p-3 border border-green-200">
                <p className="text-sm text-green-700">
                  {summary.equipmentInventoryValue > 0
                    ? `Your inventory is valued higher than cost (Growth)`
                    : `Inventory value tracking`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Equipment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Top Selling Equipment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Equipment</th>
                  <th className="text-right py-2 px-2">Quantity Sold</th>
                  <th className="text-right py-2 px-2">Revenue</th>
                  <th className="text-right py-2 px-2">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {(summary.topEquipment || []).map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{item.name}</td>
                    <td className="text-right py-3 px-2">{item.quantity}</td>
                    <td className="text-right py-3 px-2 font-semibold">
                      ${item.revenue.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-2">
                      {((item.revenue / summary.totalRevenue) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!summary.topEquipment || summary.topEquipment.length === 0) && (
              <div className="text-center py-6 text-gray-500">
                No sales data available for this period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-right py-2 px-2">Revenue</th>
                  <th className="text-right py-2 px-2">Transactions</th>
                  <th className="text-right py-2 px-2">Avg Value</th>
                </tr>
              </thead>
              <tbody>
                {(summary.dailyRevenue || [])
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .slice(0, 10)
                  .map((day, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">
                        {new Date(day.date).toLocaleDateString()}
                      </td>
                      <td className="text-right py-3 px-2 font-semibold">
                        ${day.amount.toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-2">{day.count}</td>
                      <td className="text-right py-3 px-2">
                        ${(day.amount / day.count).toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2" />
            Export Financial Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            Export your financial data in multiple formats for accounting and analysis
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => handleExport("pdf")}
              className="bg-red-600 hover:bg-red-700"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF Report
            </Button>
            <Button
              onClick={() => handleExport("excel")}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Excel Report
            </Button>
            <Button
              onClick={() => handleExport("csv")}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              CSV Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
