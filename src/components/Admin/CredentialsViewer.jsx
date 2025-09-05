import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Users, Loader2 } from 'lucide-react';
import NewUserForm from './NewUserForm';

const CredentialsViewer = ({ facilities }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_all_users_with_profiles');

    if (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to fetch users',
        description: error.message,
      });
      setUsers([]);
    } else {
      setUsers(data);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="p-4 md:p-6 bg-slate-900/50 rounded-xl border border-slate-800">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">User Management</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading} className="text-white border-slate-600 hover:bg-slate-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button onClick={() => setIsFormOpen(true)} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Username</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Role</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Facility</th>
            </tr>
          </thead>
          <tbody className="bg-slate-800/50 divide-y divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((user) => (
                <tr key={user.user_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">{user.role?.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{user.facility_name || 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-8 text-slate-400">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <NewUserForm
          onClose={() => setIsFormOpen(false)}
          onUserAdded={fetchUsers}
          facilities={facilities}
        />
      )}
    </div>
  );
};

export default CredentialsViewer;