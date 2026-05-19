const HOST_REGION: Record<string, string> = {
  osak: 'osaka',
  hyg: 'hyougo',
  siga: 'siga'
};

const PATH_REGIONS = new Set(['osaka', 'hyougo', 'siga']);

export function resolveWp1Region(host: string, path: string): { region: string; rest: string } {
  const normalizedHost = host.toLowerCase();

  for (const [needle, slug] of Object.entries(HOST_REGION)) {
    if (normalizedHost.includes(needle)) {
      return { region: slug, rest: path };
    }
  }

  const segments = path.split('/').filter(Boolean);
  const [first, ...rest] = segments;
  if (first && PATH_REGIONS.has(first)) {
    return { region: first, rest: rest.join('/') };
  }

  return { region: 'osaka', rest: path };
}
