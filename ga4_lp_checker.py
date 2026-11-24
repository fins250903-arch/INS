"""
INS Car Clean - GA4 Weekly LP Audit & Benchmarking Engine
出張車内清掃 LP 先週対比・業界競合ベンチマーク対比・不足項目自動診断ツール
"""

import os
import sys
import json
import datetime
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional

# -------------------------------------------------------------
# 出張車内清掃・緊急駆けつけサービスの業界基準値 (ベンチマーク)
# -------------------------------------------------------------
BENCHMARKS = {
    "min_tel_ctr": 0.05,            # 目標電話タップ率: 5.0%以上 (緊急系LPの標準)
    "min_engagement_rate": 0.50,    # 目標エンゲージメント率: 50.0%以上
    "max_fv_bounce_rate": 0.50,     # FV直帰率上限: 50.0% (スクロール25%未満離脱)
    "min_scroll_50_rate": 0.40,     # 中間到達率目標: 40.0%以上
    "wow_alert_drop_pct": -0.20,    # 先週比アラート閾値: -20.0%
}

# キーワードごとの標準推奨施策 (不足項目の改善ライブラリ)
KEYWORD_OPTIMIZATION_RULES = {
    "shanai-outo": {
        "name": "車内嘔吐・ゲロ掃除",
        "fv_tip": "『今すぐニオイを消したい』ニーズが最優先。FVに『最短即日訪問・立会不要・完全温水洗浄』を大きく打ち出す。",
        "cta_tip": "深夜・早朝の嘔吐トラブルが多いため、『365日24時間受付中』を電話ボタン直上に赤字で常時固定する。",
        "trust_tip": "『友人の車で吐いてしまった』ユーザー向けに『個人賠償責任保険（自己負担0円の可能性）』を上部に配置。"
    },
    "touyu-kobosi": {
        "name": "灯油こぼし",
        "fv_tip": "『揮発したニオイで頭痛・気分が悪くなる』緊急事態。水拭きNG（悪化する）の注意喚起と、専用アルカリ温水吸引の必要性を即座に提示。",
        "cta_tip": "冬場に急増するKW。『今日中に何とかしたい』が強いため、『最短◯分で駆けつけ』の電話誘導が最重要。",
        "trust_tip": "灯油は放置すると鉄板やスポンジに染み込むため、『4日以内の早急な洗浄』を強調。"
    },
    "omorashi": {
        "name": "おもらし・尿",
        "fv_tip": "小さな子どもや高齢者の送迎時のおもらし。『シート内部のクッションまで浸透した雑菌・アンモニア臭の根こそぎ除菌』を訴求。",
        "cta_tip": "『恥ずかしくて電話しづらい』層が存在するため、電話CTAの横に『LINEで写真送信・匿名相談OK』を併記する。",
        "trust_tip": "『抗菌・抗ウイルス消臭施工』のビフォーアフター写真を提示。"
    },
    "pet-nioi": {
        "name": "ペット臭・毛",
        "fv_tip": "愛犬・愛猫を乗せた後の獣臭・抜け毛。シートの繊維に絡んだ毛の専用特殊ブラシ掻き出しと消臭スチームを訴求。",
        "cta_tip": "嘔吐ほど緊急ではないため、『LINEでかんたん見積り』や料金表（シート1席〜）の視認性を高める。",
        "trust_tip": "ペットに安全な天然植物由来の無害な洗剤使用を明記して安心感を与える。"
    },
    "ac-nioi": {
        "name": "エアコン臭",
        "fv_tip": "カビ臭・ホコリ臭。エバポレーター高圧洗浄と車内消臭のセットプランをFVで提示。",
        "cta_tip": "夏前（5〜7月）と冬前（11月）に需要が跳ね上がる。季節限定キャンペーンバナーを上部に配置。",
        "trust_tip": "『市販の消臭スプレーが効かない理由』を解説してプロ洗浄の必然性を伝える。"
    },
    "tabako-yani": {
        "name": "タバコヤニ・黄ばみ",
        "fv_tip": "天井・シートのヤニ黄ばみと頑固なヤニ臭。中古車購入直後のリフレッシュ需要を取り込む。",
        "cta_tip": "納車日前の事前予約が多いため、『土日祝も対応・出張見積り無料』を強調。",
        "trust_tip": "天井スチーム洗浄の茶色い汚水バケツ写真を掲載して圧倒的な効果を見せる。"
    }
}

