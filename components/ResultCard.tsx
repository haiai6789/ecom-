
import React from 'react';

interface ResultCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  colorClass?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ label, value, subValue, colorClass = "text-slate-900" }) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</span>
      <span className={`text-xl font-bold ${colorClass}`}>{value}</span>
      {subValue && <span className="text-xs text-slate-400 font-medium mt-1">{subValue}</span>}
    </div>
  );
};

export default ResultCard;
