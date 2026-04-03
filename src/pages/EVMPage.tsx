import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../lib/utils';
import EVMComponent from '../components/EVMComponent';
import { Loader2, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';

export default function EVMPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [demo, setDemo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voteRecorded, setVoteRecorded] = useState(false);

  useEffect(() => {
    const fetchDemo = async () => {
      if (!slug) return;
      try {
        const data = await fetchApi(`/api/demo/${slug}`);
        setDemo(data);
      } catch (err) {
        console.error('Demo not found');
      } finally {
        setLoading(false);
      }
    };
    fetchDemo();

    // Auto-reset session on page load
    localStorage.removeItem(`voted_${slug}`);
    setVoteRecorded(false);
  }, [slug]);

  const handleVote = async (candidate: any) => {
    if (voteRecorded || !demo) return;
    
    try {
      await fetchApi('/api/vote', {
        method: 'POST',
        body: JSON.stringify({ demoId: demo._id, candidateId: candidate._id }),
      });
      
      setVoteRecorded(true);
      localStorage.setItem(`voted_${slug}`, 'true');
      
      // Navigate to VVPAT screen with candidate data and slug
      navigate('/vvpat', { state: { candidate, slug } });
    } catch (err) {
      console.error('Failed to record vote:', err);
      alert('Failed to record vote. Please try again.');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
    </div>
  );

  if (!demo) return <div className="min-h-screen flex items-center justify-center text-xl">Demo not found</div>;

  const t = {
    en: {
      title: 'Electronic Voting Machine',
      subtitle: 'Demo Session',
      voteRecorded: 'Your vote has been recorded successfully!',
      vvpatTitle: 'VVPAT Slip',
      language: 'മലയാളം'
    },
    ml: {
      title: 'ഇലക്ട്രോണിക് വോട്ടിംഗ് മെഷീൻ',
      subtitle: 'ഡെമോ സെഷൻ',
      voteRecorded: 'നിങ്ങളുടെ വോട്ട് വിജയകരമായി രേഖപ്പെടുത്തി!',
      vvpatTitle: 'വിവിപാറ്റ് സ്ലിപ്പ്',
      language: 'English'
    }
  };

  return (
    <div className="min-h-screen bg-[#e5e7eb] py-8 px-4 font-sans select-none overflow-x-hidden">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-gray-300 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-1">
              Electronic Voting Machine
            </h1>
            <p className="text-gray-500 font-bold uppercase text-xs tracking-[0.3em]">
              {demo.name} - Balloting Unit
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <EVMComponent 
            candidates={demo.candidates} 
            onVote={handleVote} 
            isLocked={voteRecorded}
          />
        </div>

        <div className="text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest pt-8">
          Election Commission of India Simulation
        </div>
      </div>
    </div>
  );
}
