import regionLpsExtra from './region-lp-extra.json';
import regionLpsMain from './region-lp.json';

export type ServiceRegion = {
  slug: string;
  regionName: string;
  regionFull: string;
  description: string;
};

type RegionRecord = {
  slug?: unknown;
  regionName?: unknown;
  regionFull?: unknown;
  layoutDescription?: unknown;
};

function asRegions(value: unknown): ServiceRegion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as RegionRecord;
    if (typeof row.slug !== 'string' || typeof row.regionFull !== 'string') return [];
    return [
      {
        slug: row.slug,
        regionName: typeof row.regionName === 'string' ? row.regionName : row.regionFull,
        regionFull: row.regionFull,
        description: typeof row.layoutDescription === 'string' ? row.layoutDescription : ''
      }
    ];
  });
}

/**
 * Prefectures that have a landing page. This is the service area, not the head office.
 * Order matches the LP JSON files. Duplicate prefecture names keep the first slug.
 */
export function listServiceRegions(): ServiceRegion[] {
  const seen = new Set<string>();
  const regions: ServiceRegion[] = [];
  for (const region of [...asRegions(regionLpsMain), ...asRegions(regionLpsExtra)]) {
    if (seen.has(region.regionFull)) continue;
    seen.add(region.regionFull);
    regions.push(region);
  }
  return regions;
}
