import os
import re

regions = {
    "osaka": "大阪府",
    "hyogo": "兵庫県",
    "kyoto": "京都府",
    "shiga": "滋賀県",
    "nara": "奈良県",
    "wakayama": "和歌山県",
    "aichi": "愛知県"
}

base_dir = r"c:\Users\yu\OneDrive\Desktop\antiLP\260302\deadning"

for dir_name, region_name in regions.items():
    index_path = os.path.join(base_dir, dir_name, "index.html")
    if os.path.exists(index_path):
        print(f"Processing {dir_name}...")
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 1. Update AIO Definition
        old_def_regex = r'<div class="aio-definition">.*?<div class="quality-badges">'
        new_def_text = f'''<div class="aio-definition">
                <p><strong>{region_name}の出張デッドニングとは</strong>、ご自宅の駐車場でスピーカー交換とドア制振をセットで行う、専門店の半額以下（29,000円〜）で施工可能な出張サービスです。超制振材「レアルシルト」等の材料持込も無料で対応します。</p>
                <div class="quality-badges">'''
        content = re.sub(old_def_regex, new_def_text, content, flags=re.DOTALL)

        # 2. Add or Update Comparison Section
        comparison_html = f'''
    <!-- ============================================ -->
    <!-- 施工比較表（AIO引用向け） -->
    <!-- ============================================ -->
    <section class="comparison-section" id="comparison">
        <div class="container">
            <h2 class="section-title">出張デッドニング vs 専門店 vs DIY<br><span class="text-red">徹底比較</span></h2>
            <p style="text-align:center;font-size:13px;color:#555;margin-bottom:20px;">{region_name}でデッドニングを検討中の方必見。3つの選択肢を公平に比較しました。</p>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="../../images/aio_summary.png" alt="出張デッドニング比較インフォグラフィック" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            </div>

            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>比較項目</th>
                        <th>特急便（出張）</th>
                        <th>カー用品店</th>
                        <th>DIY</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="highlight-row">
                        <td>料金（フロントセット）</td>
                        <td class="col-best">29,000円〜</td>
                        <td>70,000〜120,000円</td>
                        <td>材料費15,000円〜</td>
                    </tr>
                    <tr>
                        <td>施工場所</td>
                        <td class="col-best">ご自宅の駐車場</td>
                        <td>店舗へ持込</td>
                        <td>自宅ガレージ</td>
                    </tr>
                    <tr>
                        <td>材料持込</td>
                        <td class="col-ok">✅ 完全無料</td>
                        <td class="col-ng">❌ 多くは不可</td>
                        <td class="col-ok">✅（自分で準備）</td>
                    </tr>
                    <tr>
                        <td>所要時間</td>
                        <td class="col-best">約2〜3時間</td>
                        <td>予約待ち＋数時間</td>
                        <td>5〜10時間以上</td>
                    </tr>
                    <tr>
                        <td>技術保証</td>
                        <td class="col-ok">✅ プロ施工</td>
                        <td class="col-ok">✅ プロ施工</td>
                        <td class="col-ng">❌ 自己責任</td>
                    </tr>
                    <tr>
                        <td>追加料金リスク</td>
                        <td class="col-ok">✅ ゼロ</td>
                        <td class="col-ng">❌ 発生あり</td>
                        <td class="col-ok">✅ なし</td>
                    </tr>
                </tbody>
            </table>
            <p class="comparison-note">※ カー用品店の価格は2026年{region_name}地区の一般的な相場。車種・メーカーにより異なります。</p>
        </div>
    </section>'''

        if '<section class="comparison-section"' in content:
            # Update existing
            content = re.sub(r'<!-- ============================================ -->\s*<!-- 施工比較表（AIO引用向け） -->.*?</section>', comparison_html, content, flags=re.DOTALL)
        else:
            # Insert into others
            content = re.sub(r'(<section class="pricing-section".*?</section>)', r'\1\n\n' + comparison_html, content, flags=re.DOTALL)

        # 3. Update FAQ
        faq_add_html = '''
                <div class="faq-item">
                    <div class="faq-q"><span>Q</span> プリウスなどのハイブリッド車にデッドニングは効果的ですか？</div>
                    <div class="faq-a"><span>A</span> 非常に効果的です。プリウス特有のロードノイズやエンジン始動時の振動音が軽減され、静粛性が大きく向上します。静かな車内環境で音楽を楽しむために最もおすすめの車種の一つです。</div>
                </div>
                <div class="faq-item">
                    <div class="faq-q"><span>Q</span> どんな制振材がおすすめですか？レアルシルトも持ち込めますか？</div>
                    <div class="faq-a"><span>A</span> はい、圧倒的な制振性能を誇る「レアルシルト」など、高品質なプロ用材料のお持ち込み施工も多数実績があります。お客様がご自身で選んだこだわりの材料を、追加料金なしでプロが確実に取り付けます。</div>
                </div>'''
        
        if 'プリウスなどのハイブリッド車にデッドニングは効果的ですか？' not in content:
            content = re.sub(r'(<div class="faq-list fade-in">)', r'\1\n' + faq_add_html, content)

        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {index_path} successfully.")
