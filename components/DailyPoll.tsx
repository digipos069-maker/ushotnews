'use strict';
'use client';

import React, { useState } from 'react';
import { PollQuestion } from '@/types/news';
import { Vote, CheckCircle, BarChart2 } from 'lucide-react';

interface DailyPollProps {
  initialPoll: PollQuestion;
}

export default function DailyPoll({ initialPoll }: DailyPollProps) {
  const [poll, setPoll] = useState<PollQuestion>(initialPoll);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);

  const handleVote = () => {
    if (!selectedOptionId || hasVoted) return;

    setPoll((prev) => {
      const updatedOptions = prev.options.map((opt) => {
        if (opt.id === selectedOptionId) {
          return { ...opt, votes: opt.votes + 1 };
        }
        return opt;
      });

      return {
        ...prev,
        totalVotes: prev.totalVotes + 1,
        options: updatedOptions,
      };
    });

    setHasVoted(true);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-1.5 rounded-md bg-[#032EA1] text-white">
              <Vote className="w-4 h-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-[#032EA1]">
              Daily Reader Poll
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold serif-headline text-slate-900 mb-2">
            {poll.question}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-6">
            {poll.description} ({poll.totalVotes.toLocaleString()} votes cast)
          </p>

          {!hasVoted ? (
            <div className="space-y-3">
              {poll.options.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                    selectedOptionId === opt.id
                      ? 'border-[#032EA1] bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="poll-option"
                    value={opt.id}
                    checked={selectedOptionId === opt.id}
                    onChange={() => setSelectedOptionId(opt.id)}
                    className="w-4 h-4 text-[#032EA1] focus:ring-[#032EA1]"
                  />
                  <span className="text-sm font-medium text-slate-800">{opt.text}</span>
                </label>
              ))}

              <div className="pt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Select one option to cast your vote
                </span>
                <button
                  type="button"
                  onClick={handleVote}
                  disabled={!selectedOptionId}
                  className="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer disabled:opacity-50"
                >
                  Submit Vote
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Thank you! Your vote has been recorded in the national tally.</span>
              </div>

              {poll.options.map((opt) => {
                const percentage = Math.round((opt.votes / poll.totalVotes) * 100);
                const isUserChoice = opt.id === selectedOptionId;

                return (
                  <div key={opt.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className={isUserChoice ? 'font-bold text-[#032EA1]' : 'text-slate-700'}>
                        {opt.text} {isUserChoice && '(Your Vote)'}
                      </span>
                      <span className="font-bold text-slate-900 font-mono">
                        {percentage}% ({opt.votes.toLocaleString()})
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#032EA1] rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
