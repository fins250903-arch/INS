$urls = @(
    "https://insbs.net/ok2/wp-content/uploads/2025/09/carclean15kb.jpg",
    "https://insbs.net/ok2/wp-content/uploads/2024/02/badge92.png",
    "https://insbs.net/ok2/wp-content/uploads/2024/02/icon_sokujitsu.png",
    "https://insbs.net/ok2/wp-content/uploads/2024/02/icon_jimoto.png",
    "https://insbs.net/ok2/wp-content/uploads/2024/02/icon_jisseki.png",
    "https://insbs.net/ok2/wp-content/uploads/2024/02/cleaning_flow_1.jpg",
    "https://insbs.net/ok2/wp-content/uploads/2024/02/cleaning_flow_2.jpg",
    "https://insbs.net/ok2/wp-content/uploads/2024/02/cleaning_flow_3.jpg",
    "https://insbs.net/ok2/wp-content/uploads/2024/02/cleaning_flow_4.jpg",
    "https://insbs.net/ok2/wp-content/uploads/2024/02/testimonial_handwritten.jpg",
    "https://insbs.net/ok2/wp-content/uploads/2024/02/staff_photo.jpg",
    "https://insbs.net/ok2/wp-content/uploads/2025/03/ins-clean-logo.png"
)

if (-not (Test-Path "src/assets/images")) {
    New-Item -ItemType Directory -Path "src/assets/images"
}

$userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
$referer = "https://insbs.net/ok2/"

foreach ($url in $urls) {
    $filename = [System.IO.Path]::GetFileName($url)
    $dest = "src/assets/images/$filename"
    Write-Host "Downloading $url to $dest"
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -UserAgent $userAgent -Headers @{ "Referer" = $referer } -ErrorAction Stop
    } catch {
        Write-Warning "Failed to download $url : $_"
    }
}
