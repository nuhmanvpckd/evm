import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../lib/utils';
import { Plus, Trash2, ExternalLink, BarChart3, Settings } from 'lucide-react';

interface Demo {
  _id: string;
  name: string;
  slug: string;
  vvpat_enabled: boolean;
  candidates: any[];
  created_at: string;
}

export default function Dashboard() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDemo, setNewDemo] = useState({ name: '', slug: '', vvpat_enabled: true });

  const fetchDemos = async () => {
    try {
      const data = await fetchApi('/api/demos');
      setDemos(data);
    } catch (err) {
      console.error('Failed to fetch demos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemos();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/api/demo/create', {
        method: 'POST',
        body: JSON.stringify(newDemo),
      });
      setShowCreateModal(false);
      setNewDemo({ name: '', slug: '', vvpat_enabled: true });
      fetchDemos();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create demo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this demo?')) return;
    try {
      await fetchApi(`/api/demo/${id}`, { method: 'DELETE' });
      fetchDemos();
    } catch (err) {
      alert('Failed to delete demo');
    }
  };

  const totalVotes = demos.reduce((acc, demo) => {
    return acc + demo.candidates.reduce((cAcc, c) => cAcc + c.votes, 0);
  }, 0);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Manage your EVM demo sessions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Demo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Demos</p>
              <p className="text-2xl font-bold text-gray-900">{demos.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Votes</p>
              <p className="text-2xl font-bold text-gray-900">{totalVotes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Demos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Demo Name</th>
                <th className="px-6 py-4 font-medium">Candidates</th>
                <th className="px-6 py-4 font-medium">Total Votes</th>
                <th className="px-6 py-4 font-medium">Created At</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {demos.map((demo) => (
                <tr key={demo._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{demo.name}</div>
                    <div className="text-xs text-gray-500">/demo/{demo.slug}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{demo.candidates.length}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {demo.candidates.reduce((acc, c) => acc + c.votes, 0)}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(demo.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link
                      to={`/admin/demo/${demo._id}`}
                      className="inline-flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Manage Demo"
                    >
                      <Settings className="w-5 h-5" />
                    </Link>
                    <a
                      href={`/demo/${demo.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="View Public Page"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => handleDelete(demo._id)}
                      className="inline-flex items-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Demo"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {demos.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No demos found. Create your first one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Demo</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Demo Name</label>
                <input
                  type="text"
                  required
                  value={newDemo.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
                    setNewDemo({ ...newDemo, name, slug });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Booth 12 Vallikkunnu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL Slug</label>
                <input
                  type="text"
                  required
                  value={newDemo.slug}
                  onChange={(e) => setNewDemo({ ...newDemo, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="vvpat"
                  checked={newDemo.vvpat_enabled}
                  onChange={(e) => setNewDemo({ ...newDemo, vvpat_enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="vvpat" className="text-sm text-gray-700">Enable VVPAT Simulation</label>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
