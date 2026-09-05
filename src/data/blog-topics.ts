/**
 * AIO (Answer Engine Optimization) topic map for blog posts.
 * Used for Answer-First openings, related-article linking, and LP heading deep-links.
 */

export type LpHeadingId =
  | 'heading-what-is'
  | 'heading-emergency-first-aid'
  | 'heading-emergency-vomit'
  | 'heading-emergency-kerosene'
  | 'heading-emergency-pet'
  | 'heading-insurance-matrix'
  | 'heading-compare-outreach'
  | 'heading-regional-cases'
  | 'heading-areas'
  | 'heading-faq'
  | 'heading-flow'
  | 'heading-pricing'
  | 'heading-blog-list'
  | 'heading-voices'
  | 'heading-worries';

export type BlogTopicId =
  | 'vomit'
  | 'vomit-dont'
  | 'insurance'
  | 'smell'
  | 'urine'
  | 'pet'
  | 'tobacco'
  | 'ozone'
  | 'fish'
  | 'coffee'
  | 'kerosene'
  | 'mice'
  | 'ranking'
  | 'diy'
  | 'seatbelt'
  | 'floor'
  | 'feces'
  | 'cupmen'
  | 'mold'
  | 'leather'
  | 'window'
  | 'carwash'
  | 'outreach'
  | 'milk'
  | 'oil'
  | 'general';

export type LpHeadingLink = {
  id: LpHeadingId;
  label: string;
};

export type BlogTopic = {
  id: BlogTopicId;
  label: string;
  /** Answer-first paragraph. `{regionFull}` is replaced at render time. */
  answer: string;
  bullets: string[];
  lpHeadings: LpHeadingLink[];
  relatedSlugs: string[];
  keywords: string[];
};

export const LP_HEADING_CATALOG: Record<LpHeadingId, string> = {
  'heading-what-is': '出張車内清掃とは',
  'heading-emergency-first-aid': '嘔吐・灯油・ペット粗相の応急処置',
  'heading-emergency-vomit': '嘔吐が起きた直後にやること',
  'heading-emergency-kerosene': '灯油こぼしの直後にやること',
  'heading-emergency-pet': 'ペット粗相の直後にやること',
  'heading-insurance-matrix': '車内清掃費用と保険の判断目安',
  'heading-compare-outreach': '出張・店舗持込・自分で掃除の比較',
  'heading-regional-cases': '地域の施工・解説記事',
  'heading-areas': '出張対応エリア',
  'heading-faq': 'よくある質問',
  'heading-flow': 'ご依頼までの流れ',
  'heading-pricing': '出張車内清掃の料金表',
  'heading-blog-list': '投稿ブログ一覧',
  'heading-voices': 'お客様の声',
  'heading-worries': 'よくあるお悩み'
};

const H = (id: LpHeadingId): LpHeadingLink => ({
  id,
  label: LP_HEADING_CATALOG[id]
});