@dataclass
class LPRecord:
    lp_path: str
    area: str
    keyword_slug: str
    keyword_name: str
    # 今週 (Cur)
    sessions_cur: int
    tel_clicks_cur: int
    line_clicks_cur: int
    scroll_50_cur: int
    engagement_rate_cur: float
    # 先週 (Prev)
    sessions_prev: int
    tel_clicks_prev: int
    line_clicks_prev: int
    scroll_50_prev: int
    engagement_rate_prev: float


def audit_single_lp(data: LPRecord) -> Dict[str, Any]:
    """1つのLPに対して先週対比 & 業界競合ベンチマーク対比の弱点診断を行う"""
    issues = []
    actions = []
    strengths = []

    # 1. 計算
    sess_change = (data.sessions_cur - data.sessions_prev) / max(data.sessions_prev, 1)
    tel_ctr_cur = data.tel_clicks_cur / max(data.sessions_cur, 1)
    tel_ctr_prev = data.tel_clicks_prev / max(data.sessions_prev, 1)
    tel_ctr_change = (tel_ctr_cur - tel_ctr_prev) / max(tel_ctr_prev, 0.0001)

    scroll_50_rate_cur = data.scroll_50_cur / max(data.sessions_cur, 1)
    rule = KEYWORD_OPTIMIZATION_RULES.get(data.keyword_slug, None)

    # 2. 先週対比チェック (急変アラート)
    if sess_change <= BENCHMARKS["wow_alert_drop_pct"]:
        issues.append(f"【流入急減】訪問数が先週比 {sess_change * 100:.1f}% と大幅に下落（先週 {data.sessions_prev} → 今週 {data.sessions_cur}）。")
        actions.append(f"広告の入札単価、日次予算上限、または特定キーワードの検索表示順位を即時確認してください。")
    elif sess_change >= 0.20:
        strengths.append(f"訪問数が先週比 +{sess_change * 100:.1f}% と好調に拡大しています。")

    if tel_ctr_change <= -0.25 and data.sessions_cur >= 100:
        issues.append(f"【電話率急落】電話タップ率が先週比 {tel_ctr_change * 100:.1f}% 悪化（先週 {tel_ctr_prev*100:.1f}% → 今週 {tel_ctr_cur*100:.1f}%）。")
        actions.append("競合他社が『即日・安値』のオファーを強化している可能性、またはスマホ表示での追従ボタン崩れがないか確認してください。")

    # 3. 競合・業界ベンチマーク対比チェック
    # (A) 電話タップ率 (CTR)
    if tel_ctr_cur < BENCHMARKS["min_tel_ctr"]:
        issues.append(f"【電話導線不足】電話タップ率が {tel_ctr_cur * 100:.2f}% に留まり、業界基準（5.0%以上）を下回っています。")
        if rule:
            actions.append(f"CTA改善: {rule['cta_tip']}")
        else:
            actions.append("スマホ画面下部の追従電話ボタンの常時表示と、FV直下の電話ボタンの視認性（コントラスト）を高めてください。")
    else:
        strengths.append(f"電話タップ率 {tel_ctr_cur * 100:.2f}% と高水準（業界水準クリア）を維持しています。")

    # (B) エンゲージメント・直帰率 (FV離脱)
    if data.engagement_rate_cur < BENCHMARKS["min_engagement_rate"]:
        issues.append(f"【FV即離脱】エンゲージメント率が {data.engagement_rate_cur * 100:.1f}% と業界平均（50%）未満。FVで直帰されています。")
        if rule:
            actions.append(f"FV改善: {rule['fv_tip']}")
        else:
            actions.append("ファーストビューのキャッチコピーとお悩みの合致度を再確認し、安心バッジ（満足度92%、出張無料）を目立たせてください。")

    # (C) スクロール中間到達率 (コンテンツの精読)
    if scroll_50_rate_cur < BENCHMARKS["min_scroll_50_rate"]:
        issues.append(f"【精読離脱】ページ中間（50%スクロール）への到達率が {scroll_50_rate_cur * 100:.1f}% と低調です。")
        if rule:
            actions.append(f"安心材料: {rule['trust_tip']}")
        else:
            actions.append("導入部をスマホスクロール1〜2画面以内で要点（即日駆けつけ、概算金額）が伝わるようコンパクトに再編してください。")

    # 判定ランク
    if len(issues) >= 3:
        status = "🔴 危険（要緊急改善）"
        status_code = "danger"
    elif len(issues) >= 1:
        status = "🟡 注意（改善余地あり）"
        status_code = "warning"
    else:
        status = "🟢 優秀（順調）"
        status_code = "good"

    return {
        "lp_path": data.lp_path,
        "area": data.area,
        "keyword_slug": data.keyword_slug,
        "keyword_name": data.keyword_name,
        "status": status,
        "status_code": status_code,
        "sessions": {"cur": data.sessions_cur, "prev": data.sessions_prev, "change": sess_change},
        "tel_clicks": {"cur": data.tel_clicks_cur, "prev": data.tel_clicks_prev},
        "tel_ctr": {"cur": tel_ctr_cur, "prev": tel_ctr_prev, "change": tel_ctr_change},
        "engagement_rate": {"cur": data.engagement_rate_cur, "prev": data.engagement_rate_prev},
        "scroll_50_rate": scroll_50_rate_cur,
        "issues": issues,
        "actions": actions,
        "strengths": strengths
    }


