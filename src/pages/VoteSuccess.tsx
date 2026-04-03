import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Share2, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';

export default function VoteSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = location.state || {};
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Optional: auto-redirect back to demo after some time
    }, 15000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const shareUrl = slug ? `${window.location.origin}/demo/${slug}` : window.location.origin;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EVM Demo',
          text: 'Try out this Electronic Voting Machine simulation!',
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback to copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-12 rounded-[40px] shadow-xl border-8 border-green-50 max-w-md w-full"
      >
        <div className="flex justify-center mb-8">
          <motion.div 
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center"
          >
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          </motion.div>
        </div>
        
        <h1 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tight">
          Vote Recorded
        </h1>
        
        <p className="text-xl text-gray-500 font-medium mb-12">
          Your choice has been successfully registered in the system.
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-100">
            <p className="text-blue-700 font-bold text-sm uppercase tracking-widest">
              VVPAT Slip Printed Successfully
            </p>
          </div>
          
          <button
            onClick={handleShare}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Copied to Clipboard
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5" />
                Share this Demo
              </>
            )}
          </button>

          <button
            onClick={() => navigate(slug ? `/demo/${slug}` : '/')}
            className="w-full py-3 text-gray-400 font-bold text-sm uppercase tracking-widest hover:text-gray-600 transition-colors"
          >
            Back to Ballot
          </button>
        </div>
      </motion.div>
      
      <p className="mt-12 text-gray-400 font-bold text-xs uppercase tracking-[0.2em]">
        Election Commission Simulation
      </p>
    </div>
  );
}