export const BLOG_TOPICS: Record<BlogTopicId, BlogTopic> = {
  vomit: {
    id: 'vomit',
    label: '車内嘔吐',
    answer:
      '車内嘔吐は、こすらず固形分を取り除き、市販の消臭スプレーは使わず、4日以内に温水吸引でシート内部まで洗浄するのが最短です。{regionFull}では駐車場完結の出張清掃（軽自動車22,000円〜・税込）で対応できます。',
    bullets: [
      'ゴム手袋＋ペーパーで「広げず」吸い取る',
      '芳香剤・塩素系は臭いの固定化につながる',
      '4日を超えるとウレタン内部への染み込みリスクが急上昇する'
    ],
    lpHeadings: [H('heading-emergency-first-aid'), H('heading-emergency-vomit'), H('heading-pricing')],
    relatedSlugs: ['outo1', 'outo2', 'outo3-2', 'seatbeltwash', 'ky1'],
    keywords: ['車内嘔吐', 'ゲロ掃除', '乗り物酔い', '出張車内清掃']
  },
  'vomit-dont': {
    id: 'vomit-dont',
    label: '嘔吐物処理の注意',
    answer:
      '嘔吐物処理でやってはいけないのは、強い摩擦・熱湯・塩素系漂白・消臭スプレーの上塗りです。感染症リスクを下げつつ汚れを広げないことが先で、取れない臭いとシミは{regionFull}の出張洗浄へ回すのが安全側です。',
    bullets: [
      'こすると繊維の奥へ押し込む',
      'ノロ等が疑われる場合は使い捨ての手袋と袋を使う',
      '表面がきれいに見えても内部の臭いが残ることが多い'
    ],
    lpHeadings: [H('heading-emergency-first-aid'), H('heading-compare-outreach'), H('heading-pricing')],
    relatedSlugs: ['outo2', 'outo1', 'outo3-2', 'seatbeltwash'],
    keywords: ['嘔吐物処理', 'やってはいけない', 'ノロウイルス']
  },
  insurance: {
    id: 'insurance',
    label: '個人賠償・車両保険',
    answer:
      '他人の車を汚した場合は相手または自分の個人賠償責任保険、自分の車なら車両保険（一般型）や車内清掃費用特約が使えることがあります。清掃前の写真保存と保険会社確認が先で、{regionFull}では見積書・領収書の発行に対応します。',
    bullets: [
      '撮影→保険会社へ連絡→見積、の順がトラブルになりにくい',
      '免責金額未満は自己負担になりやすい',
      '他人の子どもが嘔吐したケースは個人賠償の相談が多い'
    ],
    lpHeadings: [H('heading-insurance-matrix'), H('heading-pricing'), H('heading-faq')],
    relatedSlugs: ['outo3-2', 'outo3', 'sienta-baisyou-0en', 'un', 'outo1'],
    keywords: ['個人賠償責任保険', '車両保険', '車内清掃費用']
  },
  smell: {
    id: 'smell',
    label: '車内の臭い',
    answer:
      '拭いても戻る車内臭の正体は、シート内部のタンパク質汚れと雑菌です。芳香剤は混ざり臭を作るだけで、原因を温水吸引で吸い出す必要があります。{regionFull}の出張清掃では天井〜フロアまで発生源から処理します。',
    bullets: [
      '表面拭きだけでは菌の温床が残る',
      '水分の取り残しは生乾き臭・カビの原因になる',
      'エアコン臭はエバポレーター側の確認も必要'
    ],
    lpHeadings: [H('heading-compare-outreach'), H('heading-pricing'), H('heading-what-is')],
    relatedSlugs: ['no1', 'nioi1', 'jd1', 'ozon1', 'diy3'],
    keywords: ['車内消臭', '生活臭', '食べこぼし臭']
  },
  urine: {
    id: 'urine',
    label: 'おしっこ・尿臭',
    answer:
      '車内のおしっこは、表面を拭いただけではアンモニア臭が戻りやすいです。塩素系は使わず、吸い取り→中和→内部吸引が基本です。{regionFull}では座席・フロアの染み込みに出張洗浄で対応します。',
    bullets: [
      'タオルで吸い取り、こすらない',
      '塩素系漂白剤はシート劣化と臭い固定の原因',
      'レザー・ファブリックで手順が変わる'
    ],
    lpHeadings: [H('heading-emergency-pet'), H('heading-insurance-matrix'), H('heading-pricing')],
    relatedSlugs: ['nyou', 'siko', 'dgog2', 'un', 'outo1'],
    keywords: ['車内おしっこ', '尿臭', 'おもらし']
  },
  pet: {
    id: 'pet',
    label: 'ペット粗相・獣臭',
    answer:
      'ペットの嘔吐・尿・獣臭は、毛の除去だけでは終わりません。酵素洗浄と吸引、必要ならオゾンを組み合わせます。{regionFull}では立会不要の駐車場施工が可能です。',
    bullets: [
      '固形分を先に除去し、尿は吸い取る',
      '市販スプレーの重ねがけは獣臭を閉じ込める',
      '大型犬の尿はシート奥まで体重をかけて吸引する'
    ],
    lpHeadings: [H('heading-emergency-pet'), H('heading-emergency-first-aid'), H('heading-pricing')],
    relatedSlugs: ['siko', 'dgog2', 'gorudendog1', 'pettoouto2', 'ozon1'],
    keywords: ['ペット粗相', '犬臭', 'ペット嘔吐']
  },
  tobacco: {
    id: 'tobacco',
    label: 'タバコ・ヤニ',
    answer:
      'タバコ臭と天井のヤニは、芳香剤では消えません。天井・内張り・エアコン経路まで油膜を分解して拭き取る必要があります。{regionFull}の出張施工では売却前のヤニ取り相談も多いです。',
    bullets: [
      '天井の黄ばみは油膜なので水拭きだけでは落ちにくい',
      'シートと天井を同時に処理しないと臭いが戻る',
      '査定前の清掃は「ドアを開けた瞬間の空気」が残りやすい'
    ],
    lpHeadings: [H('heading-compare-outreach'), H('heading-pricing'), H('heading-voices')],
    relatedSlugs: ['taba1', 'tabccoyani', 'tabccoyani2', 'tabccoyani3', 'no1'],
    keywords: ['タバコ臭', 'ヤニ取り', '天井ヤニ']
  },
  ozone: {
    id: 'ozone',
    label: 'オゾン脱臭',
    answer:
      'オゾン脱臭は分子レベルの臭い分解に有効ですが、汚れの塊が残ったままでは効果が落ちます。先に洗浄・吸引し、仕上げにオゾンを使うのが順です。{regionFull}ではペット臭・タバコ臭の併用施工が中心です。',
    bullets: [
      '家庭用と業務用では発生量と施工時間が違う',
      '汚れを残したオゾンは再発しやすい',
      '施工後の換気が必要'
    ],
    lpHeadings: [H('heading-compare-outreach'), H('heading-pricing'), H('heading-faq')],
    relatedSlugs: ['ozon1', 'no1', 'siko', 'taba1'],
    keywords: ['オゾン脱臭', '業務用オゾン', 'ペット臭']
  },
  fish: {
    id: 'fish',
    label: '魚臭・海鮮汁',
    answer:
      '魚の汁やオキアミの臭いはアルカリと酸の中和が先で、芳香剤は逆効果です。フロアマット下まで届いている場合は家庭では取り切れません。{regionFull}では買い物帰り・釣りの帰りの相談に出張対応します。',
    bullets: [
      'こぼしたらすぐ吸い取り、こすらない',
      'お酢や重曹は初動向き、奥染みは吸引が必要',
      '夏場の湿気で生臭さが戻りやすい'
    ],
    lpHeadings: [H('heading-emergency-first-aid'), H('heading-pricing'), H('heading-compare-outreach')],
    relatedSlugs: ['sakananioi1', 'sakananioi3', 'okiami', 'ksc', 'kanisiru1'],
    keywords: ['魚臭', '生臭さ', 'オキアミ']
  },
  coffee: {
    id: 'coffee',
    label: 'コーヒー・飲みこぼし',
    answer:
      'コーヒー染みは酸性の色素汚れです。熱湯は定着を早め、ゴシゴシは繊維の奥へ押し込みます。ぬるま湯と中和、早めの吸引が基本です。{regionFull}では通勤中のこぼしを駐車場で処理できます。',
    bullets: [
      '熱を加えない',
      'アルカリ（セスキ等）で中和してから吸い取る',
      'シートレールまで流れたら家庭では限界'
    ],
    lpHeadings: [H('heading-compare-outreach'), H('heading-pricing'), H('heading-worries')],
    relatedSlugs: ['cof1', '100kinnkohi', '100kincoffee', 'passocoffee', 'j1'],
    keywords: ['コーヒー染み', '飲みこぼし', '100均']
  },
  kerosene: {
    id: 'kerosene',
    label: '灯油こぼし',
    answer:
      '車内の灯油は火気厳禁です。全ドア開放で換気し、液体をこすらず吸い取り、残臭は専門の灯油洗浄が必要です。{regionFull}では1席あたり税込30,000円目安の灯油専用洗浄に対応します。',
    bullets: [
      '火気厳禁・すぐに換気する',
      '新聞紙や布で吸い取り、こすらない',
      'フロア下・断熱材まで達すると家庭では取れない'
    ],
    lpHeadings: [H('heading-emergency-kerosene'), H('heading-emergency-first-aid'), H('heading-pricing')],
    relatedSlugs: ['tt1', 'boxytoyu', 'boxytoyu1', '1l5', 'saitamaseren'],
    keywords: ['灯油こぼし', '灯油臭', 'ポリタンク']
  },
  mice: {
    id: 'mice',
    label: 'ネズミ被害',
    answer:
      '車内のネズミ臭・死骸臭は、原因物の除去と汚染箇所の洗浄が先で、消臭剤だけでは戻りません。配線噛みも点検対象です。{regionFull}では放置車両や駐車場の侵入相談に対応します。',
    bullets: [
      '臭いの発生源を特定してから消臭する',
      '侵入経路の封鎖が再発防止になる',
      '死骸が断熱材側だと分解が必要'
    ],
    lpHeadings: [H('heading-faq'), H('heading-pricing'), H('heading-compare-outreach')],
    relatedSlugs: ['nezumi', 'nezumi2', 'sinnnyuubousi', 'nezuumi'],
    keywords: ['ネズミ臭', '車内ネズミ', '侵入防止']
  },
  ranking: {
    id: 'ranking',
    label: '車内清掃の選び方',
    answer:
      '車内清掃店は「実績・料金の見え方・トラブル汚れへの対応力」で分けると選びやすいです。緊急の嘔吐・尿・灯油は出張専門、見た目の仕上げは店舗型、軽い定期ケアは給油所系が向きやすいです。{regionFull}の料金と事例は店舗ページで確認できます。',
    bullets: [
      '目的（緊急／仕上げ／定期）で正解が変わる',
      '最安だけだと奥染みは再発しやすい',
      '完全除去が難しい汚れ（灯油・猫尿）は先に説明がある店が安心'
    ],
    lpHeadings: [H('heading-compare-outreach'), H('heading-pricing'), H('heading-regional-cases')],
    relatedSlugs: ['ranking-osaka-carclean', 'ranking-hyougo-carclean', 'ranking-saitama-carclean', 'syuttyou22'],
    keywords: ['車内清掃ランキング', '業者の選び方', '出張 vs 店舗']
  },
  diy: {
    id: 'diy',
    label: '自分で車内掃除',
    answer:
      '自分で掃除できるのは軽い食べこぼしと初期の水分コントロールまでです。熱・塩素・強い摩擦はシートを傷め、臭いを固定します。深部の嘔吐・尿・カビ臭は{regionFull}のプロ吸引が安全側です。',
    bullets: [
      'バキューム→分解→叩いて移す→乾燥、の順',
      'ゴシゴシは禁物',
      'DIYで悪化したら早めに専門へ'
    ],
    lpHeadings: [H('heading-compare-outreach'), H('heading-emergency-first-aid'), H('heading-pricing')],
    relatedSlugs: ['diy3', 'j1', 'no1', 'outo2'],
    keywords: ['車内掃除 DIY', '自分で掃除', 'プロに頼る目安']
  },
  seatbelt: {
    id: 'seatbelt',
    label: 'シートベルト洗浄',
    answer:
      'シートベルトの酸っぱい臭いは、織り込み内部に嘔吐や汗が残っているサインです。水洗いしすぎると巻き取り不良の原因になるため、専用洗浄が安全です。{regionFull}では座席洗浄とセットで相談できます。',
    bullets: [
      '家庭の洗濯機は機構を傷めやすい',
      '臭いの元はベルト本体より根本側に残ることが多い',
      '座席と同時処理しないと再付着する'
    ],
    lpHeadings: [H('heading-emergency-vomit'), H('heading-pricing'), H('heading-faq')],
    relatedSlugs: ['seatbeltwash', 'outo1', 'outo2', 'no1'],
    keywords: ['シートベルト洗浄', 'シートベルトの臭い']
  },
  floor: {
    id: 'floor',
    label: 'フロア・床下',
    answer:
      'フロアの汚れはホースで丸洗いすると電気系と防錆を傷めます。マットを外し、水分を管理しながら吸引するのが基本です。{regionFull}では床下・レール周りの出張洗浄に対応します。',
    bullets: [
      '高圧ホースは車内に使わない',
      'マット下の湿気がカビと臭いの温床',
      'レールに液体が流れたら分解清掃が必要になる'
    ],
    lpHeadings: [H('heading-compare-outreach'), H('heading-pricing'), H('heading-faq')],
    relatedSlugs: ['yuka', 'yukasita', 'yuka1', 'era', 'noabetabeta'],
    keywords: ['車内フロア洗浄', '床下', 'ホース洗い禁止']
  },
  feces: {
    id: 'feces',
    label: 'うんち・排泄物',
    answer:
      'シートの排泄物は、つまみ取り→ぬるま湯で叩き出し→消臭、の順です。こすると定着します。感染症が気になる段階では{regionFull}のプロ洗浄を優先してください。',
    bullets: [
      '固形分を先に除去する',
      '熱湯・塩素は素材を傷める',
      '保険が使えるケースは写真撮影が先'
    ],
    lpHeadings: [H('heading-emergency-pet'), H('heading-insurance-matrix'), H('heading-pricing')],
    relatedSlugs: ['un', 'untt1', 'untt3', 'siko', 'outo3-2'],
    keywords: ['車内うんち', '排泄物', 'シート汚れ']
  },
  cupmen: {
    id: 'cupmen',
    label: 'カップ麺・スープ',
    answer:
      'カップ麺のスープは油分と塩分がシートに残り、乾くと臭いとベタつきが固定されます。熱いうちに広げず吸い取り、油分を分解して吸引します。{regionFull}ではファミリーカーの食べこぼし相談が多いです。',
    bullets: [
      '熱いままこすらない',
      '油分は中性〜アルカリで分解する',
      'フロアまでこぼれたらマット下も見る'
    ],
    lpHeadings: [H('heading-worries'), H('heading-pricing'), H('heading-compare-outreach')],
    relatedSlugs: ['cupmen1', 'cupmen2', 'cof1', 'no1'],
    keywords: ['カップ麺', 'スープ汚れ', '食べこぼし']
  },
  mold: {
    id: 'mold',
    label: '車内カビ',
    answer:
      '車内カビは湿気と汚れがセットで起きます。表面の黒点だけ拭いても胞子と臭いが残るため、洗浄・乾燥・必要ならオゾンが順です。{regionFull}の雨天・梅雨時期の相談に出張対応します。',
    bullets: [
      '塩素系は内装を傷めやすい',
      'エアコン内部のカビは送風乾燥の習慣も有効',
      '濡れたマットの放置が再発源'
    ],
    lpHeadings: [H('heading-faq'), H('heading-pricing'), H('heading-compare-outreach')],
    relatedSlugs: ['kb1', 'no1', 'ozon1', 'diy3'],
    keywords: ['車内カビ', 'カビ臭', '湿気']
  },
  leather: {
    id: 'leather',
    label: 'レザー・内装ケア',
    answer:
      '白レザーや本革は、強い洗剤と擦過で黒ずみ・ひび割れが出ます。汚れの種類を見て、pHと水分量を抑えて手入れします。{regionFull}では乗用車・輸入車の内装相談に対応します。',
    bullets: [
      '研磨剤・キッチン洗剤は避ける',
      '水分の入れすぎがシミの原因',
      '色落ちが出たら専門へ'
    ],
    lpHeadings: [H('heading-compare-outreach'), H('heading-pricing'), H('heading-faq')],
    relatedSlugs: ['s1', 'k1', 'koubebentzc', 'diy3'],
    keywords: ['レザーケア', '白レザー', '内装']
  },
  window: {
    id: 'window',
    label: '内窓の曇り',
    answer:
      '内側の窓曇りは、ヤニ・皮脂・シリコンの膜が原因です。外側だけ洗っても消えません。内窓専用の脱脂と仕上げが必要です。{regionFull}では車内清掃と同時施工できます。',
    bullets: [
      '内側を専用クロスで脱脂する',
      'エアコンの吹き出し汚れも曇りの原因',
      '夜間の対向車ライトでムラが見えやすい'
    ],
    lpHeadings: [H('heading-faq'), H('heading-pricing'), H('heading-compare-outreach')],
    relatedSlugs: ['kurumamadofuki1', 'taba1', 'tabccoyani'],
    keywords: ['内窓', '窓拭き', '曇り']
  },
  carwash: {
    id: 'carwash',
    label: '洗車・水垢',
    answer:
      '炎天下の洗車はウォータースポットの原因です。水温・日陰・拭き上げの順が先で、内装の臭いとは別問題です。車内の汚れが主なら{regionFull}の出張内装洗浄を選んでください。',
    bullets: [
      '直射日光下で石鹸分を乾かさない',
      '水垢とヤニは別の汚れ',
      '内装は高圧洗浄しない'
    ],
    lpHeadings: [H('heading-compare-outreach'), H('heading-pricing'), H('heading-what-is')],
    relatedSlugs: ['carwash1', 'carwash3', 'yuka', 'kurumamadofuki1'],
    keywords: ['洗車', 'ウォータースポット', '水垢']
  },
  outreach: {
    id: 'outreach',
    label: '出張車内清掃',
    answer:
      '出張車内清掃は、店舗へ預けず自宅・職場の駐車場で洗浄・消臭が完結するサービスです。代車不要・立会不要で、嘔吐や生活臭の緊急に向きます。{regionFull}は365日24時間受付です。',
    bullets: [
      '移動と預け期間がない',
      '深部汚れは家庭機材より業務用吸引が向く',
      '料金は現地見積が基本（軽22,000円〜）'
    ],
    lpHeadings: [H('heading-what-is'), H('heading-compare-outreach'), H('heading-flow'), H('heading-pricing')],
    relatedSlugs: ['syuttyou22', 'syuttyou33', 'syuttyou55', 'sennjyou2', 'ranking-osaka-carclean'],
    keywords: ['出張車内清掃', '訪問クリーニング', '立会不要']
  },
  milk: {
    id: 'milk',
    label: '牛乳・乳製品',
    answer:
      '牛乳パックの破損はタンパク質汚れで、放置すると酸敗臭になります。酵素洗浄と吸引が有効です。{regionFull}の買い物帰り事例ではシートレールまで染みたケースがあります。',
    bullets: [
      '早めに吸い取り、熱は加えない',
      'レール内部は分解しないと残りやすい',
      'オゾンは仕上げ、洗浄が先'
    ],
    lpHeadings: [H('heading-regional-cases'), H('heading-pricing'), H('heading-emergency-first-aid')],
    relatedSlugs: ['sakaimilk', 'cof1', 'no1', 'outo1'],
    keywords: ['牛乳', '乳製品', '酸敗臭']
  },
  oil: {
    id: 'oil',
    label: 'オイル汚れ',
    answer:
      '作業着から移ったエンジンオイルは水拭きでは広がり、専用の油分分解が必要です。{regionFull}では座席の部分洗浄から対応します。',
    bullets: [
      '水で薄めて広げない',
      '油分用洗剤で浮かせてから吸引する',
      '布シートは奥まで浸透しやすい'
    ],
    lpHeadings: [H('heading-pricing'), H('heading-compare-outreach'), H('heading-faq')],
    relatedSlugs: ['oilwash', 'oilwash1', 'tt1', 'diy3'],
    keywords: ['オイル汚れ', '作業着', '油分']
  },
  general: {
    id: 'general',
    label: '車内清掃（総合）',
    answer:
      '車内のシミと臭いは、表面をきれいにしても内部に原因が残ると戻ります。応急処置のあとは、{regionFull}の出張車内清掃（駐車場完結・365日受付）で発生源から洗浄するのが確実です。',
    bullets: [
      'まずは広げない・こすらない',
      '芳香剤は原因の除去ではない',
      '料金・応急処置・保険は地区LPで確認できる'
    ],
    lpHeadings: [H('heading-what-is'), H('heading-pricing'), H('heading-blog-list')],
    relatedSlugs: ['no1', 'outo1', 'syuttyou22', 'diy3'],
    keywords: ['車内清掃', '車内クリーニング', '出張']
  }
};

