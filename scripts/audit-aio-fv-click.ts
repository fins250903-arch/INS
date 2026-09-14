/**
 * Click-intent audit: query tokens vs region title / keyword FV H1.
 * Simulates 100+ searcher scans (not live Google AIO).
 */
import regionMain from '../src/data/region-lp.json';
import regionExtra from '../src/data/region-lp-extra.json';
import { fillKeywordCopy, keywordLps } from '../src/data/keyword-lp';
import { regionLpLinks } from '../src/data/region-lp-links';

const TARGET_REGIONS = [
  '東京都',
  '神奈川県',
  '埼玉県',
  '茨城県',
  '千葉県',
  '愛知県',
  '三重県',
  '岐阜県',
  '静岡県',
  '大阪府',
  '京都府',
  '兵庫県',
  '奈良県',
  '滋賀県',
  '福岡県',
  '佐賀県',
  '沖縄県'
];

const QUERIES = [
  '車内で嘔吐 清掃',
  '車内 ゲロ 掃除',
  '車 嘔吐 クリーニング',
  '車内 灯油 消し方',
  '車 おもらし クリーニング',
  '車 ペット 粗相 清掃'
];

type RegionRow = { slug: string; regionName: string; regionFull: string; layoutTitle: string; layoutDescription: string };

const regions = [...regionExtra, ...regionMain] as RegionRow[];

function tokens(query: string): string[] {
  return query.split(/\s+/).filter(Boolean);
}

function score(text: string, query: string): { score: number; hits: string[] } {
  const hits = tokens(query).filter((token) => text.includes(token));
  return { score: hits.length, hits };
}

const rows: {
  n: number;
  region: string;
  query: string;
  surface: string;
  url: string;
  text: string;
  score: number;
  max: number;
  click: 'yes' | 'maybe' | 'no';
}[] = [];

let n = 0;
for (const prefecture of TARGET_REGIONS) {
  const region = regions.find((row) => row.regionFull === prefecture);
  if (!region) continue;
  const inMatrix = regionLpLinks.some((link) => link.slug === region.slug);

  for (const query of QUERIES) {
    n += 1;
    const regionScan = `${region.layoutTitle} ${region.layoutDescription} ${region.regionName}｜車内の嘔吐・ゲロ掃除`;
    const regionScore = score(regionScan, query);
    rows.push({
      n,
      region: prefecture,
      query,
      surface: 'region-lp',
      url: `/${region.slug}/`,
      text: region.layoutTitle,
      score: regionScore.score,
      max: tokens(query).length,
      click: regionScore.score >= 2 ? 'yes' : regionScore.score === 1 ? 'maybe' : 'no'
    });

    if (!inMatrix) continue;
    const vomit = keywordLps.find((kw) => kw.slug === 'shanai-outo');
    if (!vomit) continue;
    n += 1;
    const h1 = fillKeywordCopy(vomit.fvCopy, region.regionName, region.regionFull);
    const title = fillKeywordCopy(vomit.pageTitle ?? vomit.fvCopy, region.regionName, region.regionFull);
    const vomitScore = score(`${title} ${h1} ${vomit.keyword}`, query);
    rows.push({
      n,
      region: prefecture,
      query,
      surface: 'keyword-shanai-outo',
      url: `/${region.slug}/shanai-outo/`,
      text: title,
      score: vomitScore.score,
      max: tokens(query).length,
      click: vomitScore.score >= 2 ? 'yes' : vomitScore.score === 1 ? 'maybe' : 'no'
    });
  }
}

const yes = rows.filter((row) => row.click === 'yes').length;
const maybe = rows.filter((row) => row.click === 'maybe').length;
const no = rows.filter((row) => row.click === 'no').length;
const vomitQuery = rows.filter((row) => row.query === '車内で嘔吐 清掃');
const vomitYes = vomitQuery.filter((row) => row.click === 'yes').length;

console.log(`audited=${rows.length} clickYes=${yes} maybe=${maybe} no=${no}`);
console.log(`vomitQuery=${vomitQuery.length} clickYes=${vomitYes}`);
console.log(`keywordPages=${regionLpLinks.length}x${keywordLps.length}=${regionLpLinks.length * keywordLps.length}`);
console.log('--- sample 車内で嘔吐 清掃 ---');
for (const row of vomitQuery.slice(0, 8)) {
  console.log(`${row.surface} ${row.url} [${row.click}] ${row.score}/${row.max} ${row.text}`);
}
