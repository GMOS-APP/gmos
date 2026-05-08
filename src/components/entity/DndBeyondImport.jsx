import React, { useState } from 'react';
import { functions, WorldEntity } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Download, ExternalLink, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

// Parse comma-separated input into a deduplicated list of numeric character IDs
function parseIds(raw) {
  return [...new Set(
    raw.split(',').map(s => s.trim()).filter(s => /^\d+$/.test(s))
  )];
}

export default function DndBeyondImport({ onImport, onCancel, onBulkDone, campaignId }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]); // bulk progress rows

  const ids = parseIds(input);
  const isBulk = ids.length > 1;
  const canImport = ids.length > 0 && !loading;

  const setRowStatus = (id, patch) =>
    setResults(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));

  const handleImport = async () => {
    if (!canImport) return;
    setError('');

    // ── Single import ──────────────────────────────────────────────────────
    if (!isBulk) {
      setLoading(true);
      try {
        const response = await functions.invoke('importDndBeyondCharacter', { characterId: ids[0] });
        onImport(response.data.character);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || 'Failed to import character.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── Bulk import ────────────────────────────────────────────────────────
    setResults(ids.map(id => ({ id, status: 'pending', name: null, error: null })));
    setLoading(true);

    for (const id of ids) {
      setRowStatus(id, { status: 'loading' });
      try {
        const response = await functions.invoke('importDndBeyondCharacter', { characterId: id });
        const characterData = response.data.character;
        await WorldEntity.create({ ...characterData, campaign_id: campaignId });
        setRowStatus(id, { status: 'success', name: characterData.name });
      } catch (err) {
        const msg = err?.response?.data?.error || err.message || 'Failed to import.';
        setRowStatus(id, { status: 'error', error: msg });
      }
    }

    setLoading(false);
  };

  // ── Bulk results view ──────────────────────────────────────────────────────
  if (results.length > 0) {
    const successCount = results.filter(r => r.status === 'success').length;
    const allDone = !loading;

    return (
      <div className="max-w-2xl mx-auto mt-8">
        <h2 className="text-2xl font-bold dark:text-zinc-100 text-zinc-900 mb-6">
          {allDone ? 'Import Complete' : 'Importing Characters…'}
        </h2>

        <div className="space-y-2 mb-6">
          {results.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg dark:bg-zinc-900 bg-zinc-100 border dark:border-zinc-800 border-zinc-200">
              {r.status === 'pending' && <Clock className="w-4 h-4 text-zinc-500 flex-shrink-0" />}
              {r.status === 'loading' && <Loader2 className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />}
              {r.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              {r.status === 'error'   && <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium dark:text-zinc-200 text-zinc-900 truncate">
                  {r.name || `Character ${r.id}`}
                </p>
                {r.error && (
                  <p className="text-xs text-red-400 mt-0.5 truncate">{r.error}</p>
                )}
              </div>
              <span className="text-xs dark:text-zinc-600 text-zinc-500 font-mono flex-shrink-0">{r.id}</span>
            </div>
          ))}
        </div>

        {allDone && (
          <div className="flex items-center gap-4">
            <p className="text-sm dark:text-zinc-400 text-zinc-600">
              {successCount} of {results.length} character{results.length !== 1 ? 's' : ''} imported.
            </p>
            <Button
              onClick={onBulkDone}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold ml-auto"
            >
              View Characters
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Input view ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold dark:text-zinc-100 text-zinc-900 mb-2">Import from D&D Beyond</h2>
      <p className="text-sm dark:text-zinc-500 text-zinc-600 mb-1">
        Enter one or more D&D Beyond Character IDs, separated by commas.
      </p>
      <p className="text-xs dark:text-zinc-600 text-zinc-500 mb-6 flex items-center gap-1.5">
        <ExternalLink className="w-3 h-3" />
        The ID is the number in the character URL:
        dndbeyond.com/characters/<span className="text-amber-600 dark:text-amber-400 font-mono">155724296</span>
      </p>

      {/* Privacy notice */}
      <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 mb-6">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300/80 leading-relaxed">
          Each character's privacy must be set to <strong className="text-amber-400">Public</strong> on D&D Beyond.
          Character Sheet → Edit → Character Settings → Character Privacy → <strong className="text-amber-400">Public</strong>.
        </p>
      </div>

      <div className="flex gap-2 mb-2">
        <Input
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleImport()}
          placeholder="e.g. 155724296, 123456789, 987654321"
          className="bg-zinc-100 border-zinc-300 text-zinc-900 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 font-mono"
        />
        <Button
          onClick={handleImport}
          disabled={!canImport}
          className="bg-purple-600 hover:bg-purple-500 text-white shrink-0"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <><Download className="w-4 h-4 mr-1.5" />{isBulk ? `Import ${ids.length}` : 'Import'}</>}
        </Button>
      </div>

      {ids.length > 1 && (
        <p className="text-xs dark:text-zinc-600 text-zinc-500 mb-4">
          {ids.length} characters detected — they will be saved directly to the campaign.
        </p>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300 leading-relaxed">{error}</p>
        </div>
      )}

      <button
        onClick={onCancel}
        className="text-xs dark:text-zinc-600 text-zinc-500 hover:dark:text-zinc-400 hover:text-zinc-700 transition-colors"
      >
        ← Back to options
      </button>
    </div>
  );
}