/** Exact filename slug → topic. Keep in sync with src/content/blog. */
export const SLUG_TO_TOPIC: Record<string, BlogTopicId> = {
  '100kincoffee': 'coffee',
  '100kinnkohi': 'coffee',
  '100kinnsennsya': 'vomit',
  '100kinnsennsya2': 'vomit',
  '100kinnsennsya3': 'vomit',
  '100kinnsennsya5': 'vomit',
  '1043': 'general',
  '10kinkohi': 'coffee',
  '1l5': 'kerosene',
  '53-3': 'general',
  boxytoyu: 'kerosene',
  boxytoyu1: 'kerosene',
  boxytoyu2: 'kerosene',
  carwash1: 'carwash',
  carwash2: 'carwash',
  carwash3: 'carwash',
  carwash4: 'carwash',
  cof1: 'coffee',
  cupmen1: 'cupmen',
  cupmen2: 'cupmen',
  cupmen3: 'cupmen',
  cupmen5: 'cupmen',
  dgog2: 'pet',
  diy3: 'diy',
  era: 'floor',
  fss: 'smell',
  fukuokalancru: 'general',
  funabasidelica: 'general',
  gorudendog1: 'pet',
  haria5sen: 'smell',
  j1: 'diy',
  jd1: 'smell',
  k1: 'leather',
  kanisiru1: 'fish',
  kb1: 'mold',
  koubebentzc: 'leather',
  ksc: 'fish',
  kurumamadofuki1: 'window',
  kusumi: 'general',
  ky1: 'vomit',
  nezumi: 'mice',
  nezumi2: 'mice',
  nezumi22: 'mice',
  nezuumi: 'mice',
  nioi1: 'smell',
  nioi111: 'smell',
  no1: 'smell',
  noabetabeta: 'floor',
  noteauranioi: 'smell',
  nyou: 'urine',
  oilwash: 'oil',
  oilwash1: 'oil',
  okiami: 'fish',
  okinawalanglari: 'general',
  okinawasuna: 'general',
  outo1: 'vomit',
  outo2: 'vomit-dont',
  outo3: 'insurance',
  'outo3-2': 'insurance',
  ozon1: 'ozone',
  passocoffee: 'coffee',
  pettoouto2: 'pet',
  'post-1783086904242': 'coffee',
  puriusnioi: 'smell',
  'ranking-hyougo-carclean': 'ranking',
  'ranking-osaka-carclean': 'ranking',
  'ranking-saitama-carclean': 'ranking',
  s1: 'leather',
  sa: 'fish',
  saitamaseren: 'kerosene',
  sakaimilk: 'milk',
  sakananioi1: 'fish',
  sakananioi2: 'fish',
  sakananioi3: 'fish',
  sakananioi4: 'fish',
  seatbeltwash: 'seatbelt',
  sennjyou2: 'outreach',
  setagayasienta: 'vomit',
  'sienta-baisyou-0en': 'insurance',
  siko: 'pet',
  sinnnyuubousi: 'mice',
  sk1: 'fish',
  syuttyou22: 'outreach',
  syuttyou33: 'outreach',
  syuttyou55: 'outreach',
  taba1: 'tobacco',
  tabccoyani: 'tobacco',
  tabccoyani2: 'tobacco',
  tabccoyani3: 'tobacco',
  tabccoyani4: 'tobacco',
  toyotavoxy: 'general',
  tt1: 'kerosene',
  un: 'feces',
  untt1: 'feces',
  untt2: 'feces',
  untt3: 'feces',
  untt4: 'feces',
  vezelmiyagi: 'general',
  vezelsmell: 'smell',
  voxtpika: 'general',
  yuka: 'floor',
  yuka1: 'floor',
  yukasita: 'floor',
  '他人の車に嘔吐　個人賠償責任保険で解決できる': 'insurance',
  '車の魚臭さ撃退': 'fish'
};

