$regions = @{
    "osaka"    = "大阪府"
    "hyogo"    = "兵庫県"
    "kyoto"    = "京都府"
    "shiga"    = "滋賀県"
    "nara"     = "奈良県"
    "wakayama" = "和歌山県"
    "aichi"    = "愛知県"
}

$baseDir = "c:\Users\yu\OneDrive\Desktop\antiLP\260302\deadning"

foreach ($region in $regions.GetEnumerator()) {
    $dirName = $region.Key
    $regionName = $region.Value
    $indexPath = Join-Path $baseDir $dirName "index.html"
    
    if (Test-Path $indexPath) {
        Write-Host "Processing $dirName ($regionName)..."
        $content = Get-Content $indexPath -Raw -Encoding UTF8

        # 1. Update AIO Definition
        $oldDefRegex = '(?s)<div class="aio-definition">.*?<div class="quality-badges">'
        $newDefText = @"
<div class="aio-definition">
                <p><strong>$($regionName)の出張デッドニングとは</strong>、ご自宅の駐車場でスピーカー交換とドア制振をセットで行う、専門店の半額以下（29,000円〜）で施工可能な出張サービスです。超制振材「レアルシルト」等の材料持込も無料で対応します。</p>
                <div class="quality-badges">
"@
        $content = $content -replace $oldDefRegex, $newDefText

        # 2. Add or Update Comparison Section
        $comparisonHtml = @"
    <!-- ============================================ -->
    <!-- 施工比較表（AIO引用向け） -->
    <!-- ============================================ -->
    <section class="comparison-section" id="comparison">
        <div class="container">
            <h2 class="section-title">出張デッドニング vs 専門店 vs DIY<br><span class="text-red">徹底比較</span></h2>
            <p style="text-align:center;font-size:13px;color:#555;margin-bottom:20px;">$($regionName)でデッドニングを検討中の方必見。3つの選択肢を公平に比較しました。</p>
            
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
            <p class="comparison-note">※ カー用品店の価格は2026年$($regionName)地区の一般的な相場。車種・メーカーにより異なります。</p>
        </div>
    </section>
"@

        if ($content -match '<section class="comparison-section"') {
            # Update existing (osaka)
            $content = $content -replace '(?s)<!-- ============================================ -->\s*<!-- 施工比較表（AIO引用向け） -->.*?</section>', $comparisonHtml
        } else {
            # Insert into others (after pricing-section)
            $content = $content -replace '(?s)(<section class="pricing-section".*?</section>)', "`$1`r`n`r`n$comparisonHtml"
        }

        # 3. Update FAQ
        $faqAddHtml = @"
                <div class="faq-item">
                    <div class="faq-q"><span>Q</span> プリウスなどのハイブリッド車にデッドニングは効果的ですか？</div>
                    <div class="faq-a"><span>A</span> 非常に効果的です。プリウス特有のロードノイズやエンジン始動時の振動音が軽減され、静粛性が大きく向上します。静かな車内環境で音楽を楽しむために最もおすすめの車種の一つです。</div>
                </div>
                <div class="faq-item">
                    <div class="faq-q"><span>Q</span> どんな制振材がおすすめですか？レアルシルトも持ち込めますか？</div>
                    <div class="faq-a"><span>A</span> はい、圧倒的な制振性能を誇る「レアルシルト」など、高品質なプロ用材料のお持ち込み施工も多数実績があります。お客様がご自身で選んだこだわりの材料を、追加料金なしでプロが確実に取り付けます。</div>
                </div>
"@
        
        # Check if already added to avoid duplicates
        if ($content -notmatch "プリウスなどのハイブリッド車にデッドニングは効果的ですか？") {
            $content = $content -replace '(?s)(<div class="faq-list fade-in">)', "`$1`r`n$faqAddHtml"
        }

        [IO.File]::WriteAllText($indexPath, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Updated $indexPath successfully."
    }
}
