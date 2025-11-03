/**
 * METRICS JOB STATUS WIDGET
 * 
 * Widget showing metrics job status with manual trigger button.
 */

import React, { useState, useEffect } from 'react';
import { Play, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { apiClient } from '../../utils/apis';

interface JobStatus {
    key: string;
    lastRun: string | null;
    durationMs: number | null;
    ok: boolean;
    note: string | null;
}

const MetricsJobStatusWidget: React.FC = () => {
    const [status, setStatus] = useState<JobStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = async () => {
        try {
            setError(null);
            const response = await apiClient.getMetricsJobStatus();
            if (response.success) {
                setStatus(response.data);
            } else {
                setError('Failed to fetch job status');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const runJob = async () => {
        try {
            setRunning(true);
            setError(null);
            const response = await apiClient.runMetricsJob();

            if (response.success && response.data.ok) {
                // Refetch status after successful run
                await fetchStatus();
            } else {
                setError(response.data.error || 'Job failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setRunning(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const formatLastRun = (lastRun: string | null): string => {
        if (!lastRun) return 'Never';

        const date = new Date(lastRun);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else {
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            return diffMinutes < 1 ? 'Just now' : `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        }
    };

    const formatDuration = (durationMs: number | null): string => {
        if (!durationMs) return 'N/A';

        if (durationMs < 1000) {
            return `${durationMs}ms`;
        } else {
            return `${(durationMs / 1000).toFixed(1)}s`;
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-center">
                    <Loader className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="ml-2 text-sm text-gray-600">Loading job status...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4" aria-live="polite">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Metrics Job</h3>
                <button
                    onClick={runJob}
                    disabled={running}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Run metrics job now"
                >
                    {running ? (
                        <Loader className="h-3 w-3 animate-spin" />
                    ) : (
                        <Play className="h-3 w-3" />
                    )}
                    {running ? 'Running...' : 'Run Now'}
                </button>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Run:</span>
                    <span className="font-medium">{formatLastRun(status?.lastRun || null)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{formatDuration(status?.durationMs || null)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <div className="flex items-center gap-1">
                        {status?.ok ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`font-medium ${status?.ok ? 'text-green-600' : 'text-red-600'}`}>
                            {status?.ok ? 'OK' : 'Failed'}
                        </span>
                    </div>
                </div>

                {status?.note && (
                    <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                        {status.note}
                    </div>
                )}

                {error && (
                    <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">
                        Error: {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MetricsJobStatusWidget;
