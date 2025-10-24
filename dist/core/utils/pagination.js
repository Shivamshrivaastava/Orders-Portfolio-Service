/* eslint-disable @typescript-eslint/no-explicit-any */
export function parsePagination(query) {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 20) || 20));
    return { page, pageSize };
}
