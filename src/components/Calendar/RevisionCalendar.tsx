import React, { useMemo, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listRevisions } from '../../services/revisionApi';
import { QK } from '../../state/queryKeys';
import { AuthContext } from '../AuthContext';

interface RevisionCalendarProps {
    from: string;
    to: string;
}

export function RevisionCalendar({ from, to }: RevisionCalendarProps) {
    const { user } = useContext(AuthContext);
    const { data, isLoading } = useQuery({
        queryKey: QK.CAL_RANGE(from, to),
        queryFn: () => listRevisions(user?.id || '', { from, to, includePast: false }),
        enabled: !!user?.id
    });

    const days = useMemo(() => {
        const bucket: Record<string, any[]> = {};
        (data || []).forEach((i: any) => {
            const key = i.nextRevisionLocal || (i.nextRevisionDate || '').slice(0, 10);
            bucket[key] = bucket[key] || [];
            bucket[key].push(i);
        });
        return bucket;
    }, [data]);

    if (isLoading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading calendar...</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Revision Calendar</h2>
                <p className="text-sm text-gray-600 mt-1">
                    Your revision schedule from {from} to {to}
                </p>
            </div>

            <div className="p-6">
                {Object.keys(days).length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600">No revisions scheduled for this period.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-2">
                        {Object.entries(days).map(([date, items]) => (
                            <div key={date} className="border border-gray-200 rounded p-2 min-h-[80px]">
                                <div className="text-sm font-medium text-gray-900 mb-1">
                                    {new Date(date + 'T00:00:00').getDate()}
                                </div>
                                <div className="space-y-1">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 truncate">
                                            {item.itemType === 'problem' ? 'P' : 'L'}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
