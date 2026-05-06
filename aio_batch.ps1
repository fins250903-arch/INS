# AIO Batch Update Script for deadning LPs
# Applies @graph JSON-LD, definition box, FAQ expansion, and accordion JS to remaining 4 pages

$base = "C:\Users\yu\OneDrive\Desktop\antiLP\260302\deadning"

# --- Helper: build the @graph JSON-LD block ---
function Get-JsonLd($pref, $prefName, $url, $city) {
    return @"
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "LocalBusiness",
          "@id": "https://abura.site/deadning/$url/#business",
          "name": "車の出張パーツ取付 特急便",
          "image": "https://abura.site/images/deadning%20image0.jpg",
          "url": "https://abura.site/deadning/$url/",
          "telephone": "070-8428-0866",
          "priceRange": "¥29,000〜",
          "description": "${pref}の出張デッドニングとは、ご自宅の駐車場までプロが出張し、スピーカー交換とドア制振施工をセットで29,000円〜から行う出張専門サービスです。材料持込OK・追加料金なし・約2〜3時間で完了。",
          "openingHours": "Mo-Su 09:00-19:00",
          "address": {"@type": "PostalAddress", "addressRegion": "$pref", "addressCountry": "JP"},
          "areaServed": [{"@type": "State", "name": "$pref"}],
          "sameAs": ["https://blog.deadning.abura.site/"],
          "hasOfferCatalog": {
            "@type": "OfferCatalog", "name": "出張施工メニュー",
            "itemListElement": [
              {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "フロントドア デッドニング＋スピーカー交換セット", "description": "材料持ち込みOK。フロントドア左右2枚のセット工賃。約2〜3時間で完了。"}, "price": "29000", "priceCurrency": "JPY"},
              {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "スピーカー交換のみ（フロント左右）"}, "price": "12000", "priceCurrency": "JPY"},
              {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "デッドニングのみ（フロントドア左右）"}, "price": "15000", "priceCurrency": "JPY"}
            ]
          }
        },
        {
          "@type": "Article",
          "@id": "https://abura.site/deadning/$url/#article",
          "headline": "${pref}の出張デッドニング＆スピーカー取付サービス【特急便】材料持込OK・29,000円〜",
          "description": "${pref}の出張デッドニングとは、ご自宅の駐車場までプロが出張し、スピーカー交換とドア制振施工をセットで29,000円〜から行う出張専門サービスです。",
          "url": "https://abura.site/deadning/$url/",
          "datePublished": "2025-01-01", "dateModified": "2026-04-27",
          "author": {"@type": "Organization", "name": "車の出張パーツ取付 特急便"},
          "publisher": {"@type": "Organization", "name": "車の出張パーツ取付 特急便", "url": "https://abura.site/"}
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "ホーム", "item": "https://abura.site/"},
            {"@type": "ListItem", "position": 2, "name": "デッドニング出張施工", "item": "https://abura.site/deadning/"},
            {"@type": "ListItem", "position": 3, "name": "$pref", "item": "https://abura.site/deadning/$url/"}
          ]
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {"@type": "Question", "name": "${pref}で出張デッドニングはいくらですか？", "acceptedAnswer": {"@type": "Answer", "text": "${pref}全域への出張デッドニング＋スピーカー交換セットは29,000円〜（税込）です。出張費込み・材料持込無料・当日追加料金なし。専門店相場70,000〜120,000円と比べて圧倒的にお得です。"}},
            {"@type": "Question", "name": "デッドニングとスピーカー交換は同時にするべきですか？", "acceptedAnswer": {"@type": "Answer", "text": "同時施工が最もコスト効率が高いです。スピーカー交換時にドアを開けるため、その工程でデッドニングも行うことで工賃を大幅削減できます。別々に依頼すると2倍近くのコストがかかります。"}},
            {"@type": "Question", "name": "デッドニングの施工時間はどのくらいかかりますか？", "acceptedAnswer": {"@type": "Answer", "text": "フロントドア左右のデッドニング＋スピーカー交換セットで約2〜3時間です。作業中はご自宅でくつろいでいただけます。"}},
            {"@type": "Question", "name": "Amazon・楽天で買ったスピーカーでも取り付けてもらえますか？", "acceptedAnswer": {"@type": "Answer", "text": "はい、材料持ち込みは完全無料・大歓迎です。Amazon・楽天・ヤフオク・中古品・前の車からの流用品もすべてOKです。"}},
            {"@type": "Question", "name": "${pref}のどのエリアまで出張してもらえますか？", "acceptedAnswer": {"@type": "Answer", "text": "${pref}全域に対応しています。${city}など県内全域に出張します。出張費は見積もりに含まれます。"}},
            {"@type": "Question", "name": "マンションの駐車場でも作業できますか？", "acceptedAnswer": {"@type": "Answer", "text": "はい、可能です。通常の乗り降りができるスペースがあれば問題ありません。事前に駐車場の写真をLINEでお送りいただければより正確にお答えできます。"}},
            {"@type": "Question", "name": "出張デッドニングと専門店の価格差はどのくらいですか？", "acceptedAnswer": {"@type": "Answer", "text": "専門店のフロントドアデッドニング＋スピーカー交換は通常70,000〜120,000円が相場です。特急便は29,000円〜のため、最大約90,000円の節約になります。"}},
            {"@type": "Question", "name": "施工後に追加料金が発生することはありますか？", "acceptedAnswer": {"@type": "Answer", "text": "一切ありません。事前のお見積もり金額がそのままお支払い金額です。万が一追加作業が必要な場合は、必ず事前にご了承をいただいてから進めます。"}}
          ]
        }
      ]
    }
    </script>
