import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { admin } from '../../lib/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await admin.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <Link to="/admin" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">← Back to Dashboard</Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">User Management</h1>
          <p className="text-slate-600">View and manage all registered users</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">User ID</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Name</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Email</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Username</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Phone</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Role</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">#{user.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {user.firstname} {user.lastname}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{user.username}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{user.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center text-green-600 text-sm">
                            <UserCheck className="w-4 h-4 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-600 text-sm">
                            <UserX className="w-4 h-4 mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-2">User Statistics</h3>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-600">Total Users</div>
              <div className="text-2xl font-bold text-slate-900">{users.length}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-600">Active Users</div>
              <div className="text-2xl font-bold text-green-600">{users.filter(u => u.is_active).length}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-600">Admins</div>
              <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'admin').length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;