def generate_html_report(results: List[Dict[str, Any]], date_str: str) -> str:
    """見やすいHTML診断ダッシュボードレポートを出力"""
    total_lps = len(results)
    danger_lps = sum(1 for r in results if r["status_code"] == "danger")
    warning_lps = sum(1 for r in results if r["status_code"] == "warning")
    good_lps = sum(1 for r in results if r["status_code"] == "good")
    total_issues = sum(len(r["issues"]) for r in results)

    rows_html = []
    for r in results:
        bg_color = "bg-red-50/50 border-red-200" if r["status_code"] == "danger" else ("bg-amber-50/40 border-amber-200" if r["status_code"] == "warning" else "bg-white border-slate-200")
        badge_color = "bg-red-600 text-white" if r["status_code"] == "danger" else ("bg-amber-500 text-white" if r["status_code"] == "warning" else "bg-emerald-600 text-white")

        change_class = "text-emerald-600 font-bold" if r["sessions"]["change"] >= 0 else "text-red-500 font-bold"
        change_sign = "+" if r["sessions"]["change"] >= 0 else ""

        issues_html = "".join([f"<li class='text-red-700 text-xs mb-1'>🚨 {iss}</li>" for iss in r["issues"]])
        actions_html = "".join([f"<li class='text-slate-700 text-xs mb-1'>💡 <strong>施策</strong>: {act}</li>" for act in r["actions"]])
        strengths_html = "".join([f"<li class='text-emerald-700 text-xs mb-1'>✨ {st}</li>" for st in r["strengths"]])

        rows_html.append(f"""
        <div class="p-5 rounded-xl border {bg_color} shadow-sm space-y-3">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span class="text-xs px-2 py-0.5 rounded font-black {badge_color}">{r["status"]}</span>
              <span class="text-sm font-black text-slate-800 ml-2">【{r["area"]} / {r["keyword_name"]}】</span>
              <code class="text-xs text-slate-500 ml-1">{r["lp_path"]}</code>
            </div>
            <div class="flex items-center gap-4 text-xs font-semibold">
              <div>訪問: <span class="font-bold text-slate-900">{r["sessions"]["cur"]}</span> (<span class="{change_class}">先週比 {change_sign}{r["sessions"]["change"]*100:.1f}%</span>)</div>
              <div>電話CV: <span class="font-bold text-red-600">{r["tel_clicks"]["cur"]}件</span> (CTR: <span class="font-bold">{r["tel_ctr"]["cur"]*100:.2f}%</span>)</div>
              <div>精読率: <span class="font-bold text-slate-700">{r["scroll_50_rate"]*100:.1f}%</span></div>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
            <div>
              <div class="text-[11px] font-bold text-slate-500 uppercase mb-1">検出された課題・不足項目</div>
              <ul class="list-none space-y-1">
                {issues_html if issues_html else "<li class='text-xs text-slate-400'>特になし（主要指標すべて良好）</li>"}
              </ul>
              {f"<ul class='list-none mt-2'>{strengths_html}</ul>" if strengths_html else ""}
            </div>
            <div>
              <div class="text-[11px] font-bold text-slate-500 uppercase mb-1">推奨される改善アクション（競合対比）</div>
              <ul class="list-none space-y-1">
                {actions_html if actions_html else "<li class='text-xs text-slate-400'>現状の構成を維持・広告配信を継続推奨</li>"}
              </ul>
            </div>
          </div>
        </div>
        """)

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>INS LP 週次自動診断＆不足項目チェックレポート ({date_str})</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-100 p-6 text-slate-800 font-sans">
  <div class="max-w-6xl mx-auto space-y-6">
    
    <header class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span class="bg-blue-600 text-white text-xs px-2.5 py-1 rounded font-bold">INS GA4 定期自動チェック</span>
          <h1 class="text-2xl font-black text-slate-900 mt-2">📊 LP 週次診断 & 不足項目チェックレポート</h1>
          <p class="text-xs text-slate-500 mt-1">集計日: {date_str} ｜ 対象プロパティ: G-LTFRTZY7FE</p>
        </div>
        <div class="flex gap-2">
          <div class="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-center">
            <span class="text-[10px] font-bold text-slate-500 uppercase block">診断対象</span>
            <span class="text-xl font-black text-slate-800">{total_lps} <span class="text-xs font-normal">LP</span></span>
          </div>
          <div class="bg-red-50 border border-red-200 px-4 py-2 rounded-xl text-center">
            <span class="text-[10px] font-bold text-red-600 uppercase block">要改善</span>
            <span class="text-xl font-black text-red-600">{danger_lps + warning_lps} <span class="text-xs font-normal">件</span></span>
          </div>
          <div class="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-center">
            <span class="text-[10px] font-bold text-emerald-600 uppercase block">良好</span>
            <span class="text-xl font-black text-emerald-600">{good_lps} <span class="text-xs font-normal">件</span></span>
          </div>
        </div>
      </div>
    </header>

    <div class="space-y-4">
      {"".join(rows_html)}
    </div>

  </div>
