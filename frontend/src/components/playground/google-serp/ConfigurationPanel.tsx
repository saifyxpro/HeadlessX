
import { Search, Globe, Languages, ArrowRight, Loader2 } from 'lucide-react';
import { UserIcon } from '@hugeicons/core-free-icons';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { Profile } from './types';

interface ConfigurationPanelProps {
    query: string;
    setQuery: (query: string) => void;
    selectedProfileId: string;
    setSelectedProfileId: (id: string) => void;
    timeout: number;
    setTimeout: (timeout: number) => void;
    profiles: Profile[];
    onSearch: (e?: React.FormEvent) => void;
    isLoading: boolean;
}

export function ConfigurationPanel({
    query,
    setQuery,
    selectedProfileId,
    setSelectedProfileId,
    timeout,
    setTimeout,
    profiles,
    onSearch,
    isLoading
}: ConfigurationPanelProps) {
    return (
        <div className="lg:col-span-4 space-y-6">
            {/* Main Configuration Card */}
            <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-8 border border-white/60 shadow-premium">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <Search className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Search Config</h2>
                        <p className="text-xs font-medium text-slate-400">Configure your Google search</p>
                    </div>
                </div>

                <form onSubmit={onSearch} className="space-y-6">
                    {/* Search Query */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Search Query</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g., 'best headphones 2026' or 'site:twitter.com ai'"
                                className="w-full pl-11 pr-4 py-4 bg-white/50 border border-white/60 rounded-2xl text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Profile Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Browser Profile</label>
                        <CustomDropdown
                            value={selectedProfileId}
                            onChange={setSelectedProfileId}
                            placeholder="Fresh Session (No Profile)"
                            icon={UserIcon}
                            options={[
                                { value: '', label: 'Fresh Session (No Profile)' },
                                ...profiles
                                    .filter(p => p.name !== 'Default Profile') // Filter out the internal system default
                                    .map((profile) => ({
                                        value: profile.id,
                                        label: `${profile.name} (${profile.screen_width}x${profile.screen_height})`,
                                        suffix: profile.is_running ? '●' : undefined
                                    }))
                            ]}
                        />
                        <p className="text-[10px] text-slate-400 px-1 leading-relaxed">
                            Select "Fresh Session" for a clean, incognito-like environment, or choose a saved profile to use persistent cookies and history.
                        </p>
                    </div>

                    {/* Region & Language (Visual placeholders for now as per minimal implementation) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 opacity-50 cursor-not-allowed" title="Coming soon">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Region</label>
                            <div className="w-full flex items-center gap-2 px-4 py-3 bg-white/30 border border-white/50 rounded-xl text-slate-400 text-sm font-medium">
                                <Globe className="w-4 h-4" />
                                <span>Global (US)</span>
                            </div>
                        </div>
                        <div className="space-y-2 opacity-50 cursor-not-allowed" title="Coming soon">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Language</label>
                            <div className="w-full flex items-center gap-2 px-4 py-3 bg-white/30 border border-white/50 rounded-xl text-slate-400 text-sm font-medium">
                                <Languages className="w-4 h-4" />
                                <span>English (en)</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeout Configuration */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Browser Timeout (Seconds)</label>
                            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{timeout}s</span>
                        </div>
                        <div className="relative group">
                            <input
                                type="range"
                                min="30"
                                max="120"
                                step="10"
                                value={timeout}
                                onChange={(e) => setTimeout(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 px-1 mt-1 font-medium">
                                <span>30s</span>
                                <span>60s</span>
                                <span>90s</span>
                                <span>120s</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        type="submit"
                        disabled={!query.trim() || isLoading}
                        className="w-full mt-4 group relative px-6 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden active:scale-[0.98]"
                    >
                        <div className="relative z-10 flex items-center justify-center gap-2">
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                                    <span>Searching...</span>
                                </>
                            ) : (
                                <>
                                    <span className="group-hover:mr-1 transition-all">Run Search</span>
                                    <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </div>
                        {/* Shimmer effect */}
                        {!isLoading && (
                            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
