const SCHEMA_CONTEXT = 'https://schema.org';

/** ノードごとの @context を除き、単一 @graph ドキュメントにまとめる */
export function buildJsonLdGraph(
  nodes: Record<string, unknown>[]
): Record<string, unknown> {
  const graph = nodes.map((node) => {
    const { '@context': _ctx, ...rest } = node;
    return rest;
  });
  return {
    '@context': SCHEMA_CONTEXT,
    '@graph': graph
  };
}
