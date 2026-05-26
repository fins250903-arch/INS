$json = Get-Content "src/data/wp-posts.json" -Raw | ConvertFrom-Json
$sorted = @()
$json | ForEach-Object { $sorted += $_ }

Write-Host "最新5件のブログ（日付の新しい順）:"
for ($i = 0; $i -lt [Math]::Min(5, $sorted.Count); $i++) {
  $post = $sorted[$i]
  Write-Host "  $($i+1). [$($post.date.Substring(0, 10))] $($post.slug): $($post.title)"
}

Write-Host "`n最古5件のブログ（日付が古い順）:"
$lastIdx = $sorted.Count - 1
for ($i = 0; $i -lt 5 -and $lastIdx - $i -ge 0; $i++) {
  $post = $sorted[$lastIdx - $i]
  Write-Host "  $($i+1). [$($post.date.Substring(0, 10))] $($post.slug): $($post.title)"
}
