import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { problemReports } from '@/hooks/useMaintenance';

interface ProblemReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: any;
  divers: any[];
  onSuccess: () => void;
}

export function ProblemReportModal({
  open,
  onOpenChange,
  equipment,
  divers,
  onSuccess,
}: ProblemReportModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [reportedBy, setReportedBy] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast({ title: 'Error', description: 'Problem description required', variant: 'destructive' });
      return;
    }
    if (!reportedBy) {
      toast({ title: 'Error', description: 'Please select who is reporting', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await problemReports.create({
        equipment_id: equipment.id,
        reported_by: reportedBy,
        problem_description: description,
        severity,
      });

      toast({ title: 'Success', description: 'Problem reported successfully' });
      setDescription('');
      setSeverity('medium');
      setReportedBy('');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Report Problem — {equipment?.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reportedBy">Who is Reporting? *</Label>
            <Select value={reportedBy} onValueChange={setReportedBy}>
              <SelectTrigger id="reportedBy">
                <SelectValue placeholder="Select person" />
              </SelectTrigger>
              <SelectContent>
                {divers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Problem Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the problem you encountered..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-24"
            />
          </div>

          <div>
            <Label htmlFor="severity">Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger id="severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Report Problem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
