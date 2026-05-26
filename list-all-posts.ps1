$json = Get-Content "src/data/wp-posts.json" -Raw | ConvertFrom-Json
Write-Host "Total posts: $($json.Count)"

# スラッグから title を逆引き
$slugTitle = @{}
$json | ForEach-Object {
  $slugTitle[$_.slug] = $_.title
}

# 表示タイトル全部
Write-Host "`nAll post titles:"
$json | ForEach-Object { Write-Host "  $($_.slug): $($_.title)" }
