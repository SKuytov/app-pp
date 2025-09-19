import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';

const NewUserForm = ({ onClose, onUserAdded, facilities }) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please select a role.' });
      return;
    }
    if (role !== 'admin' && role !== 'ceo' && role !== 'technical_director' && !facilityId) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please select a facility for this role.' });
      return;
    }

    setLoading(true);

    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          role: role,
          facility_id: facilityId || null, 
        }
      }
    });

    setLoading(false);

    if (error) {
      toast({ variant: 'destructive', title: 'User creation failed', description: error.message });
    } else if (user) {
      toast({ title: 'User created successfully!', description: 'The new user account has been created.' });
      onUserAdded();
      onClose();
    }
  };
  
  const isFacilityRequired = !['admin', 'ceo', 'technical_director'].includes(role);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-white/20 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Add New User</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required className="bg-white/10 border-white/20 text-white" />
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/10 border-white/20 text-white" />
          <Input type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-white/10 border-white/20 text-white" />
          
          <Select onValueChange={setRole} value={role}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20 text-white">
              <SelectItem value="ceo">CEO</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="technical_director">Technical Director</SelectItem>
              <SelectItem value="head_technician">Head Technician</SelectItem>
              <SelectItem value="facility_tech">Facility Technician</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={setFacilityId} value={facilityId} disabled={!isFacilityRequired}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder={isFacilityRequired ? "Select a facility" : "Facility not applicable"} />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20 text-white">
              {(facilities || []).map(facility => (
                <SelectItem key={facility.id} value={facility.id}>{facility.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create User'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default NewUserForm;