import assert from 'node:assert/strict';
import regionLpsExtra from '../src/data/region-lp-extra.json';
import regionLpsMain from '../src/data/region-lp.json';
import { BLOG_TOPIC_FAQ_QUESTIONS, detectTopicId, getBlogTopic } from '../src/data/blog-topics.ts';
import { buildRegionFaqs } from '../src/data/lp-faqs.ts';
import { buildAnswerFirstMarkdown, buildTopicFaqs, hasAnswerFirstBlock, rewriteInternalBlogHrefs, upsertAnswerFirstBlock } from '../src/lib/blog-aio-text.ts';
import { canonicalUrl, sameOriginPath } from '../src/lib/canonical-url.ts';
import { selectPostsForRegionLp } from '../src/lib/blog-lp-feed.ts';
import { includeInSitemap } from './sitemap-policy.ts';

assert.equal(detectTopicId('outo1'), 'vomit');
assert.equal(detectTopicId('outo3-2'), 'insurance');
assert.equal(detectTopicId('ranking-osaka-carclean'), 'ranking');
assert.equal(detectTopicId('sakananioi3'), 'fish');
assert.equal(detectTopicId('boxytoyu1'), 'kerosene');
assert.equal(detectTopicId('unknown-slug', '灯油をこぼした'), 'kerosene');
assert.equal(detectTopicId('childseat-yogore'), 'childseat');
assert.equal(detectTopicId('unknown-slug', 'チャイルドシートの下の汚れ'), 'childseat');
assert.equal(detectTopicId('unknown-slug', 'チャイルドシートに嘔吐'), 'vomit');

const topic = getBlogTopic('outo1');
assert.ok(topic.answer.includes('{regionFull}'));
assert.ok(topic.lpHeadings.some((item) => item.id === 'heading-emergency-first-aid'));

const block = buildAnswerFirstMarkdown({
  slug: 'outo1',
  title: '車内で嘔吐',
  regionFull: '大阪府',
  regionSlug: 'osaka'
});
assert.ok(block.includes('<!-- aio-answer-first -->'));
assert.ok(block.includes('## 結論（先に読む）'));
assert.ok(block.includes('大阪府'));
assert.ok(block.includes('/osaka/#heading-emergency-first-aid'));
assert.ok(block.includes('tel:070-8428-0866'));
assert.ok(block.includes('/contact/'));
assert.ok(block.includes('#heading-pricing'));

const withRelated = buildAnswerFirstMarkdown({
  slug: 'outo1',
  title: '車内で嘔吐',
  regionFull: '大阪府',
  regionSlug: 'osaka',
  relatedPosts: [{ href: '/blog/osaka/outo2/', label: 'やってはいけない嘔吐処理' }]
});
assert.ok(withRelated.includes('/blog/osaka/outo2/'));
assert.ok(withRelated.includes('今すぐ大阪府で依頼する'));

const rewritten = rewriteInternalBlogHrefs('/blog/fukuoka/outo3-2/', (slug, preferred) => {
  if (slug !== 'outo3-2') return null;
  if (preferred === 'fukuoka') return { region: 'osaka', slug: 'outo3-2' };
  return { region: 'osaka', slug: 'outo3-2' };
});
assert.equal(rewritten, '/blog/osaka/outo3-2/');

const keepDistinct = rewriteInternalBlogHrefs('/blog/fukuoka/outo3/', (slug) => {
  if (slug === 'outo3') return { region: 'fukuoka', slug: 'outo3' };
  if (slug === 'outo3-2') return { region: 'osaka', slug: 'outo3-2' };
  return null;
});
assert.equal(keepDistinct, '/blog/fukuoka/outo3/');

assert.equal(canonicalUrl('/osaka/#heading-pricing'), 'https://insbs.net/osaka/#heading-pricing');
assert.equal(canonicalUrl('/blog/osaka/outo1/'), 'https://insbs.net/blog/osaka/outo1/');

