import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../../lib/utils';
import { Plus, Trash2, ArrowLeft, RotateCcw, QrCode, Image as ImageIcon, User, Loader2, Edit2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Candidate {
  _id: string;
  name: string;
  symbol: string;
  photo?: string;
  position: number;
  votes: number;
}

interface Demo {
  _id: string;
  name: string;
  slug: string;
  vvpat_enabled: boolean;
  candidates: Candidate[];
  created_at: string;
}

export default function DemoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [demo, setDemo] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ name: '', symbol: '', photo: '', position: '' });
  const [editingCandidate, setEditingCandidate] = useState<any>(null);

  const occupiedPositions = demo?.candidates.map(c => c.position) || [];
  const availablePositions = Array.from({ length: 10 }, (_, i) => i + 1).filter(p => !occupiedPositions.includes(p));

  const fetchDemo = async () => {
    if (!id) return;
    try {
      const data = await fetchApi(`/api/demo/id/${id}`);
      setDemo(data);
    } catch (err) {
      console.error('Failed to fetch demo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemo();
  }, [id]);

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newCandidate.position) return;
    try {
      await fetchApi('/api/candidate/add', {
        method: 'POST',
        body: JSON.stringify({ 
          demoId: id, 
          ...newCandidate,
          position: parseInt(newCandidate.position)
        }),
      });
      setShowAddModal(false);
      setNewCandidate({ name: '', symbol: '', photo: '', position: '' });
      fetchDemo();
    } catch (err) {
      alert('Failed to add candidate');
    }
  };

  const handleEditCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editingCandidate || !editingCandidate.position) return;
    try {
      await fetchApi('/api/candidate/edit', {
        method: 'POST',
        body: JSON.stringify({ 
          demoId: id, 
          candidateId: editingCandidate._id,
          ...editingCandidate,
          position: parseInt(editingCandidate.position)
        }),
      });
      setShowEditModal(false);
      setEditingCandidate(null);
      fetchDemo();
    } catch (err) {
      alert('Failed to edit candidate');
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm('Are you sure you want to delete this candidate?')) return;
    if (!id) return;
    try {
      await fetchApi('/api/candidate/delete', {
        method: 'POST',
        body: JSON.stringify({ demoId: id, candidateId }),
      });
      fetchDemo();
    } catch (err) {
      alert('Failed to delete candidate');
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all votes for this demo?')) return;
    if (!id) return;
    try {
      await fetchApi('/api/demo/reset', {
        method: 'POST',
        body: JSON.stringify({ demoId: id }),
      });
      fetchDemo();
    } catch (err) {
      alert('Failed to reset votes');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'symbol' | 'photo', isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditingCandidate((prev: any) => ({ ...prev, [field]: reader.result as string }));
        } else {
          setNewCandidate(prev => ({ ...prev, [field]: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!demo) return <div>Demo not found</div>;

  const demoUrl = `${window.location.origin}/demo/${demo.slug}`;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{demo.name}</h1>
          <p className="text-gray-500">Manage candidates and view results</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Candidate
        </button>
        <button
          onClick={handleReset}
          className="bg-orange-100 text-orange-700 hover:bg-orange-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          Reset Votes
        </button>
        <button
          onClick={() => setShowQRModal(true)}
          className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <QrCode className="w-5 h-5" />
          Demo QR Code
        </button>
        <a
          href={demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          View Demo Page
        </a>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Candidates</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Pos</th>
                <th className="px-6 py-4 font-medium">Symbol</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Votes</th>
                <th className="px-6 py-4 font-medium">Percentage</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {demo.candidates.sort((a, b) => a.position - b.position).map((candidate) => {
                const totalVotes = demo.candidates.reduce((acc, c) => acc + c.votes, 0);
                const percentage = totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : 0;
                
                return (
                  <tr key={candidate._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-400">#{candidate.position}</td>
                    <td className="px-6 py-4">
                      <img src={candidate.symbol} alt={candidate.name} className="w-12 h-12 object-contain bg-gray-50 rounded" />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{candidate.name}</td>
                    <td className="px-6 py-4 text-gray-600">{candidate.votes}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="text-sm text-gray-500">{percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingCandidate({ ...candidate });
                            setShowEditModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Candidate"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCandidate(candidate._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Candidate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {demo.candidates.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No candidates added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Candidate</h2>
            <form onSubmit={handleAddCandidate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ballot Position (1-10)</label>
                <select
                  required
                  value={newCandidate.position}
                  onChange={(e) => setNewCandidate({ ...newCandidate, position: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option key="default" value="">Select Position</option>
                  {availablePositions.map(p => (
                    <option key={p} value={p}>Position {p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Name</label>
                <input
                  type="text"
                  required
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Party Symbol</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    {newCandidate.symbol ? (
                      <img src={newCandidate.symbol} className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500">Upload Symbol</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'symbol')} required />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Photo (Optional)</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    {newCandidate.photo ? (
                      <img src={newCandidate.photo} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <User className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500">Upload Photo</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'photo')} />
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Candidate Modal */}
      {showEditModal && editingCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Candidate</h2>
            <form onSubmit={handleEditCandidate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ballot Position (1-10)</label>
                <select
                  required
                  value={editingCandidate.position}
                  onChange={(e) => setEditingCandidate({ ...editingCandidate, position: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option key="default" value="">Select Position</option>
                  {Array.from(new Set([...availablePositions, Number(editingCandidate.position)]))
                    .sort((a, b) => a - b)
                    .map(p => (
                      <option key={p} value={p}>Position {p}</option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Name</label>
                <input
                  type="text"
                  required
                  value={editingCandidate.name}
                  onChange={(e) => setEditingCandidate({ ...editingCandidate, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Party Symbol</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    {editingCandidate.symbol ? (
                      <img src={editingCandidate.symbol} className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500">Upload Symbol</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'symbol', true)} />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Photo (Optional)</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    {editingCandidate.photo ? (
                      <img src={editingCandidate.photo} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <User className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500">Upload Photo</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'photo', true)} />
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Demo QR Code</h2>
            <div className="bg-white p-4 inline-block rounded-xl border border-gray-100 mb-6">
              <QRCodeSVG value={demoUrl} size={200} />
            </div>
            <p className="text-sm text-gray-500 mb-6">Scan this code to open the demo page on any device</p>
            <button
              onClick={() => setShowQRModal(false)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