</head>
"@
}

function Get-DefinitionBox($pref) {
    return @"
            <div class="aio-definition">
                <p><strong>${pref}の出張デッドニングとは</strong>、ご自宅の駐車場までプロが出張し、スピーカー交換とドア制振施工をセットで<strong>29,000円〜</strong>から行う出張専門サービスです。材料持込OK・追加料金なし・約2〜3時間で完了。</p>
                <div class="quality-badges">
                    <span class="quality-badge gold">📍 ${pref}全域対応</span>
                    <span class="quality-badge">📦 材料持込無料</span>
                    <span class="quality-badge">⏱ 約2〜3時間</span>
                    <span class="quality-badge">💰 専門店の1/3〜の価格</span>
                </div>
            </div>
"@
}

function Get-FaqSection($pref, $city) {
    return @"
    <section class="faq-section" id="faq">
        <div class="container">
            <h2 class="section-title">よくある質問</h2>
            <p style="text-align:center;font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:20px;">${pref}の出張デッドニングに関するご質問をまとめました。気になる項目をタップしてご確認ください。</p>
            <div class="faq-list fade-in">
                <div class="faq-item"><div class="faq-q"><span>Q</span> デッドニングって本当に効果がありますか？</div><div class="faq-a"><span>A</span> 絶大な効果があります。ドア内部の振動を抑えることで、スピーカーの音がクリアになり、ロードノイズも大幅に減少します。施工直後に「こんなに違うの？」と驚かれるお客様が${pref}で続出しています。</div></div>
                <div class="faq-item"><div class="faq-q"><span>Q</span> Amazon・楽天で買ったスピーカーでも大丈夫ですか？</div><div class="faq-a"><span>A</span> もちろんです！材料持ち込みは完全無料・大歓迎です。ヤフオクや中古品、前の車からの付け替えもOKです。</div></div>
                <div class="faq-item"><div class="faq-q"><span>Q</span> デッドニングとスピーカー交換は同時にするべきですか？</div><div class="faq-a"><span>A</span> 同時施工が最もコスト効率が高いです。スピーカー交換時にドアを開けるため、その工程でデッドニングも行うことで工賃を大幅削減できます。別々に依頼すると2倍近くのコストがかかります。</div></div>
                <div class="faq-item"><div class="faq-q"><span>Q</span> 出張デッドニングと専門店の価格差はどのくらいですか？</div><div class="faq-a"><span>A</span> 専門店・カー用品店のフロントデッドニング＋スピーカー交換は通常70,000〜120,000円が相場です。特急便は29,000円〜のため、最大約90,000円の節約になります。</div></div>
                <div class="faq-item"><div class="faq-q"><span>Q</span> 施工時間はどのくらいかかりますか？</div><div class="faq-a"><span>A</span> フロントドア左右のデッドニング＋スピーカー交換セットで約2〜3時間です。作業中はご自宅でくつろいでいただけます。</div></div>
                <div class="faq-item"><div class="faq-q"><span>Q</span> マンションの駐車場でも作業できますか？</div><div class="faq-a"><span>A</span> はい、可能です。通常の乗り降りができるスペースがあれば問題ありません。事前に駐車場の写真をLINEでお送りいただければより正確にお答えできます。</div></div>
                <div class="faq-item"><div class="faq-q"><span>Q</span> ${pref}のどのエリアまで対応しますか？</div><div class="faq-a"><span>A</span> ${pref}全域に対応しています。${city}など、県内全域に出張します。出張費は見積もりに含まれています。</div></div>
                <div class="faq-item"><div class="faq-q"><span>Q</span> 施工後に追加料金が発生することはありますか？</div><div class="faq-a"><span>A</span> 一切ありません。事前のお見積もり金額がそのままお支払い金額です。万が一追加作業が必要な場合は、必ず事前にご了承をいただいてから進めます。</div></div>
            </div>
        </div>
    </section>
"@
}

