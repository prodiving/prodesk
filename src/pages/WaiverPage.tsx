import { useState, useEffect, useRef } from "react";
import { FileText, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/integrations/api/client";
import SignaturePad, { SignaturePadHandle } from "@/components/SignaturePad";

export default function WaiverPage() {
  const [waivers, setWaivers] = useState<any[]>([]);
  const [divers, setDivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWaiver, setSelectedWaiver] = useState<any | null>(null);
  const [signingMode, setSigningMode] = useState(false);
  const sigRef = useRef<SignaturePadHandle | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [w, d] = await Promise.all([
        apiClient.waivers.list(),
        apiClient.divers.list(),
      ]);
      setWaivers(w);
      setDivers(d);
    } catch (err) {
      console.error('Failed to load waivers', err);
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSignWaiver = async (diverId: string) => {
    if (!sigRef.current) {
      toast({ title: "Error", description: "Signature pad not ready", variant: "destructive" });
      return;
    }

    const signature = sigRef.current.toDataURL();
    if (!signature || signature.length < 100) {
      toast({ title: "Error", description: "Please provide a signature", variant: "destructive" });
      return;
    }

    try {
      await apiClient.waivers.create({
        diver_id: diverId,
        signature_data: signature,
        notes: `Waiver signed digitally on ${new Date().toLocaleDateString()}`,
      });

      toast({ title: "Success", description: "Waiver signed successfully" });
      
      // Clear form and close dialog
      setTimeout(() => {
        setSigningMode(false);
        setSelectedWaiver(null);
        if (sigRef.current) sigRef.current.clear();
        load();
      }, 500);
    } catch (err) {
      console.error('Waiver signing error:', err);
      toast({ title: "Error", description: String(err), variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'bg-success/20 text-success border-success/30';
      case 'pending':
        return 'bg-warning/20 text-warning border-warning/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const pendingWaivers = waivers.filter(w => w.status === 'pending');
  const signedWaivers = waivers.filter(w => w.status === 'signed');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading waivers...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Digital Waivers</h1>
        <p className="page-description">Manage digital waivers and signatures for divers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Waivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{waivers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Signed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{signedWaivers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{pendingWaivers.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Waivers */}
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Pending Waivers ({pendingWaivers.length})
          </h3>
          <div className="space-y-3">
            {pendingWaivers.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">All waivers signed!</div>
            ) : (
              pendingWaivers.map((w: any) => (
                <div key={w.id || w.diver_id} className="p-3 border rounded hover:bg-muted/50 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium">{w.diver_name}</div>
                      <div className="text-sm text-muted-foreground">{w.diver_email}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Created: {new Date(w.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedWaiver(w);
                        setSigningMode(true);
                      }}
                    >
                      Sign Now
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Signed Waivers */}
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Signed Waivers ({signedWaivers.length})
          </h3>
          <div className="space-y-3">
            {signedWaivers.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">No signed waivers yet</div>
            ) : (
              signedWaivers.map((w: any) => (
                <div key={w.id} className="p-3 border rounded border-success/30 bg-success/5 hover:bg-success/10 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium">{w.diver_name}</div>
                      <div className="text-sm text-muted-foreground">{w.diver_email}</div>
                      <div className="text-xs text-success mt-1">
                        Signed: {new Date(w.signed_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="outline" className="border-success/30 text-success">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Signed
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Signature Dialog */}
      <Dialog open={signingMode} onOpenChange={(open) => {
        if (!open) {
          setSigningMode(false);
          setSelectedWaiver(null);
          if (sigRef.current) sigRef.current.clear();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedWaiver ? `Sign Waiver - ${selectedWaiver.diver_name}` : 'Sign Waiver'}</DialogTitle>
          </DialogHeader>
          {selectedWaiver && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Please review and sign the waiver below. By signing, you acknowledge and accept all terms and conditions.
                </p>
                <div className="p-4 border rounded bg-muted/20 text-sm max-h-48 overflow-y-auto">
                  <h4 className="font-semibold mb-2">Diving Waiver of Liability</h4>
                  <p className="mb-2">I acknowledge that diving is a potentially dangerous activity and that I participate at my own risk. I assume full responsibility for any injuries or death that may occur during my participation.</p>
                  <p className="mb-2">I certify that I am in good physical health and have not withheld any medical information that might affect my ability to participate safely in diving activities.</p>
                  <p>I hereby release the dive operation, instructors, and all related parties from any liability for injuries or death resulting from diving activities.</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Signature</label>
                <SignaturePad ref={sigRef} />
                <div className="mt-2 space-x-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    if (sigRef.current) sigRef.current.clear();
                  }}>
                    Clear
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setSigningMode(false);
                  setSelectedWaiver(null);
                  if (sigRef.current) sigRef.current.clear();
                }}>Cancel</Button>
                <Button onClick={() => handleSignWaiver(selectedWaiver.diver_id)}>Sign Waiver</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
