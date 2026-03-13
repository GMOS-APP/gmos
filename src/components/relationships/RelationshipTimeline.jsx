import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Edit } from 'lucide-react';

export default function RelationshipTimeline({ relationships, onEditRelationship }) {
  // Group by session
  const grouped = relationships.reduce((acc, rel) => {
    const session = rel.session_established || rel.session_changed || 0;
    if (!acc[session]) acc[session] = [];
    acc[session].push(rel);
    return acc;
  }, {});

  const sessions = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      broken: 'bg-red-500/20 text-red-400 border-red-500/30',
      secret: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      suspected: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      historical: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    };
    return colors[status] || colors.active;
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-zinc-950 rounded-xl border border-zinc-800 p-6">
      {sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-zinc-600">
          <Clock className="w-12 h-12 mb-3" />
          <p>No relationship timeline data yet</p>
        </div>
      )}

      <div className="space-y-8">
        {sessions.map(session => (
          <div key={session} className="relative">
            {/* Session header */}
            <div className="flex items-center gap-3 mb-4 sticky top-0 bg-zinc-950 z-10 pb-2">
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-zinc-200">
                  {session === '0' ? 'Pre-Campaign' : `Session ${session}`}
                </span>
              </div>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Relationships in this session */}
            <div className="space-y-3 pl-8 border-l-2 border-zinc-800">
              {grouped[session].map(rel => (
                <div
                  key={rel.id}
                  className="relative bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-900 hover:border-amber-500/30 transition-all cursor-pointer group"
                  onClick={() => onEditRelationship(rel)}
                >
                  <div className="absolute -left-8 top-4 w-6 h-6 rounded-full bg-zinc-900 border-2 border-amber-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-zinc-200">{rel.source_name}</span>
                        <span className="text-xs text-zinc-600 font-mono">{rel.relationship_type.replace('_', ' ')}</span>
                        <span className="text-sm font-medium text-zinc-200">{rel.target_name}</span>
                      </div>

                      {rel.description && (
                        <p className="text-xs text-zinc-500 mb-2">{rel.description}</p>
                      )}

                      {rel.notes && (
                        <div className="bg-zinc-950/50 border border-zinc-800 rounded p-2 mb-2">
                          <p className="text-xs text-zinc-400">{rel.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] ${getStatusColor(rel.status)}`}>
                          {rel.status}
                        </Badge>
                        {rel.strength && (
                          <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
                            Strength: {rel.strength}/10
                          </Badge>
                        )}
                        {rel.session_changed && rel.session_changed !== rel.session_established && (
                          <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
                            Changed: Session {rel.session_changed}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <button className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-amber-400 transition-opacity">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}