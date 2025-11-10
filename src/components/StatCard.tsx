import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'red';
  pulse?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-violet-100 text-violet-600',
  red: 'bg-red-100 text-red-600'
};

export default function StatCard({ title, value, icon: Icon, color, pulse, clickable, onClick }: StatCardProps) {
  const CardContent = () => (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${colorClasses[color]} relative`}>
        <Icon className="w-6 h-6" />
        {pulse && (
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </div>
    </div>
  );

  if (clickable && onClick) {
    return (
      <button
        onClick={onClick}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer text-left w-full"
      >
        <CardContent />
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <CardContent />
    </div>
  );
}
