$json = Get-Content "src/data/wp-posts.json" -Raw | ConvertFrom-Json
$empty = $json | Where-Object { !$_.slug -or $_.slug -eq "" }
if ($empty) {
  Write-Host "Posts with empty slugs: $($empty.Count)"
  $empty | Select-Object id, title | Format-Table
} else {
  Write-Host "✓ All posts have slugs"
}
