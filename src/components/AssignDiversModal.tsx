import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTripAssignments } from '@/hooks/useTripAssignments';

const isBrowser = typeof window !== 'undefined';
const isDevelopment = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = isDevelopment ? (import.meta.env.VITE_API_URL ?? 'http://localhost:3000') : '';

interface AssignDiversModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  tripName: string;
}

export function AssignDiversModal({ open, onOpenChange, tripId, tripName }: AssignDiversModalProps) {
  const { toast } = useToast();
  const { assignments, assignDiver, unassignDiver } = useTripAssignments(tripId);
  const [divers, setDivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiverIds, setSelectedDiverIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    
    const loadDivers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/divers`, {
          headers: { 'x-user-id': 'user-1' },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setDivers(data);
          
          // Pre-select already assigned divers
          const assigned = new Set(assignments.map(a => a.diver_id));
          setSelectedDiverIds(assigned);
        }
      } catch (err) {
        console.error('Failed to load divers:', err);
        toast({ title: 'Error', description: 'Failed to load divers', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    loadDivers();
  }, [open, assignments]);

  const handleDiverToggle = async (diverId: string, isSelected: boolean) => {
    try {
      if (isSelected) {
        await assignDiver(diverId);
        toast({ title: 'Success', description: 'Diver assigned to trip' });
      } else {
        await unassignDiver(diverId);
        toast({ title: 'Success', description: 'Diver unassigned from trip' });
      }
      
      const newSelected = new Set(selectedDiverIds);
      if (isSelected) {
        newSelected.add(diverId);
      } else {
        newSelected.delete(diverId);
      }
      setSelectedDiverIds(newSelected);
    } catch (err) {
      toast({ 
        title: 'Error', 
        description: isSelected ? 'Failed to assign diver' : 'Failed to unassign diver',
        variant: 'destructive' 
      });
    }
  };

  const assignedCount = selectedDiverIds.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Divers to Trip</DialogTitle>
          <DialogDescription>
            <div className="mt-2">
              <div className="font-semibold text-foreground">{tripName}</div>
              <div className="text-sm mt-1">
                {assignedCount} diver{assignedCount !== 1 ? 's' : ''} assigned
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading divers...</div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {divers.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No divers available</div>
            ) : (
              divers.map((diver) => {
                const isAssigned = selectedDiverIds.has(diver.id);
                return (
                  <div key={diver.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        checked={isAssigned}
                        onCheckedChange={(checked) => handleDiverToggle(diver.id, checked as boolean)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{diver.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {diver.certification_level || 'No certification'}
                        </div>
                      </div>
                    </div>
                    {isAssigned && <Badge variant="secondary" className="ml-2">Assigned</Badge>}
                  </div>
                );
              })
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
