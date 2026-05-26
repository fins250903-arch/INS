$json = Get-Content "src/data/wp-posts.json" -Raw | ConvertFrom-Json
$found = $json | Where-Object { $_.slug -eq "100kincoffee" }
if ($found) {
  Write-Host "✓ FOUND: $($found.title)"
  Write-Host "Slug: $($found.slug)"
} else {
  Write-Host "✗ NOT FOUND in new generation"
  Write-Host "`n100kin posts in JSON:"
  ($json | Where-Object { $_.slug -like "*100kin*" } | Select-Object slug, title) | Format-Table
}
