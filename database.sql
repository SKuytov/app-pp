-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to redefine them
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.facilities;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.machines;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.parts;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.suppliers;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.part_movements;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.machine_assemblies;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.assembly_parts;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.quotations;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Allow individual user read access" ON public.profiles;
DROP POLICY IF EXISTS "Allow all access to admin users" ON public.profiles;
DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON public.facilities;
DROP POLICY IF EXISTS "Allow all access to admin users" ON public.facilities;
DROP POLICY IF EXISTS "Allow all access to admin users" ON public.machines;
DROP POLICY IF EXISTS "Allow facility-based read access" ON public.machines;
DROP POLICY IF EXISTS "Allow full access for admin and head_tech" ON public.parts;
DROP POLICY IF EXISTS "Allow read access for all authenticated users" ON public.parts;
DROP POLICY IF EXISTS "Allow all access to admins and approvers" ON public.orders;
DROP POLICY IF EXISTS "Allow users to view their own facility's orders" ON public.orders;
DROP POLICY IF EXISTS "Allow users to create orders for their own facility" ON public.orders;
DROP POLICY IF EXISTS "Allow all access for admin users" ON public.suppliers;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.suppliers;
-- And for all other tables...

-- Profiles
CREATE POLICY "Allow individual user read access" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow all access to admin users" ON public.profiles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Facilities
CREATE POLICY "Allow read access to all authenticated users" ON public.facilities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all access to admin users" ON public.facilities FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Machines
CREATE POLICY "Allow all access to admin users" ON public.machines FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Allow facility-based read access" ON public.machines FOR SELECT USING (
  public.is_admin() OR 
  public.is_head_tech() OR 
  public.is_technical_director() OR 
  facility_id = public.get_user_facility_id(auth.uid())
);

-- Parts
CREATE POLICY "Allow full access for admin and head_tech" ON public.parts FOR ALL USING (public.is_admin() OR public.is_head_tech()) WITH CHECK (public.is_admin() OR public.is_head_tech());
CREATE POLICY "Allow read access for all authenticated users" ON public.parts FOR SELECT USING (auth.role() = 'authenticated');

-- Orders
CREATE POLICY "Allow all access to admins and approvers" ON public.orders FOR ALL USING (public.is_admin() OR public.is_approver() OR public.is_technical_director()) WITH CHECK (public.is_admin() OR public.is_approver() OR public.is_technical_director());
CREATE POLICY "Allow users to view their own facility's orders" ON public.orders FOR SELECT USING (facility_id = public.get_user_facility_id(auth.uid()));
CREATE POLICY "Allow users to create orders for their own facility" ON public.orders FOR INSERT WITH CHECK (facility_id = public.get_user_facility_id(auth.uid()) AND requested_by_id = auth.uid());

-- Suppliers
CREATE POLICY "Allow all access for admin users" ON public.suppliers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Allow read access for authenticated users" ON public.suppliers FOR SELECT USING (auth.role() = 'authenticated');

-- Part Movements, Assemblies, Quotations (simplified for now)
CREATE POLICY "Enable all access for authenticated users" ON public.part_movements FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.machine_assemblies FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.assembly_parts FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.quotations FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- SEED DATA
-- This script will now clear and re-seed the critical lookup tables.
-- It's designed to be run multiple times without causing errors.

-- Truncate tables to ensure a clean slate
TRUNCATE TABLE public.facilities, public.profiles RESTART IDENTITY CASCADE;
DELETE FROM auth.users WHERE email IN ('akilids@partpulse.com', 'salim@partpulse.com', 'ivan.velikov@partpulse.com', 'ivaylo.iliev@partpulse.com', 'dimitar@partpulse.com');

DO $$
DECLARE
    facility1_id uuid := '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a';
    facility2_id uuid := '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b';
    facility3_id uuid := '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c';
    facility4_id uuid := '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d';
    facility5_id uuid := '5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e';
BEGIN
-- 1. Insert Facilities
INSERT INTO public.facilities (id, name, manager_name) VALUES
(facility1_id, 'Cotton Buds, Pads and Balls', 'Andrean'),
(facility2_id, 'Wet Wipes', 'Borislav'),
(facility3_id, 'Cotton Tape and Sliver', 'Ivaylo Aleksandrov'),
(facility4_id, 'Paper Sticks and Plastics', 'Krasimir'),
(facility5_id, 'CT K6 New Production Line', 'Ivaylo Aleksandrov')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Users into auth.users, which will trigger profile creation
-- Note: Passwords are placeholders. Users would typically be invited.
PERFORM public.create_user_with_profile('akilids@partpulse.com', 'password123', 'Mr. Akilids', 'ceo', NULL);
PERFORM public.create_user_with_profile('salim@partpulse.com', 'password123', 'Salim', 'admin', NULL);
PERFORM public.create_user_with_profile('ivan.velikov@partpulse.com', 'password123', 'Ivan Velikov', 'technical_director', NULL);
PERFORM public.create_user_with_profile('ivaylo.iliev@partpulse.com', 'password123', 'Ivaylo Iliev', 'head_technician', NULL);
PERFORM public.create_user_with_profile('dimitar@partpulse.com', 'password123', 'Dimitar', 'maintenance', NULL);
-- Create facility techs for each facility for testing
PERFORM public.create_user_with_profile('tech1@partpulse.com', 'password123', 'Andrean Tech', 'facility_tech', facility1_id);
PERFORM public.create_user_with_profile('tech2@partpulse.com', 'password123', 'Borislav Tech', 'facility_tech', facility2_id);
PERFORM public.create_user_with_profile('tech3@partpulse.com', 'password123', 'IA Tech', 'facility_tech', facility3_id);
PERFORM public.create_user_with_profile('tech4@partpulse.com', 'password123', 'Krasimir Tech', 'facility_tech', facility4_id);

END $$;