$accordionJs = @"
        document.querySelectorAll('.faq-q').forEach(q => { q.addEventListener('click', () => { const item = q.closest('.faq-item'); const isOpen = item.classList.contains('open'); document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open')); if (!isOpen) item.classList.add('open'); }); });
"@

# --- Page definitions ---
$pages = @(
    @{
        url = "shiga"
        pref = "滋賀県"
        city = "大津市・草津市・彦根市・長浜市・守山市・栗東市・東近江市・近江八幡市・甲賀市・高島市・野洲市・米原市"
    },
    @{
        url = "nara"
        pref = "奈良県"
        city = "奈良市・橿原市・大和郡山市・天理市・生駒市・香芝市・葛城市・宇陀市・桜井市・御所市・五條市"
    },
    @{
        url = "wakayama"
        pref = "和歌山県"
        city = "和歌山市・橋本市・海南市・田辺市・有田市・御坊市・新宮市・岩出市・紀の川市"
    },
    @{
        url = "aichi"
        pref = "愛知県"
        city = "名古屋市・豊田市・岡崎市・一宮市・豊橋市・西尾市・刈谷市・安城市・春日井市・小牧市・瀬戸市"
    }
)

foreach ($page in $pages) {
    $file = Join-Path $base "$($page.url)\index.html"
    Write-Host "Processing $($page.pref)... ($file)"
    
    if (-not (Test-Path $file)) {
        Write-Host "  ERROR: File not found!"
        continue
    }
    
    $content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
    
    # 1. Replace old JSON-LD with @graph version
    $oldJsonPattern = '(?s)\s*\{\s*"@context":\s*"https://schema\.org",\s*"@type":\s*"LocalBusiness".*?\}\s*</script>\s*</head>'
    $newJsonLd = Get-JsonLd -pref $page.pref -prefName $page.pref -url $page.url -city $page.city
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, $oldJsonPattern, "`n$newJsonLd")
    
    # 2. Insert AIO definition box after fv-sub paragraph
    $defBox = Get-DefinitionBox -pref $page.pref
    $fvSubPattern = '(<p class="fv-sub">.*?</p>\s*<div class="container">)'
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, $fvSubPattern, "`$1`n$defBox", [System.Text.RegularExpressions.RegexOptions]::Singleline)
    
    # 3. Replace FAQ section
    $oldFaqPattern = '(?s)<section class="faq-section"[^>]*>.*?</section>'
    $newFaq = Get-FaqSection -pref $page.pref -city $page.city
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, $oldFaqPattern, $newFaq)
    
    # 4. Add accordion JS before </script> at end
    $content = $content -replace '(window\.addEventListener\(''scroll''[^;]+;\s*\n\s*</script>)', "`$1`n        $accordionJs"
    $content = $content -replace '(window\.addEventListener\(''scroll''[^;]+;\}\);\s*\n\s*</script>)', "`$1`n        $accordionJs"
    
    # Write back
    [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
    Write-Host "  Done: $($page.pref)"
}

Write-Host "All pages processed!"