const SLUG_PREFIX_RULES: { test: (slug: string) => boolean; topic: BlogTopicId }[] = [
  { test: (s) => s.startsWith('ranking-'), topic: 'ranking' },
  { test: (s) => s.startsWith('outo'), topic: 'vomit' },
  { test: (s) => s.startsWith('sakananioi') || s.includes('fish'), topic: 'fish' },
  { test: (s) => s.startsWith('tabccoyani') || s.startsWith('taba'), topic: 'tobacco' },
  { test: (s) => s.startsWith('nezumi') || s.includes('nezuumi'), topic: 'mice' },
  { test: (s) => s.startsWith('cupmen'), topic: 'cupmen' },
  { test: (s) => s.startsWith('carwash'), topic: 'carwash' },
  { test: (s) => s.startsWith('syuttyou'), topic: 'outreach' },
  { test: (s) => s.startsWith('untt') || s === 'un', topic: 'feces' },
  { test: (s) => s.includes('kohi') || s.includes('coffee') || s.startsWith('cof'), topic: 'coffee' },
  { test: (s) => s.startsWith('boxytoyu') || s === 'tt1', topic: 'kerosene' },
  { test: (s) => s.startsWith('nioi') || s === 'no1', topic: 'smell' }
];

export function detectTopicId(
  slug: string,
  title = '',
  categories: string[] = []
): BlogTopicId {
  const normalized = slug.replace(/\.md$/, '').trim();
  if (normalized && SLUG_TO_TOPIC[normalized]) return SLUG_TO_TOPIC[normalized];

  for (const rule of SLUG_PREFIX_RULES) {
    if (rule.test(normalized)) return rule.topic;
  }

  const haystack = `${title} ${categories.join(' ')}`;
  if (/保険|賠償/.test(haystack)) return 'insurance';
  if (/嘔吐|ゲロ|酔い/.test(haystack)) return 'vomit';
  if (/灯油/.test(haystack)) return 'kerosene';
  if (/ペット|犬|猫/.test(haystack)) return 'pet';
  if (/タバコ|ヤニ/.test(haystack)) return 'tobacco';
  if (/魚|海鮮/.test(haystack)) return 'fish';
  if (/ニオイ|臭い|消臭/.test(haystack)) return 'smell';
  if (/ランキング|比較/.test(haystack)) return 'ranking';

  return 'general';
}

export function getBlogTopic(
  slug: string,
  title = '',
  categories: string[] = []
): BlogTopic {
  return BLOG_TOPICS[detectTopicId(slug, title, categories)];
}

export const AIO_ANSWER_START = '<!-- aio-answer-first -->';
export const AIO_ANSWER_END = '<!-- /aio-answer-first -->';

export const FEATURED_LP_SLUGS = ['outo1', 'outo2', 'no1', 'outo3-2', 'tt1', 'ozon1'] as const;
