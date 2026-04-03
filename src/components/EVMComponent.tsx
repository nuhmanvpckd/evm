import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface Candidate {
  _id: string;
  name: string;
  symbol: string;
  photo?: string;
  position: number;
}

interface EVMProps {
  candidates: Candidate[];
  onVote: (candidate: Candidate) => void;
  isLocked: boolean;
}

// Sound Utility
const playSound = (type: 'press' | 'beep') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'press') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } else {
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1.5); // Long beep
    }
    
    // Close context after sound
    setTimeout(() => audioCtx.close(), 2000);
  } catch (err) {
    console.warn('Audio playback failed:', err);
  }
};

export default function EVMComponent({ candidates, onVote, isLocked }: EVMProps) {
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  const [showVVPAT, setShowVVPAT] = useState(false);
  const [votedCandidate, setVotedCandidate] = useState<Candidate | null>(null);

  const handleVoteClick = (candidate: Candidate) => {
    if (isLocked || activeCandidateId) return;
    
    setActiveCandidateId(candidate._id);
    setVotedCandidate(candidate);
    playSound('press');
    
    // Sequence: LED Green -> Beep -> onVote
    setTimeout(() => {
      playSound('beep');
      
      // Short delay after beep before calling onVote (which handles navigation)
      setTimeout(() => {
        onVote(candidate);
      }, 1000);
    }, 1000);
  };

  useEffect(() => {
    if (!isLocked) {
      setActiveCandidateId(null);
      setVotedCandidate(null);
    }
  }, [isLocked]);

  // Generate 10 fixed slots
  const slots = Array.from({ length: 10 }, (_, i) => {
    const pos = i + 1;
    const candidate = candidates.find(c => c.position === pos);
    return { pos, candidate };
  });

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="bg-[#f3f4f6] border-[12px] border-[#d1d5db] rounded-[40px] shadow-2xl overflow-hidden">
        {/* EVM Top Panel */}
        <div className="bg-[#d1d5db] p-6 flex justify-between items-center border-b-4 border-gray-400">
          <div className="flex gap-4">
            <div className="w-4 h-4 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
            <div className={cn(
              "w-4 h-4 rounded-full transition-all duration-300",
              isLocked ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]" : "bg-gray-400"
            )} />
          </div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-widest">
            Balloting Unit
          </div>
        </div>

        {/* Candidate List */}
        <div className="p-4 space-y-1 bg-white">
          {slots.map(({ pos, candidate }) => (
            <div 
              key={pos}
              className={cn(
                "flex items-stretch border-2 h-20 group transition-colors",
                candidate ? "border-gray-200" : "border-gray-100 opacity-20"
              )}
            >
              {/* Serial Number */}
              <div className="w-12 bg-gray-100 flex items-center justify-center border-r-2 border-gray-200 font-bold text-lg text-gray-700">
                {pos}
              </div>

              {/* Candidate Info */}
              <div className="flex-1 px-4 flex items-center gap-4 bg-white">
                {candidate ? (
                  <>
                    {candidate.photo && (
                      <img src={candidate.photo} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                    )}
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-lg uppercase leading-tight">
                        {candidate.name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Candidate</span>
                    </div>
                  </>
                ) : (
                  <div className="flex-1" />
                )}
              </div>

              {/* Symbol */}
              <div className="w-24 flex items-center justify-center border-x-2 border-gray-200 bg-white p-2">
                {candidate && (
                  <img src={candidate.symbol} alt="Symbol" className="max-w-full max-h-full object-contain" />
                )}
              </div>

              {/* Vote Button & LED */}
              <div className="w-32 flex items-center justify-center gap-4 bg-gray-50 px-4">
                {/* LED - Turns Green when voted */}
                <div className={cn(
                  "w-4 h-4 rounded-full transition-all duration-200",
                  activeCandidateId === candidate?._id ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.9)]" : "bg-gray-200"
                )} />
                
                {/* Blue Button */}
                <button
                  disabled={isLocked || !candidate || !!activeCandidateId}
                  onClick={() => candidate && handleVoteClick(candidate)}
                  className={cn(
                    "w-14 h-10 rounded-md shadow-md transition-all active:scale-95 active:shadow-inner",
                    (isLocked || !candidate || !!activeCandidateId)
                      ? "bg-gray-300 cursor-not-allowed" 
                      : "bg-[#1e40af] hover:bg-[#1d4ed8] cursor-pointer"
                  )}
                />
              </div>
            </div>
          ))}
        </div>

      {/* EVM Bottom Panel */}
      <div className="bg-[#d1d5db] p-4 text-center border-t-4 border-gray-400">
        <div className="inline-block px-6 py-1 bg-gray-800 text-white text-[10px] font-bold rounded-full uppercase tracking-widest">
          Bharat Electronics Limited
        </div>
      </div>
      </div>
    </div>
  );
}
