export const QK = {
    REVISION_LIST: (from?: string, to?: string) => ['revision:list', from || 'none', to || 'none'],
    CAL_RANGE: (from: string, to: string) => ['calendar:range', from, to],
    TODAY: () => ['revision:today'],
};
