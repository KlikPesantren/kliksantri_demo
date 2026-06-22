function parsePagination(query, { defaultLimit = 50, maxLimit = 200 } = {}) {
  const hasPagingParams = query.limit != null || query.offset != null;

  if (!hasPagingParams) {
    return { hasPagingParams: false, limit: null, offset: null };
  }

  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || defaultLimit, 1),
    maxLimit,
  );
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);

  return { hasPagingParams: true, limit, offset };
}

function buildPaginationResponse({ hasPagingParams, limit, offset, total, rowCount }) {
  if (!hasPagingParams) {
    return {
      limit: rowCount,
      offset: 0,
      total,
    };
  }

  return {
    limit,
    offset,
    total,
  };
}

module.exports = {
  parsePagination,
  buildPaginationResponse,
};
