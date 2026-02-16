import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/integrations/api/client';
import { Checkbox } from '@/components/ui/checkbox';

interface DiveSite {
  id: string;
  name: string;
}

interface Boat {
  id: string;
  name: string;
}

export default function CreateSchedulePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [diveSites, setDiveSites] = useState<DiveSite[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    scheduleName: '',
    departureTime: '09:00',
    departureLocation: '',
    boat: 'no-boat',
    numberOfDives: '1',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    daysAhead: '30',
    daysOfWeek: {
      sunday: false,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
    },
    diveSites: '',
    products: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sitesRes, boatsRes] = await Promise.all([
          apiClient.diveSites.list().catch(() => []),
          apiClient.boats.list().catch(() => []),
        ]);
        setDiveSites(Array.isArray(sitesRes) ? sitesRes : []);
        setBoats(Array.isArray(boatsRes) ? boatsRes : []);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSave = async () => {
    if (!form.scheduleName || !form.startDate) {
      toast({
        title: 'Error',
        description: 'Please fill in Schedule Name and Start Date',
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.scheduleName,
          departure_time: form.departureTime,
          departure_location: form.departureLocation,
          boat_id: form.boat === 'no-boat' ? null : form.boat,
          number_of_dives: parseInt(form.numberOfDives),
          start_date: form.startDate,
          end_date: form.endDate,
          days_ahead: parseInt(form.daysAhead),
          days_of_week: form.daysOfWeek,
          dive_sites: form.diveSites || null,
          products: form.products || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to create schedule');

      toast({
        title: 'Success',
        description: 'Schedule created successfully',
      });

      navigate('/calendar');
    } catch (err) {
      console.error('Failed to save:', err);
      toast({
        title: 'Error',
        description: 'Failed to create schedule',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const daysOfWeekLabels = [
    { key: 'sunday', label: 'Sun' },
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Create New Dive Trip Schedule</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/calendar')}>
            Back
          </Button>
          <Button onClick={() => navigate('/calendar')}>
            📅 Trip Schedules
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="p-8">
        <Card>
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Row 1: Schedule Name */}
              <div>
                <Label className="text-base font-semibold mb-2 block">
                  Schedule Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g., Morning Reef Dives"
                  value={form.scheduleName}
                  onChange={(e) => setForm({ ...form, scheduleName: e.target.value })}
                  className="h-12"
                />
              </div>

              {/* Row 2: Departure Time & Location */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <Label className="text-base font-semibold mb-2 block">Departure Time</Label>
                  <Input
                    type="time"
                    value={form.departureTime}
                    onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold mb-2 block">Departure Location</Label>
                  <Input
                    placeholder="Select location"
                    value={form.departureLocation}
                    onChange={(e) => setForm({ ...form, departureLocation: e.target.value })}
                    className="h-12"
                  />
                </div>
              </div>

              {/* Row 3: Boat & Number of Dives */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <Label className="text-base font-semibold mb-2 block">Boat</Label>
                  <Select value={form.boat} onValueChange={(value) => setForm({ ...form, boat: value })}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="No Boat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-boat">No Boat</SelectItem>
                      {boats.map((boat: Boat) => (
                        <SelectItem key={boat.id} value={boat.id}>
                          {boat.name || 'Unnamed Boat'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-2 block">Number of Dives</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.numberOfDives}
                    onChange={(e) => setForm({ ...form, numberOfDives: e.target.value })}
                    className="h-12"
                  />
                </div>
              </div>

              {/* Row 4: Start Date & End Date */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold mb-2 block">End Date</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="h-12"
                  />
                </div>
              </div>

              {/* Row 5: Days Ahead & Days of Week */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <Label className="text-base font-semibold mb-2 block">Days Ahead to Keep Populated</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.daysAhead}
                    onChange={(e) => setForm({ ...form, daysAhead: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold mb-2 block">Days of Week</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {daysOfWeekLabels.map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-center">
                        <label className="flex flex-col items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={form.daysOfWeek[key as keyof typeof form.daysOfWeek]}
                            onCheckedChange={(checked) =>
                              setForm({
                                ...form,
                                daysOfWeek: {
                                  ...form.daysOfWeek,
                                  [key]: checked,
                                },
                              })
                            }
                          />
                          <span className="text-xs font-semibold">{label}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 6: Dive Sites & Products */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <Label className="text-base font-semibold mb-2 block">Dive Sites</Label>
                  <Input
                    placeholder="e.g., Reef, Wreck, Cave"
                    value={form.diveSites}
                    onChange={(e) => setForm({ ...form, diveSites: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold mb-2 block">Products</Label>
                  <Input
                    placeholder="e.g., 1 Day Fundive, PADI Cert"
                    value={form.products}
                    onChange={(e) => setForm({ ...form, products: e.target.value })}
                    className="h-12"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <Button
                  onClick={handleSave}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 h-auto"
                >
                  Create
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
