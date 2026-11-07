import type { ImageMetadata } from 'astro';
import logo from '../assets/images/logo.png';
import seatResult from '../assets/images/car_zaseki_pikapika.jpg';
import keroseneJob from '../assets/images/gasosut-251012-scaled.jpg';
import onSiteTeam from '../assets/images/車前-3人並び喜ぶ.jpg';
import { SITE_CANONICAL_ORIGIN } from '../data/site';

function publishedUrl(image: ImageMetadata): string {
  const src = image.src;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  const origin = SITE_CANONICAL_ORIGIN.replace(/\/$/, '');
  return `${origin}${src.startsWith('/') ? src : `/${src}`}`;
}

/** Header logo. Stable published URL after the image build. */
export const ORGANIZATION_LOGO_URL = publishedUrl(logo);

/** On-site crew photo used for the representative Person image. */
export const CREW_PHOTO_URL = publishedUrl(onSiteTeam);

/** Finished-job photos. These are the business images, not the favicon. */
export const WORK_PHOTO_URLS = [publishedUrl(seatResult), publishedUrl(keroseneJob)];
