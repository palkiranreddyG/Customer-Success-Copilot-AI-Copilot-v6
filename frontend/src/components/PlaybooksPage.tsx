import React, { useState, useEffect } from 'react';
import { getPlaybooks, uploadPlaybook, deletePlaybook, getPlaybookContent, searchKB } from '../lib/api';
import type { PlaybookFile } from '../lib/api';
import { BookOpen, Search, Upload, Trash2, FileText, ChevronRight, Book, HelpCircle } from 'lucide-react';
import { useToast } from './ToastProvider';

export const PlaybooksPage: React.FC = () => {
  const toast = useToast();
  const [playbooks, setPlaybooks] = useState<PlaybookFile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [filterPlaybook, setFilterPlaybook] = useState('');
  const [filterRiskType, setFilterRiskType] = useState('');

  // Selected playbook details
  const [selectedPlaybook, setSelectedPlaybook] = useState<string | null>(null);
  const [playbookContent, setPlaybookContent] = useState<any>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);

  const fetchPlaybooks = async () => {
    try {
      setLoading(true);
      const data = await getPlaybooks();
      setPlaybooks(data);
      if (data.length > 0 && !selectedPlaybook) {
        setSelectedPlaybook(data[0].name);
      }
    } catch (e: any) {
      toast.error('Failed to load playbooks', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaybooks();
  }, []);

  useEffect(() => {
    if (selectedPlaybook) {
      const fetchContent = async () => {
        setLoadingContent(true);
        try {
          const res = await getPlaybookContent(selectedPlaybook);
          setPlaybookContent(res);
        } catch (e: any) {
          toast.error('Failed to load playbook content', e.message);
        } finally {
          setLoadingContent(false);
        }
      };
      fetchContent();
    }
  }, [selectedPlaybook]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const res = await uploadPlaybook(file);
      toast.success('Playbook Uploaded', `"${file.name}" has been chunked, embedded, and added to the Knowledge Base.`);
      fetchPlaybooks();
      setSelectedPlaybook(res.filename);
    } catch (e: any) {
      toast.error('Upload Failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}? This will remove it from the database and vector store.`)) {
      return;
    }
    try {
      await deletePlaybook(filename);
      toast.success('Playbook Deleted', `"${filename}" was successfully removed from the platform.`);
      if (selectedPlaybook === filename) {
        setSelectedPlaybook(null);
        setPlaybookContent(null);
      }
      fetchPlaybooks();
    } catch (e: any) {
      toast.error('Deletion Failed', e.message);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await searchKB(searchQuery, 10);
      setSearchResults(res.chunks || []);
    } catch (e: any) {
      toast.error('Search Failed', e.message);
    } finally {
      setSearching(false);
    }
  };

  // Convert distance to a user-friendly relevance percentage (typically distance is L2/cosine distance)
  const getRelevancePercentage = (score: number) => {
    // Distance usually ranges from 0 to ~2 (where 0 means identical).
    // Let's compute a percentage: 100 * (1 - distance/2) and clamp it between 0 and 100.
    const percentage = Math.round((1 - score / 2) * 100);
    return Math.max(0, Math.min(100, percentage));
  };

  // Safe keyword highlighter
  const highlightKeywords = (text: string, query: string) => {
    if (!query.trim()) return text;
    const words = query.split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return text;
    
    // Create regex matching any of the search words
    const pattern = `(${words.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})`;
    const parts = text.split(new RegExp(pattern, 'gi'));
    
    return (
      <>
        {parts.map((part, i) => {
          const isMatch = words.some(w => w.toLowerCase() === part.toLowerCase());
          return isMatch ? (
            <mark key={i} className="bg-violet-200 dark:bg-violet-900/50 text-violet-850 dark:text-violet-250 px-1 py-0.5 rounded font-medium">
              {part}
            </mark>
          ) : (
            part
          );
        })}
      </>
    );
  };

  // Filter search results
  const filteredSearchResults = searchResults.filter(chunk => {
    if (filterPlaybook && chunk.source !== filterPlaybook) return false;
    if (filterRiskType) {
      // Basic heuristic: check if content includes risk keywords
      const c = chunk.text.toLowerCase();
      if (filterRiskType === 'RETENTION' && !c.includes('renew') && !c.includes('churn') && !c.includes('risk')) return false;
      if (filterRiskType === 'ESCALATION' && !c.includes('escalat') && !c.includes('downtime') && !c.includes('support')) return false;
      if (filterRiskType === 'EXPANSION' && !c.includes('upsell') && !c.includes('expansion') && !c.includes('growth')) return false;
    }
    return true;
  });

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-slide-up">
      <div>
        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
          <BookOpen className="h-6.5 w-6.5 text-violet-500" />
          Playbooks Knowledge Base
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-450 mt-1">
          Browse, query, and upload organizational playbook markdown, text, PDF, and Word document sources stored in the ChromaDB vector database.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Playbook Listing & Upload */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Indexed Sources ({playbooks.length})
              </h4>
              
              <label className={`text-xs bg-violet-600 hover:bg-violet-500 text-white font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload className="h-3.5 w-3.5" />
                {uploading ? 'Uploading...' : 'Add Source'}
                <input
                  type="file"
                  accept=".md,.txt,.pdf,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading sources...</div>
            ) : playbooks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-450 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No playbook sources indexed yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {playbooks.map(pb => (
                  <div
                    key={pb.name}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                      selectedPlaybook === pb.name
                        ? 'bg-violet-500/10 border-violet-500 text-violet-750 dark:text-violet-300 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-950/50'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedPlaybook(pb.name)}
                      className="flex items-center gap-2 text-left bg-transparent border-0 font-medium cursor-pointer p-0 select-text outline-none truncate flex-1 mr-2"
                    >
                      <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="truncate">{pb.name}</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                        {pb.chunk_count} chunks
                      </span>
                      <button
                        onClick={() => handleDelete(pb.name)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1 bg-transparent border-0 cursor-pointer rounded"
                        title="Delete source"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick KB Search Block */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Knowledge Search Filter
              </h4>
              <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-0.5">
                Query terms below to see relevance percentages and matched keywords.
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Query playbooks..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-xs transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs transition-colors shadow-md shadow-indigo-600/10 cursor-pointer border-0"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <select
                    value={filterPlaybook}
                    onChange={e => setFilterPlaybook(e.target.value)}
                    className="flex-1 px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] focus:outline-none"
                  >
                    <option value="">All Playbooks</option>
                    {playbooks.map(pb => (
                      <option key={pb.name} value={pb.name}>{pb.name}</option>
                    ))}
                  </select>
                  <select
                    value={filterRiskType}
                    onChange={e => setFilterRiskType(e.target.value)}
                    className="flex-1 px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] focus:outline-none"
                  >
                    <option value="">All Risk Types</option>
                    <option value="RETENTION">Retention</option>
                    <option value="ESCALATION">Escalation</option>
                    <option value="EXPANSION">Expansion</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Playbook Content Display or Search Results */}
        <div className="lg:col-span-2 space-y-6">
          {searchQuery && searchResults.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-1.5">
                  <Search className="h-4.5 w-4.5 text-indigo-500" />
                  Search Results for "{searchQuery}"
                </h4>
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-350 cursor-pointer border-0 bg-transparent"
                >
                  Clear Results
                </button>
              </div>

              {filteredSearchResults.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-450">
                  No matches found with current filters.
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {filteredSearchResults.map((chunk, idx) => {
                    const relevance = getRelevancePercentage(chunk.score);
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-slate-200 dark:hover:border-slate-750 transition-all flex flex-col gap-2.5 text-left"
                      >
                        <div className="flex items-center justify-between gap-4 flex-wrap text-[10px] font-bold text-slate-400">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-550 dark:text-slate-350 bg-slate-200 dark:bg-slate-850 px-2 py-0.5 rounded font-mono">
                              {chunk.source}
                            </span>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded">
                              {chunk.section}
                            </span>
                          </div>
                          
                          <span className={`px-2 py-0.5 rounded border ${
                            relevance >= 80 ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/25 border-emerald-200/50' : 
                            relevance >= 60 ? 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/25 border-amber-200/50' : 
                            'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/25 border-rose-200/50'
                          }`}>
                            Relevance: {relevance}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-2 border-indigo-500/50 pl-3">
                          "{highlightKeywords(chunk.text, searchQuery)}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 shadow-sm min-h-[450px] flex flex-col">
              {selectedPlaybook ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                        <Book className="h-4.5 w-4.5 text-indigo-500" />
                        {selectedPlaybook}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                        Source Document Viewer
                      </p>
                    </div>
                  </div>

                  {loadingContent ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                      Loading content...
                    </div>
                  ) : playbookContent ? (
                    <div className="flex-1 flex flex-col space-y-4">
                      {/* Markdown rendering preview */}
                      <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-850 overflow-y-auto max-h-[350px] text-left text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans">
                        {playbookContent.content || "Empty content."}
                      </div>

                      {/* Chunks display */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Indexed Chunks ({playbookContent.chunks?.length || 0})
                        </h5>
                        <div className="grid grid-cols-1 gap-2.5">
                          {playbookContent.chunks?.map((chunk: any) => (
                            <div key={chunk.id} className="p-3 rounded-lg border border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900/40 text-left space-y-1.5">
                              <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono">
                                  Section: {chunk.section}
                                </span>
                                <span className="font-mono text-slate-500">ID: {chunk.id}</span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-350 italic">
                                "{chunk.text}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                      No content loaded.
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                  <HelpCircle className="h-8 w-8 opacity-40 text-indigo-500" />
                  <span>Select or upload a playbook to view its sections.</span>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
