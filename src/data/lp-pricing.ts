/** 料金表（税込）— WordPress osak.insbs.net/wp1 と同一 */
export const pricingSet = [
  { label: '軽自動車・軽SUV（4人乗り以下）', price: '22,000円' },
  { label: '普通車（3・5ナンバー / 5人乗り以下）', price: '28,000円' },
  { label: '大型車・SUV・ミニバン（6人乗り以上）', price: '36,000円' }
] as const;

export const pricingPartial = [
  { label: '座席シート単体（1脚）', price: '18,000円' },
  { label: '後部座席シートのみ', price: '22,000円' },
  { label: 'フロア床のみ（前席）', price: '9,000円' },
  { label: 'フロア床のみ（後部席）', price: '8,000円' }
] as const;

export const pricingOptions = [
  { label: '消臭・脱臭 特殊清掃（ひどい嘔吐・糞尿・激臭）', price: '3,000-7,000円' },
  { label: '抗菌コート', price: '2,000円' },
  { label: '防臭 + 抗菌コート（防汚対策）', price: '5,000円' },
  { label: 'オゾン装置使用（強力脱臭）', price: '5,000円' },
  { label: '発電機等 電源持込', price: '5,000円' },
  { label: '天井部洗浄（タバコ ヤニ除去）', price: '12,000円' },
  { label: '灯油専用洗浄（1席あたり）', price: '30,000円' }
] as const;

export const additionalNotes = [
  '革張りシートは、洗剤保湿剤が変わる為 5,000円',
  'エアコン内部洗浄（簡易洗浄） 10,000円',
  'ペット毛取り ピンセット抜き手作業増加 5,000円',
  '指定エリア外は、出張料金加算（主に島しょ部）',
  '駐車場利用料金（コインパーキング利用時のみ）'
] as const;
