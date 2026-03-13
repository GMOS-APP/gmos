import React, { useState } from 'react';
import { functions } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Download, ExternalLink, AlertTriangle } from 'lucide-react';

export default function DndBeyondImport({ onImport, onCancel }) {
  const [characterId, setCharacterId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async () => {
    if (!characterId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await functions.invoke('importDndBeyondCharacter', { characterId: characterId.trim() });
      onImport(response.data.character);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to import character.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold text-zinc-100 mb-2">Import from D&D Beyond</h2>
      <p className="text-sm text-zinc-500 mb-1">
        Enter your D&D Beyond Character ID to import character data automatically.
      </p>
      <p className="text-xs text-zinc-600 mb-6 flex items-center gap-1.5">
        <ExternalLink className="w-3 h-3" />
        Your Character ID is the number in your character's URL on D&D Beyond
        (e.g., dndbeyond.com/characters/<span className="text-amber-400 font-mono">155724296</span>)
      </p>

      {/* Privacy notice */}
      <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 mb-6">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300/80 leading-relaxed">
          Your character's privacy must be set to <strong className="text-amber-400">Public</strong> on D&D Beyond.
          Go to your Character Sheet → Edit → Character Settings → Character Privacy → set to <strong className="text-amber-400">Public</strong>.
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          value={characterId}
          onChange={(e) => setCharacterId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleImport()}
          placeholder="Enter Character ID (e.g. 155724296)"
          className="bg-zinc-900/60 border-zinc-800 text-zinc-200 font-mono"
        />
        <Button
          onClick={handleImport}
          disabled={loading || !characterId.trim()}
          className="bg-purple-600 hover:bg-purple-500 text-white shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300 leading-relaxed">{error}</p>
        </div>
      )}

      <button
        onClick={onCancel}
        className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        ← Back to options
      </button>
    </div>
  );
}