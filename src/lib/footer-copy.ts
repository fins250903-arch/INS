export type FooterRegionProps = {
  regionName?: string;
  regionFull?: string;
};

export type FooterCopy = { tagline: string; intro: string; area: string };

/** フッター見出し用に都道府県名を短くしたラベル（例: 宮城県→宮城） */
export function shortRegionLabel(full: string): string {
  if (full === '北海道') return '北海道';
  if (full === '東京都') return '東京';
  return full.replace(/(都|府|県|道)$/, '') || full;
}

export function resolveFooterCopy(props: FooterRegionProps): FooterCopy {
  const regionFull = props.regionFull?.trim();
  const regionName = (props.regionName ?? (regionFull ? shortRegionLabel(regionFull) : '')).trim();

  if (regionFull === '大阪府') {
    return {
      tagline: '大阪の出張車内クリーニング専門店',
      intro:
        '大阪府内全域をカバーする、出張車内清掃のプロフェッショナル。365日24時間受付中。最短即日訪問で、お客様の愛車を新車の輝きへ。',
      area:
        '大阪市内はもちろん北摂から泉州まで、大阪府内全域に対応。お電話で郵便番号をお伺いし、最短でお伺いできるスタッフを手配します。'
    };
  }

  if (regionFull === '沖縄県') {
    return {
      tagline: '沖縄本島の出張車内クリーニング専門店',
      intro:
        '沖縄本島エリアの出張車内清掃に対応しています。石垣島・宮古島など離島への出張は承っておりません。365日24時間受付、最短即日訪問でお客様の愛車をリセットいたします。',
      area:
        '対応は沖縄本島に限ります。離島へは出張いたしません。詳細はお電話で郵便番号をお伺いのうえご案内いたします。'
    };
  }

  if (regionFull && regionName) {
    return {
      tagline: `${regionName}の出張車内クリーニング専門店`,
      intro: `${regionFull}エリアの出張車内清掃に対応。365日24時間受付中。最短即日訪問で、お客様の愛車を新車の輝きへ。`,
      area: `${regionFull}内の対応可否・詳細エリアは、お電話で郵便番号をお伺いのうえご案内いたします。最短でお伺いできるスタッフを手配します。`
    };
  }

  return {
    tagline: '出張車内クリーニング専門店',
    intro:
      '出張車内清掃のプロがお伺いします。365日24時間受付中。お急ぎの際もお電話にてご相談ください。',
    area:
      'ご希望地域の対応可否・詳細は、お電話またはメールにてお問い合わせください。郵便番号をお伺いのうえ、最短で手配いたします。'
  };
}
