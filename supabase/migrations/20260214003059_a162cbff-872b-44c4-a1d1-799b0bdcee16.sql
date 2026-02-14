
-- Profiles table for authenticated users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Instructors
CREATE TABLE public.instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  certification TEXT,
  specialties TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read instructors" ON public.instructors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert instructors" ON public.instructors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update instructors" ON public.instructors FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete instructors" ON public.instructors FOR DELETE TO authenticated USING (true);

-- Boats
CREATE TABLE public.boats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 10,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.boats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read boats" ON public.boats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert boats" ON public.boats FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update boats" ON public.boats FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete boats" ON public.boats FOR DELETE TO authenticated USING (true);

-- Dive sites
CREATE TABLE public.dive_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  max_depth NUMERIC NOT NULL DEFAULT 0,
  difficulty TEXT NOT NULL DEFAULT 'easy',
  description TEXT,
  emergency_contacts TEXT,
  nearest_hospital TEXT,
  dan_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dive_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read dive_sites" ON public.dive_sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert dive_sites" ON public.dive_sites FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update dive_sites" ON public.dive_sites FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete dive_sites" ON public.dive_sites FOR DELETE TO authenticated USING (true);

-- Divers
CREATE TABLE public.divers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  certification TEXT,
  skill_level TEXT NOT NULL DEFAULT 'beginner',
  total_dives INTEGER NOT NULL DEFAULT 0,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_conditions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.divers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read divers" ON public.divers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert divers" ON public.divers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update divers" ON public.divers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete divers" ON public.divers FOR DELETE TO authenticated USING (true);

-- Dive logs with time in/out
CREATE TABLE public.dive_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  site_id UUID REFERENCES public.dive_sites(id),
  diver_id UUID REFERENCES public.divers(id),
  depth NUMERIC NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0,
  time_in TIME,
  time_out TIME,
  boat_id UUID REFERENCES public.boats(id),
  instructor_id UUID REFERENCES public.instructors(id),
  notes TEXT,
  safety_checklist_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dive_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read dive_logs" ON public.dive_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert dive_logs" ON public.dive_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update dive_logs" ON public.dive_logs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete dive_logs" ON public.dive_logs FOR DELETE TO authenticated USING (true);

-- Courses
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES public.instructors(id),
  boat_id UUID REFERENCES public.boats(id),
  start_date DATE,
  end_date DATE,
  max_students INTEGER NOT NULL DEFAULT 6,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update courses" ON public.courses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete courses" ON public.courses FOR DELETE TO authenticated USING (true);

-- Accommodation options
CREATE TYPE public.accommodation_tier AS ENUM ('free_with_course', 'standard', 'deluxe');

CREATE TABLE public.accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier accommodation_tier NOT NULL DEFAULT 'free_with_course',
  price_per_night NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read accommodations" ON public.accommodations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert accommodations" ON public.accommodations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update accommodations" ON public.accommodations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete accommodations" ON public.accommodations FOR DELETE TO authenticated USING (true);

-- Bookings (course enrollment + accommodation + invoice)
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diver_id UUID REFERENCES public.divers(id) NOT NULL,
  course_id UUID REFERENCES public.courses(id),
  accommodation_id UUID REFERENCES public.accommodations(id),
  check_in DATE,
  check_out DATE,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  invoice_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read bookings" ON public.bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update bookings" ON public.bookings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete bookings" ON public.bookings FOR DELETE TO authenticated USING (true);

-- Emergency procedures
CREATE TABLE public.emergency_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  procedure_type TEXT NOT NULL DEFAULT 'general',
  steps TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.emergency_procedures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read emergency_procedures" ON public.emergency_procedures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert emergency_procedures" ON public.emergency_procedures FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update emergency_procedures" ON public.emergency_procedures FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete emergency_procedures" ON public.emergency_procedures FOR DELETE TO authenticated USING (true);

-- Seed some default emergency procedures
INSERT INTO public.emergency_procedures (title, description, procedure_type, steps) VALUES
('DCS (Decompression Sickness)', 'Procedure for suspected decompression sickness', 'medical', '1. Remove diver from water\n2. Administer 100% oxygen\n3. Keep diver lying down\n4. Call DAN emergency hotline\n5. Transport to nearest recompression chamber'),
('Lost Diver', 'Procedure when a diver is missing', 'search', '1. Note last known position and time\n2. Conduct surface search pattern\n3. Alert coast guard if not found within 5 minutes\n4. Deploy search team\n5. Document all actions taken'),
('Equipment Failure', 'Procedure for equipment malfunction underwater', 'equipment', '1. Signal buddy for air sharing\n2. Begin controlled ascent\n3. Perform safety stop if possible\n4. Report equipment issue on surface\n5. Tag and remove defective equipment');

-- Seed accommodations
INSERT INTO public.accommodations (name, tier, price_per_night, description) VALUES
('Dorm Bunk', 'free_with_course', 0, 'Shared dormitory included free with any course booking'),
('Standard Room', 'standard', 45, 'Private room with en-suite bathroom and fan cooling'),
('Deluxe Suite', 'deluxe', 120, 'Oceanview suite with AC, minibar, private balcony');
