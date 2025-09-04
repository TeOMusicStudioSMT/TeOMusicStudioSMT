
import React, { useState, useMemo } from 'react';
import { useContent } from '../../hooks/useContent';
import { Artist } from '../../types';
import { getTrendAnalysis, getArtistRecommendation, scanContentForViolations, generateWeeklyReport, MockAnalytics } from '../../services/geminiService';
import toast from 'react-hot-toast';
import { BrainCircuitIcon } from '../../components/icons';

const Section: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-brand-bg p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        <div>{children}</div>
    </div>
);

const AdminContentManagerPage: React.FC = () => {
    const { artists, news } = useContent();

    const [trends, setTrends] = useState<{title: string, summary: string}[] | null>(null);
    const [trendError, setTrendError] = useState('');
    const [isTrendLoading, setIsTrendLoading] = useState(false);
    
    const [recommendation, setRecommendation] = useState('');
    const [recommendationError, setRecommendationError] = useState('');
    const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
    const [selectedArtistId, setSelectedArtistId] = useState<string>(artists.length > 0 ? artists[0].id : '');
    const [selectedTrendIndex, setSelectedTrendIndex] = useState(0);

    const [moderationResults, setModerationResults] = useState<{item: string, result: {violation: boolean, reason: string}}[]>([]);
    const [moderationError, setModerationError] = useState('');
    const [isModerationLoading, setIsModerationLoading] = useState(false);
    
    const [report, setReport] = useState('');
    const [reportError, setReportError] = useState('');
    const [isReportLoading, setIsReportLoading] = useState(false);

    const mockAnalytics = useMemo((): MockAnalytics => {
        const topArtists = [...artists].sort((a,b) => b.discography.length - a.discography.length).slice(0, 3).map(a => ({ name: a.name, streams: Math.floor(Math.random() * 50000) + 10000 }));
        const genres = [...new Set(artists.map(a => a.genre))];
        let genreDistribution = genres.map(g => ({ genre: g, percentage: Math.floor(Math.random() * 25) + 5 }));
        const totalPercentage = genreDistribution.reduce((sum, g) => sum + g.percentage, 0);
        genreDistribution = genreDistribution.map(g => ({ ...g, percentage: Math.round((g.percentage / totalPercentage) * 100)}));

        return {
            totalStreams: Math.floor(Math.random() * 1000000) + 500000,
            topArtists,
            genreDistribution,
        };
    }, [artists]);
    
    const handleAnalyzeTrends = async () => {
        setIsTrendLoading(true);
        setTrendError('');
        try {
            const result = await getTrendAnalysis(mockAnalytics);
            setTrends(result);
            toast.success("Trend analysis complete!");
        } catch (e: any) {
            setTrendError(e.message);
            toast.error(e.message);
        } finally {
            setIsTrendLoading(false);
        }
    };

    const handleGenerateRecommendation = async () => {
        if (!selectedArtistId || !trends) return;
        const artist = artists.find(a => a.id === selectedArtistId);
        const trend = trends[selectedTrendIndex];
        if (!artist || !trend) return;
        
        setIsRecommendationLoading(true);
        setRecommendationError('');
        try {
            const result = await getArtistRecommendation(artist, trend);
            setRecommendation(result);
        } catch (e: any) {
            setRecommendationError(e.message);
            toast.error(e.message);
        } finally {
            setIsRecommendationLoading(false);
        }
    };
    
    const contentToScan = useMemo(() => [
        { type: 'Artist Bio', content: artists.find(a => a.id === 'nyx')?.bio || '', id: 'nyx_bio' },
        { type: 'News Summary', content: news[0]?.summary || '', id: 'news_0_summary' },
        { type: 'Artist Bio', content: artists.find(a => a.id === 'kael')?.bio || '', id: 'kael_bio' }
    ], [artists, news]);

    const handleScanContent = async () => {
        setIsModerationLoading(true);
        setModerationError('');
        setModerationResults([]);
        try {
            const promises = contentToScan.map(item => scanContentForViolations(item.content, item.type));
            const results = await Promise.all(promises);
            setModerationResults(results.map((res, index) => ({ item: `${contentToScan[index].type}: "${contentToScan[index].content.substring(0, 40)}..."`, result: res })));
            toast.success("Content scan complete.");
        } catch (e: any) {
            setModerationError(e.message);
            toast.error(e.message);
        } finally {
            setIsModerationLoading(false);
        }
    };

    const handleGenerateReport = async () => {
        setIsReportLoading(true);
        setReportError('');
        try {
            const result = await generateWeeklyReport(mockAnalytics);
            setReport(result);
        } catch (e: any) {
            setReportError(e.message);
            toast.error(e.message);
        } finally {
            setIsReportLoading(false);
        }
    };


    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3"><BrainCircuitIcon className="w-8 h-8 text-brand-primary"/>Content Manager AI</h1>
            <p className="text-brand-text-secondary mb-8 max-w-3xl">This engine uses AI to monitor content, identify trends, and provide recommendations for managing the S.M.T. platform. All data shown here is a simulation for demonstration purposes.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1 */}
                <div className="space-y-8">
                    <Section title="1. Trend Monitoring">
                        <button onClick={handleAnalyzeTrends} disabled={isTrendLoading} className="bg-brand-primary text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">
                            {isTrendLoading ? 'Analyzing...' : 'Analyze Platform Trends'}
                        </button>
                        {trendError && <p className="text-red-400 text-sm mt-2">{trendError}</p>}
                        {trends && (
                            <div className="mt-4 space-y-3">
                                {trends.map((trend, index) => (
                                    <div key={index} className="bg-brand-surface p-3 rounded-md">
                                        <h4 className="font-bold text-white">{trend.title}</h4>
                                        <p className="text-sm">{trend.summary}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                     <Section title="2. Personalized Recommendations">
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                               <select value={selectedArtistId} onChange={e => setSelectedArtistId(e.target.value)} className="input-field">
                                   {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                               </select>
                               <select value={selectedTrendIndex} onChange={e => setSelectedTrendIndex(Number(e.target.value))} className="input-field" disabled={!trends}>
                                   {trends ? trends.map((t, i) => <option key={i} value={i}>{t.title}</option>) : <option>Run analysis first</option>}
                               </select>
                           </div>
                           <button onClick={handleGenerateRecommendation} disabled={!trends || isRecommendationLoading} className="bg-brand-primary text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">
                               {isRecommendationLoading ? 'Generating...' : 'Generate Recommendation'}
                           </button>
                           {recommendationError && <p className="text-red-400 text-sm mt-2">{recommendationError}</p>}
                           {recommendation && (
                               <div className="bg-brand-surface p-3 rounded-md mt-4">
                                   <p className="text-sm italic">{recommendation}</p>
                               </div>
                           )}
                        </div>
                    </Section>
                </div>

                {/* Column 2 */}
                 <div className="space-y-8">
                    <Section title="3. Content Moderation">
                        <button onClick={handleScanContent} disabled={isModerationLoading} className="bg-brand-primary text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">
                           {isModerationLoading ? 'Scanning...' : 'Scan For Violations'}
                        </button>
                        {moderationError && <p className="text-red-400 text-sm mt-2">{moderationError}</p>}
                        {moderationResults.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {moderationResults.map((item, index) => (
                                    <div key={index} className={`p-3 rounded-md ${item.result.violation ? 'bg-red-900/50 border border-red-700' : 'bg-green-900/30'}`}>
                                        <p className="text-xs text-brand-text-secondary">{item.item}</p>
                                        {item.result.violation ? (
                                            <>
                                                <p className="text-sm font-bold text-red-400">Violation Flagged</p>
                                                <p className="text-xs text-red-300">Reason: {item.result.reason}</p>
                                            </>
                                        ) : (
                                            <p className="text-sm font-bold text-green-400">No violations detected.</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>
                    <Section title="4. Reporting">
                        <button onClick={handleGenerateReport} disabled={isReportLoading} className="bg-brand-primary text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">
                           {isReportLoading ? 'Generating...' : 'Generate Weekly Report'}
                        </button>
                        {reportError && <p className="text-red-400 text-sm mt-2">{reportError}</p>}
                        {report && (
                            <pre className="mt-4 bg-brand-dark p-4 rounded-md text-sm text-white whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                                {report}
                            </pre>
                        )}
                    </Section>
                 </div>
            </div>
             <style>{`.input-field {
                background-color: #242038;
                border-radius: 0.5rem;
                padding: 0.5rem 0.75rem;
                color: white;
                border: 1px solid #1A1625;
            }`}</style>
        </div>
    );
};

export default AdminContentManagerPage;
