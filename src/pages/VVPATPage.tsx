import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function VVPATPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { candidate, slug } = location.state || {};
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (!candidate) {
      navigate('/');
      return;
    }

    // Sound effect for VVPAT start
    const playBeep = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const audioCtx = new AudioContextClass();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 1.5);
        setTimeout(() => audioCtx.close(), 2000);
      } catch (err) {
        console.warn('Audio failed', err);
      }
    };

    playBeep();
    
    // Start printing animation after a short delay
    const printTimer = setTimeout(() => setIsPrinting(true), 500);
    
    // Navigate to success screen after 5 seconds
    const successTimer = setTimeout(() => {
      navigate('/vote-success', { state: { slug } });
    }, 5000);

    return () => {
      clearTimeout(printTimer);
      clearTimeout(successTimer);
    };
  }, [candidate, navigate]);

  if (!candidate) return null;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* VVPAT Machine Body */}
      <div className="w-full max-w-md bg-[#d1d5db] rounded-[20px] border-[10px] border-gray-700 shadow-2xl overflow-hidden flex flex-col items-center p-8 relative">
        
        {/* Machine Label */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">
          VVPAT Unit - EC
        </div>

        {/* Glass Window */}
        <div className="w-full aspect-[4/5] bg-gray-800 rounded-lg border-[15px] border-gray-900 shadow-inner relative overflow-hidden flex items-start justify-center pt-4">
          
          {/* Internal Light Effect */}
          <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none" />

          {/* The Slip */}
          <motion.div
            initial={{ y: -400 }}
            animate={isPrinting ? { y: 0 } : { y: -400 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="w-[85%] bg-white shadow-lg rounded-sm p-6 flex flex-col items-center gap-6 border-b-4 border-dashed border-gray-200"
          >
            <div className="w-full border-b border-gray-100 pb-2 text-center">
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                Election Commission of India
              </span>
            </div>

            {/* Symbol */}
            <div className="w-32 h-32 border-2 border-gray-50 p-4 flex items-center justify-center bg-gray-50">
              <img 
                src={candidate.symbol} 
                alt="" 
                className="max-w-full max-h-full object-contain grayscale brightness-90" 
              />
            </div>

            {/* Candidate Name */}
            <div className="text-center">
              <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Candidate</div>
              <div className="text-2xl font-black text-gray-900 uppercase leading-none tracking-tight">
                {candidate.name}
              </div>
            </div>

            {/* Serial Number */}
            <div className="mt-4 px-3 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-500">
              POS: {candidate.position}
            </div>
          </motion.div>
        </div>

        {/* Machine Bottom Details */}
        <div className="mt-8 flex gap-4">
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <div className="w-3 h-3 rounded-full bg-gray-400" />
        </div>
        
        <div className="mt-4 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
          Paper Trail System
        </div>
      </div>

      {/* Instructions Overlay */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] text-center">
        Please verify your vote on the screen above
      </div>
    </div>
  );
}
