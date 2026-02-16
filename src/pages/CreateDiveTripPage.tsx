import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Settings } from 'lucide-react';
import { apiClient } from '@/integrations/api/client';

interface DiveSite {
  id: string;
  name: string;
}

interface Boat {
  id: string;
  name: string;
}

interface Instructor {
  id: string;
  name: string;
}

export default function CreateDiveTripPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [diveSites, setDiveSites] = useState<DiveSite[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    tripType: 'regular',
    departureTime: new Date().toISOString().slice(0, 16),
    departureLocation: '',
    diveSites: '',
    boat: '',
    captain: '',
    boatStaff: '',
    products: '',
    numberOfDives: '1',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sitesRes, boatsRes, instructorsRes] = await Promise.all([
          apiClient.diveSites.list().catch(() => []),
          apiClient.boats.list().catch(() => []),
          apiClient.instructors.list().catch(() => []),
        ]);
        setDiveSites(Array.isArray(sitesRes) ? sitesRes : []);
        setBoats(Array.isArray(boatsRes) ? boatsRes : []);
        setInstructors(Array.isArray(instructorsRes) ? instructorsRes : []);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.departureTime) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          type: form.tripType,
          start_at: form.departureTime,
          dive_site_id: form.diveSites || null,
          boat_id: form.boat || null,
          captain_id: form.captain || null,
          number_of_dives: parseInt(form.numberOfDives),
          boat_staff: form.boatStaff || null,
          products: form.products || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to create trip');

      toast({
        title: 'Success',
        description: 'Dive trip created successfully',
      });

      navigate('/calendar');
    } catch (err) {
      console.error('Failed to save:', err);
      toast({
        title: 'Error',
        description: 'Failed to create dive trip',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Create Dive Trip</h1>
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
              {/* Row 1: Name & Trip Type */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g., Tulamben Sunrise Dive"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold mb-2 block">Trip Type</Label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="tripType"
                        value="regular"
                        checked={form.tripType === 'regular'}
                        onChange={(e) => setForm({ ...form, tripType: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Regular</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="tripType"
                        value="multi-day"
                        checked={form.tripType === 'multi-day'}
                        onChange={(e) => setForm({ ...form, tripType: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Multi Day</span>
                    </label>
                  </div>
                  <div className="mt-3 bg-cyan-100 text-cyan-800 p-3 rounded text-sm">
                    Use multi day trips for liveaboards or other trip activities that have the same attendees.
                  </div>
                </div>
              </div>

              {/* Row 2: Departure Time & Location */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Departure Time <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="datetime-local"
                      value={form.departureTime}
                      onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                      className="h-12 flex-1"
                    />
                    <Button className="bg-blue-600 hover:bg-blue-700 px-8">
                      Bulk Add
                    </Button>
                  </div>
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

              {/* Row 3: Dive Sites & Boat */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <Label className="text-base font-semibold mb-2 flex items-center gap-2">
                    Dive Sites
                    <Settings className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                  </Label>
                  <Input
                    placeholder="Search or select dive sites"
                    value={form.diveSites}
                    onChange={(e) => setForm({ ...form, diveSites: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold mb-2 flex items-center gap-2">
                    Boat
                    <Settings className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                  </Label>
                  <Select value={form.boat} onValueChange={(value) => setForm({ ...form, boat: value })}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="No Boat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Boat</SelectItem>
                      {boats.map((boat: Boat) => (
                        <SelectItem key={boat.id} value={boat.id}>
                          {boat.name || 'Unnamed Boat'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 4: Captain & Boat Staff */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <Label className="text-base font-semibold mb-2 block">Captain</Label>
                  <Select value={form.captain} onValueChange={(value) => setForm({ ...form, captain: value })}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Please select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Please select</SelectItem>
                      {instructors.map((instructor: Instructor) => (
                        <SelectItem key={instructor.id} value={instructor.id}>
                          {instructor.name || 'Unnamed Instructor'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-2 block">Boat Staff</Label>
                  <Input
                    placeholder="e.g., Deck hand, Safety Officer"
                    value={form.boatStaff}
                    onChange={(e) => setForm({ ...form, boatStaff: e.target.value })}
                    className="h-12"
                  />
                </div>
              </div>

              {/* Row 5: Products & Number of Dives */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Products - Billed to everyone on this trip
                  </Label>
                  <textarea
                    placeholder="e.g., 1 Day Fundive, PADI Open Water Diver, etc."
                    value={form.products}
                    onChange={(e) => setForm({ ...form, products: e.target.value })}
                    className="w-full h-24 px-4 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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

              {/* Save Button */}
              <div className="pt-4">
                <Button
                  onClick={handleSave}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 h-auto"
                >
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