const once = upsertAnswerFirstBlock('本文のはじまり', block);
const twice = upsertAnswerFirstBlock(once, block);
assert.equal((twice.match(/## 結論（先に読む）/g) || []).length, 1);
assert.ok(hasAnswerFirstBlock(twice));
assert.ok(twice.includes('本文のはじまり'));

const fakePosts = [
  {
    id: 'osaka/new-post',
    data: {
      title: '新しい大阪記事',
      date: new Date('2026-09-01'),
      region: 'osaka',
      regionFull: '大阪府',
      draft: false,
      categories: []
    }
  },
  {
    id: 'fukuoka/outo1',
    data: {
      title: '福岡の嘔吐記事',
      date: new Date('2026-01-01'),
      region: 'fukuoka',
      regionFull: '福岡県',
      draft: false,
      categories: []
    }
  },
  {
    id: 'osaka/nara-case',
    data: {
      title: '奈良向け記事',
      date: new Date('2026-08-01'),
      region: 'osaka',
      regionFull: '奈良県',
      draft: false,
      categories: ['nara']
    }
  }
] ;

const osakaFeed = selectPostsForRegionLp(fakePosts, {
  regionSlug: 'osaka',
  regionName: '大阪',
  regionFull: '大阪府',
  limit: 8
});
assert.equal(osakaFeed[0].post.data.title, '新しい大阪記事');
assert.equal(osakaFeed[0].href, '/blog/osaka/new-post/');
assert.ok(osakaFeed.every((item) => item.href.startsWith('/blog/')));
assert.ok(!osakaFeed[0].href.includes('.md'));

const naraFeed = selectPostsForRegionLp(fakePosts, {
  regionSlug: 'nara',
  regionName: '奈良',
  regionFull: '奈良県',
  limit: 8
});
assert.equal(naraFeed[0].post.data.title, '奈良向け記事');
assert.equal(naraFeed[0].reason, 'regionFull');

const vomitFaqs = buildTopicFaqs({ slug: 'outo1', regionFull: '大阪府' });
assert.equal(vomitFaqs[0].q, '車で子どもが吐いたら最初に何をすればいい？');
assert.equal(vomitFaqs[0].a.includes('大阪府'), true);

const dontFaqs = buildTopicFaqs({ slug: 'outo2', regionFull: '滋賀県' });
assert.equal(dontFaqs[0].q, '車の嘔吐物処理でやってはいけないことは？');
assert.equal(dontFaqs[0].q, BLOG_TOPIC_FAQ_QUESTIONS['vomit-dont']);
for (const question of Object.values(BLOG_TOPIC_FAQ_QUESTIONS)) {
  assert.equal(question.includes('はどうすればいいですか'), false);
}

assert.equal(sameOriginPath('https://insbs.net/blog/fukuoka/outo2/'), '/blog/fukuoka/outo2/');
assert.equal(sameOriginPath('https://insbs.net/blog/fukuoka/outo2'), '/blog/fukuoka/outo2/');

assert.equal(includeInSitemap('https://insbs.net/blog/siga/outo2/'), false);
assert.equal(includeInSitemap('https://insbs.net/blog/fukuoka/outo2/'), true);
assert.equal(includeInSitemap('https://insbs.net/blog/osaka/outo1/'), true);

const regions = [...regionLpsMain, ...regionLpsExtra] as Array<{
  slug: string;
  regionName: string;
  regionFull: string;
}>;
for (const region of regions) {
  const faqs = buildRegionFaqs(region.regionName, region.regionFull, region.slug);
  const questions = faqs.map((faq) => faq.q);
  assert.equal(new Set(questions).size, questions.length, `${region.slug} duplicate question text`);
  assert.equal(questions.filter((question) => question.includes('料金')).length, 1, region.slug);
  assert.equal(questions.filter((question) => question.includes('保険')).length, 1, region.slug);
}

const osakaFaqs = buildRegionFaqs('大阪', '大阪府', 'osaka');
assert.equal(
  osakaFaqs.filter((faq) => faq.q.includes('料金')).map((faq) => faq.q).join(' / '),
  '大阪府内の出張車内清掃の料金目安は？'
);
const osakaPrice = osakaFaqs.find((faq) => faq.q.includes('料金'));
assert.ok(osakaPrice);
assert.match(osakaPrice.a, /24,000円/);
assert.match(osakaPrice.a, /29,000円/);
assert.match(osakaPrice.a, /38,000円/);
assert.match(osakaPrice.a, /26,000円/);
assert.match(osakaPrice.a, /32,000円/);
assert.match(osakaPrice.a, /42,000円/);
const osakaInsurance = osakaFaqs.find((faq) => faq.q.includes('保険'));
assert.ok(osakaInsurance);
assert.equal(osakaInsurance.q, '車内に灯油をこぼした場合、保険は使えますか？申請の流れは？');
assert.match(osakaInsurance.a, /個人賠償/);
assert.match(osakaInsurance.a, /車内清掃費用特約/);
assert.match(osakaInsurance.a, /30,000円/);
assert.match(osakaInsurance.a, /領収書/);
assert.equal((osakaInsurance.a.match(/車両保険（一般型）/g) || []).length, 1);
assert.equal((osakaInsurance.a.match(/個人賠償/g) || []).length, 1);

console.log('blog aio unit checks passed');
