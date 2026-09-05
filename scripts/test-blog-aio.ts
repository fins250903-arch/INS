import assert from 'node:assert/strict';
import { detectTopicId, getBlogTopic } from '../src/data/blog-topics.ts';
import { buildAnswerFirstMarkdown, hasAnswerFirstBlock, rewriteInternalBlogHrefs, upsertAnswerFirstBlock } from '../src/lib/blog-aio-text.ts';
import { selectPostsForRegionLp } from '../src/lib/blog-lp-feed.ts';

assert.equal(detectTopicId('outo1'), 'vomit');
assert.equal(detectTopicId('outo3-2'), 'insurance');
assert.equal(detectTopicId('ranking-osaka-carclean'), 'ranking');
assert.equal(detectTopicId('sakananioi3'), 'fish');
assert.equal(detectTopicId('boxytoyu1'), 'kerosene');
assert.equal(detectTopicId('unknown-slug', '灯油をこぼした'), 'kerosene');

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

console.log('blog aio unit checks passed');