</body>
</html>
"""


def run_audit():
    today = datetime.date.today().strftime("%Y-%m-%d")
    
    # サンプルデータ (実際の全地区・KWを模した実戦データ)
    records = [
        LPRecord(
            lp_path="/osaka/shanai-outo/",
            area="大阪府",
            keyword_slug="shanai-outo",
            keyword_name="車内嘔吐・ゲロ掃除",
            sessions_cur=1240,
            tel_clicks_cur=112,
            line_clicks_cur=18,
            scroll_50_cur=650,
            engagement_rate_cur=0.59,
            sessions_prev=1110,
            tel_clicks_prev=100,
            line_clicks_prev=15,
            scroll_50_prev=590,
            engagement_rate_prev=0.58
        ),
        LPRecord(
            lp_path="/osaka/touyu-kobosi/",
            area="大阪府",
            keyword_slug="touyu-kobosi",
            keyword_name="灯油こぼし",
            sessions_cur=410,
            tel_clicks_cur=14,
            line_clicks_cur=4,
            scroll_50_cur=110,
            engagement_rate_cur=0.38,
            sessions_prev=600,
            tel_clicks_prev=36,
            line_clicks_prev=8,
            scroll_50_prev=260,
            engagement_rate_prev=0.52
        ),
        LPRecord(
            lp_path="/tokyou/shanai-outo/",
            area="東京都",
            keyword_slug="shanai-outo",
            keyword_name="車内嘔吐・ゲロ掃除",
            sessions_cur=1480,
            tel_clicks_cur=128,
            line_clicks_cur=24,
            scroll_50_cur=810,
            engagement_rate_cur=0.61,
            sessions_prev=1370,
            tel_clicks_prev=118,
            line_clicks_prev=20,
            scroll_50_prev=750,
            engagement_rate_prev=0.60
        ),
        LPRecord(
            lp_path="/aiti/touyu-kobosi/",
            area="愛知県",
            keyword_slug="touyu-kobosi",
            keyword_name="灯油こぼし",
            sessions_cur=620,
            tel_clicks_cur=48,
            line_clicks_cur=6,
            scroll_50_cur=340,
            engagement_rate_cur=0.56,
            sessions_prev=500,
            tel_clicks_prev=39,
            line_clicks_prev=5,
            scroll_50_prev=280,
            engagement_rate_prev=0.54
        ),
        LPRecord(
            lp_path="/hyougo/omorashi/",
            area="兵庫県",
            keyword_slug="omorashi",
            keyword_name="おもらし・尿",
            sessions_cur=380,
            tel_clicks_cur=12,
            line_clicks_cur=14,
            scroll_50_cur=130,
            engagement_rate_cur=0.44,
            sessions_prev=400,
            tel_clicks_prev=15,
            line_clicks_prev=12,
            scroll_50_prev=150,
            engagement_rate_prev=0.46
        ),
        LPRecord(
            lp_path="/fukuoka/pet-nioi/",
            area="福岡県",
            keyword_slug="pet-nioi",
            keyword_name="ペット臭・毛",
            sessions_cur=290,
            tel_clicks_cur=18,
            line_clicks_cur=9,
            scroll_50_cur=160,
            engagement_rate_cur=0.54,
            sessions_prev=290,
            tel_clicks_prev=18,
            line_clicks_prev=8,
            scroll_50_prev=155,
            engagement_rate_prev=0.53
        )
    ]

    results = [audit_single_lp(rec) for rec in records]

    # HTMLレポート出力
    html_content = generate_html_report(results, today)
    html_filename = f"weekly_audit_{today}.html"
    with open(html_filename, "w", encoding="utf-8") as f:
        f.write(html_content)

    # Markdownレポート出力
    md_lines = [
        f"# 📊 INS LP 週次診断 & 不足項目チェックレポート ({today})",
        "",
        "## 1. 診断サマリー",
        f"- 診断LP件数: **{len(results)} 件**",
        f"- 要改善LP: **{sum(1 for r in results if r['status_code'] != 'good')} 件**",
        "",
        "---",
        "## 2. LP別 詳細診断と改善提案",
        ""
    ]
    for r in results:
        md_lines.append(f"### {r['status']} 【{r['area']} / {r['keyword_name']}】 `{r['lp_path']}`")
        md_lines.append(f"- **訪問数 (セッション)**: 今週 {r['sessions']['cur']} (先週 {r['sessions']['prev']} / 先週比 `{r['sessions']['change']*100:+.1f}%`)")
        md_lines.append(f"- **電話タップ (Tel CV)**: 今週 `{r['tel_clicks']['cur']} 件` (CTR: `{r['tel_ctr']['cur']*100:.2f}%` / 目安 5%以上)")
        md_lines.append(f"- **精読率 (50%到達)**: `{r['scroll_50_rate']*100:.1f}%` (目安 40%以上)")
        if r["issues"]:
            md_lines.append("#### 🚨 検出された課題・不足項目")
            for iss in r["issues"]:
                md_lines.append(f"- {iss}")
            md_lines.append("#### 💡 推奨される改善施策（競合ベンチマーク対比）")
            for act in r["actions"]:
                md_lines.append(f"- {act}")
        else:
            md_lines.append("主要指標はすべて基準値をクリアしており良好です。")
        md_lines.append("")
        md_lines.append("---")

    md_filename = f"weekly_audit_{today}.md"
    with open(md_filename, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

    print(f"[OK] Audit complete.")
    print(f"  -> HTML Report: {html_filename}")
    print(f"  -> Markdown Report: {md_filename}")


if __name__ == "__main__":
    run_audit()
