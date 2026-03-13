import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { InvokeLLM } from '@/api/entities';

export default function RulesSearch() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await InvokeLLM({
          prompt: `Search the D&D 5e SRD for information about: "${search}". Provide a concise explanation of the rule or mechanic. Format as: [RULE_NAME]: [brief explanation]`,
          add_context_from_internet: true,
        });
        setResults(response ? [{ name: search, desc: response }] : []);
      } catch (err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceTimer.current);
  }, [search]);

  return (
    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <Search className="w-4 h-4 text-zinc-500 dark:text-zinc-500" />
        <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">Quick Rules</h3>
      </div>

      <div className="relative mb-3">
        <Input
          placeholder="Search SRD (e.g., Blinded, Grapple, Advantage)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
        />
        {loading && <Loader className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-zinc-500" />}
      </div>

      <div className="overflow-y-auto flex-1">
        {!search.trim() ? (
          <p className="text-xs text-zinc-600 dark:text-zinc-500 text-center py-4">Search the D&D 5e SRD...</p>
        ) : loading ? (
          <p className="text-xs text-zinc-600 dark:text-zinc-500 text-center py-4">Searching...</p>
        ) : results.length === 0 ? (
          <p className="text-xs text-zinc-600 dark:text-zinc-500 text-center py-4">No results found</p>
        ) : (
          results.map((result) => (
            <div key={result.name} className="p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-300 mb-2">{result.name}</p>
              <p className="text-xs text-zinc-700 dark:text-zinc-500 leading-relaxed">{result.desc}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}