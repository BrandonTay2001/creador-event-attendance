import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, RefreshCw, User } from 'lucide-react';
import { getUserRole, upsertUserRole, type UserRole, type AssignableUserRole } from '../lib/roles';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ProfileWithRole extends Profile {
  role: UserRole | null;
}

interface UserManagementProps {
  onBack: () => void;
}

export function UserManagement({ onBack }: UserManagementProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ProfileWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all profiles from the profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) {
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }

      // Filter out the current user and get roles for each remaining user
      const filteredProfiles = (profiles || []).filter(profile => profile.id !== currentUser?.id);
      
      const usersWithRoles = await Promise.all(
        filteredProfiles.map(async (profile) => {
          const role = await getUserRole(profile.id);
          return {
            ...profile,
            role
          } as ProfileWithRole;
        })
      );

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      // Use the upsertUserRole function from roles.ts
      const success = await upsertUserRole(userId, newRole);
      if (!success) {
        throw new Error('Failed to update user role');
      }

      // Update the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const getRoleColor = (role: UserRole | null) => {
    switch (role) {
      case 'superAdmin':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'admin':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'staff':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">User Management</h1>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">User Management</h1>
        </div>
        
        <div className="border border-red-200 rounded-lg p-6 bg-white text-center text-red-600">
          <p className="font-medium mb-2">Error Loading Users</p>
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <Button onClick={loadUsers} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">User Management</h1>
        </div>
        
        <Button onClick={loadUsers} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <div 
            key={user.id} 
            className="border rounded-lg p-6 bg-white hover:shadow-sm transition-shadow flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 rounded-full p-2">
                <User className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-medium">
                    {user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name}` 
                      : user.email
                    }
                  </div>
                  {user.first_name && user.last_name && (
                    <div className="text-gray-500 text-sm">
                      {user.email}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className={getRoleColor(user.role)}>
                  {user.role || 'No Role'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={user.role === 'superAdmin' ? 'admin' : (user.role || 'staff')}
                onChange={(e) => {
                  const newRole = e.target.value as AssignableUserRole;
                  updateUserRole(user.id, newRole);
                }}
                disabled={user.role === 'superAdmin'}
                className={`px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  user.role === 'superAdmin' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>
        ))}
        
        {users.length === 0 && (
          <div className="border rounded-lg p-12 bg-white text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}