import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, ShoppingCart, DollarSign, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { equipment, transactions, payments, pos } from "@/hooks/usePOS";
import type { Equipment, Transaction, TransactionItem, Payment } from "@/hooks/usePOS";

export default function POSPage() {
  const { toast } = useToast();

  // State for mode selection
  const [mode, setMode] = useState<"buy" | "rent">("buy");

  // State for equipment inventory
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [equipmentForm, setEquipmentForm] = useState<Partial<Equipment>>({});
  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(null);

  // State for cart/transaction
  const [cart, setCart] = useState<Array<{ equipment: Equipment; quantity: number; unitPrice: number; transactionType: "buy" | "rent"; rentalDays: number }>>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedDiverId, setSelectedDiverId] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");

  // State for transactions and payments
  const [transactions_, setTransactions_] = useState<Transaction[]>([]);
  const [payments_, setPayments_] = useState<Payment[]>([]);
  const [posSummary, setPosSummary] = useState<any>(null);

  // State for payment method
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Load initial data
  useEffect(() => {
    loadEquipment();
    loadTransactions();
    loadPayments();
    loadSummary();
  }, []);

  const loadEquipment = async () => {
    try {
      const { data } = await equipment.list();
      setEquipmentList(data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load equipment", variant: "destructive" });
    }
  };

  const loadTransactions = async () => {
    try {
      const { data } = await transactions.list();
      setTransactions_(data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load transactions", variant: "destructive" });
    }
  };

  const loadPayments = async () => {
    try {
      const { data } = await payments.list();
      setPayments_(data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load payments", variant: "destructive" });
    }
  };

  const loadSummary = async () => {
    try {
      const { data } = await pos.getSummary();
      setPosSummary(data);
    } catch (err) {
      console.error("Failed to load summary:", err);
    }
  };

  // Equipment management
  const handleSaveEquipment = async () => {
    try {
      if (editingEquipmentId) {
        await equipment.update(editingEquipmentId, equipmentForm);
        toast({ title: "Success", description: "Equipment updated" });
      } else {
        await equipment.create(equipmentForm);
        toast({ title: "Success", description: "Equipment added" });
      }
      setEquipmentForm({});
      setEditingEquipmentId(null);
      setEquipmentOpen(false);
      loadEquipment();
    } catch (err) {
      toast({ title: "Error", description: "Failed to save equipment", variant: "destructive" });
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm("Delete this equipment?")) return;
    try {
      await equipment.delete(id);
      toast({ title: "Success", description: "Equipment deleted" });
      loadEquipment();
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete equipment", variant: "destructive" });
    }
  };

  const handleEditEquipment = (item: Equipment) => {
    setEquipmentForm(item);
    setEditingEquipmentId(item.id);
    setEquipmentOpen(true);
  };

  // Cart management
  const addToCart = (item: Equipment) => {
    const isRent = mode === "rent";
    const price = isRent ? item.rent_price_per_day : item.price;
    
    if ((isRent && !item.can_rent) || (!isRent && !item.can_buy)) {
      toast({ title: "Error", description: `This item cannot be ${isRent ? "rented" : "purchased"}`, variant: "destructive" });
      return;
    }

    const existing = cart.find(c => c.equipment.id === item.id && c.transactionType === mode);
    if (existing) {
      setCart(cart.map(c => c.equipment.id === item.id && c.transactionType === mode ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { equipment: item, quantity: 1, unitPrice: price, transactionType: mode, rentalDays: 1 }]);
    }
    toast({ title: "Added to cart", description: `${item.name} (${isRent ? "Rent" : "Buy"}) added` });
  };

  const removeFromCart = (equipmentId: string, transactionType: "buy" | "rent") => {
    setCart(cart.filter(c => !(c.equipment.id === equipmentId && c.transactionType === transactionType)));
  };

  const updateCartQuantity = (equipmentId: string, transactionType: "buy" | "rent", quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(equipmentId, transactionType);
    } else {
      setCart(cart.map(c => c.equipment.id === equipmentId && c.transactionType === transactionType ? { ...c, quantity } : c));
    }
  };

  const updateCartRentalDays = (equipmentId: string, days: number) => {
    setCart(cart.map(c => c.equipment.id === equipmentId && c.transactionType === "rent" ? { ...c, rentalDays: days } : c));
  };

  const calculateCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => {
      const itemPrice = item.transactionType === "rent" 
        ? item.quantity * item.unitPrice * item.rentalDays 
        : item.quantity * item.unitPrice;
      return sum + itemPrice;
    }, 0);
    return { subtotal, tax: tax || 0, discount: discount || 0, total: subtotal + (tax || 0) - (discount || 0) };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ title: "Error", description: "Cart is empty", variant: "destructive" });
      return;
    }

    try {
      const cartTotal = calculateCartTotal();
      const transactionData: any = {
        items: cart.map(item => ({
          equipment_id: item.equipment.id,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          transaction_type: item.transactionType,
          rental_days: item.transactionType === "rent" ? item.rentalDays : 0,
        })),
        tax: tax || 0,
        discount: discount || 0,
        notes: notes || null,
      };

      if (selectedDiverId) transactionData.diver_id = selectedDiverId;
      if (selectedBookingId) transactionData.booking_id = selectedBookingId;

      const { data: transaction } = await transactions.create(transactionData);

      // Create payment
      if (transaction) {
        await payments.create({
          transaction_id: transaction.id,
          amount: cartTotal.total,
          payment_method: paymentMethod,
        });

        toast({
          title: "Success",
          description: `Transaction ${transaction.transaction_number} completed. Total: $${cartTotal.total.toFixed(2)}`,
        });

        // Reset cart
        setCart([]);
        setSelectedDiverId("");
        setSelectedBookingId("");
        setTax(0);
        setDiscount(0);
        setNotes("");
        setCartOpen(false);

        loadEquipment();
        loadTransactions();
        loadPayments();
        loadSummary();
      }
    } catch (err) {
      toast({ title: "Error", description: "Checkout failed", variant: "destructive" });
    }
  };

  const cartTotal = calculateCartTotal();

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Point of Sale</h1>
          <p className="page-description">Manage equipment inventory and process sales</p>
        </div>
        <div className="flex gap-2">
          {/* Mode Toggle */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <Button 
              variant={mode === "buy" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("buy")}
              className="whitespace-nowrap"
            >
              Buy Equipment
            </Button>
            <Button 
              variant={mode === "rent" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("rent")}
              className="whitespace-nowrap"
            >
              Rent Equipment
            </Button>
          </div>

          <Dialog open={cartOpen} onOpenChange={setCartOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => setCartOpen(true)}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({cart.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Shopping Cart & Checkout</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {cart.map(item => (
                        <div key={`${item.equipment.id}-${item.transactionType}`} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                          <div className="flex-1">
                            <p className="font-medium">{item.equipment.name}</p>
                            <p className="text-sm text-muted-foreground">${item.unitPrice.toFixed(2)} {item.transactionType === "rent" ? "per day" : "each"}</p>
                            {item.transactionType === "rent" && (
                              <div className="mt-2 flex items-center gap-2">
                                <Label className="text-xs">Days:</Label>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  value={item.rentalDays}
                                  onChange={(e) => updateCartRentalDays(item.equipment.id, parseInt(e.target.value) || 1)}
                                  className="w-16 h-8"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateCartQuantity(item.equipment.id, item.transactionType, parseInt(e.target.value) || 1)}
                              className="w-16"
                            />
                            <span className="w-24 text-right font-medium">
                              {item.transactionType === "rent" 
                                ? `$${(item.quantity * item.unitPrice * item.rentalDays).toFixed(2)}`
                                : `$${(item.quantity * item.unitPrice).toFixed(2)}`
                              }
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromCart(item.equipment.id, item.transactionType)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <div>
                        <Label>Diver (Optional)</Label>
                        <Input placeholder="Diver name or ID" value={selectedDiverId} onChange={(e) => setSelectedDiverId(e.target.value)} />
                      </div>
                      <div>
                        <Label>Booking (Optional)</Label>
                        <Input placeholder="Booking ID" value={selectedBookingId} onChange={(e) => setSelectedBookingId(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label>Subtotal</Label>
                          <p className="text-lg font-mono font-bold">${cartTotal.subtotal.toFixed(2)}</p>
                        </div>
                        <div>
                          <Label>Tax</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={tax}
                            onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label>Discount</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={discount}
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="debit_card">Debit Card</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Input placeholder="Order notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded flex items-center justify-between">
                        <span className="font-semibold">Total:</span>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">${cartTotal.total.toFixed(2)}</span>
                      </div>
                      <div className="flex gap-2 justify-end pt-4">
                        <Button variant="outline" onClick={() => setCartOpen(false)}>Cancel</Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={handleCheckout}>
                          <DollarSign className="h-4 w-4 mr-2" />
                          Complete Sale
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={equipmentOpen} onOpenChange={setEquipmentOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEquipmentForm({}); setEditingEquipmentId(null); setEquipmentOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEquipmentId ? "Edit Equipment" : "Add Equipment"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={equipmentForm.name || ""}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                      placeholder="Equipment name"
                    />
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Input
                      value={equipmentForm.category || ""}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, category: e.target.value })}
                      placeholder="Category"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>SKU</Label>
                    <Input
                      value={equipmentForm.sku || ""}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, sku: e.target.value })}
                      placeholder="SKU"
                    />
                  </div>
                  <div>
                    <Label>Price (Buy)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={equipmentForm.price || 0}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, price: parseFloat(e.target.value) })}
                      placeholder="Price"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Can Buy?</Label>
                    <Select value={equipmentForm.can_buy ? "yes" : "no"} onValueChange={(val) => setEquipmentForm({ ...equipmentForm, can_buy: val === "yes" })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Can Rent?</Label>
                    <Select value={equipmentForm.can_rent ? "yes" : "no"} onValueChange={(val) => setEquipmentForm({ ...equipmentForm, can_rent: val === "yes" })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Rent Price/Day</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={equipmentForm.rent_price_per_day || 0}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, rent_price_per_day: parseFloat(e.target.value) })}
                      placeholder="$/day"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Stock Quantity</Label>
                    <Input
                      type="number"
                      value={equipmentForm.quantity_in_stock || 0}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, quantity_in_stock: parseInt(e.target.value) })}
                      placeholder="Quantity"
                    />
                  </div>
                  <div>
                    <Label>Rental Stock</Label>
                    <Input
                      type="number"
                      value={equipmentForm.quantity_available_for_rent || 0}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, quantity_available_for_rent: parseInt(e.target.value) })}
                      placeholder="Available for rent"
                    />
                  </div>
                </div>
                <div>
                  <Label>Reorder Level</Label>
                  <Input
                    type="number"
                    value={equipmentForm.reorder_level || 5}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, reorder_level: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={equipmentForm.description || ""}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, description: e.target.value })}
                    placeholder="Description"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEquipmentOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveEquipment}>{editingEquipmentId ? "Update" : "Add"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* POS Summary */}
      {posSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${(posSummary.today.total_sales || 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">{posSummary.today.transaction_count} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Amount Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${(posSummary.today.total_paid || 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">{posSummary.today.payment_count} payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{equipmentList.length}</div>
              <p className="text-xs text-muted-foreground mt-1">in inventory</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{posSummary.low_stock_items?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">items to reorder</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Low Stock Alert */}
      {posSummary?.low_stock_items?.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            {posSummary.low_stock_items.map((item: Equipment) => (
              <div key={item.id} className="text-sm">
                {item.name}: {item.quantity_in_stock} units (reorder level: {item.reorder_level})
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Equipment/Inventory List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="page-header mb-4 flex items-center justify-between">
            <div>
              <h2 className="page-title">Equipment {mode === "buy" ? "For Sale" : "For Rent"}</h2>
            </div>
            <Badge variant={mode === "buy" ? "default" : "secondary"} className="text-sm">
              {mode === "buy" ? "Purchase Mode" : "Rental Mode"}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {equipmentList
              .filter(item => mode === "buy" ? item.can_buy : item.can_rent)
              .map(item => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.category} {item.sku && `• ${item.sku}`}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        ${mode === "buy" ? item.price.toFixed(2) : item.rent_price_per_day.toFixed(2)}
                        {mode === "rent" && <span className="text-xs font-normal text-muted-foreground">/day</span>}
                      </span>
                      <Badge variant={mode === "buy" 
                        ? (item.quantity_in_stock > item.reorder_level ? "secondary" : "destructive")
                        : (item.quantity_available_for_rent > 0 ? "secondary" : "destructive")
                      }>
                        {mode === "buy" ? `${item.quantity_in_stock} in stock` : `${item.quantity_available_for_rent} available`}
                      </Badge>
                    </div>
                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => addToCart(item)}
                        disabled={mode === "buy" ? item.quantity_in_stock === 0 : item.quantity_available_for_rent === 0}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditEquipment(item)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEquipment(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="page-header mb-4">
            <h2 className="page-title text-lg">Recent Transactions</h2>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {transactions_.slice(0, 10).map(txn => (
              <Card key={txn.id} className="p-3">
                <div className="text-sm">
                  <p className="font-mono font-semibold text-xs text-muted-foreground">{txn.transaction_number}</p>
                  {txn.diver_name && <p className="text-sm font-medium">{txn.diver_name}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(txn.created_at).toLocaleString()}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="font-mono text-lg font-bold">${txn.total.toFixed(2)}</span>
                    <Badge variant="outline">{txn.status}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
