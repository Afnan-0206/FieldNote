# scripts/publish_prs.ps1
# Automates pushing main and all 10 feature branches to GitHub and creating Pull Requests via GitHub API

param (
    [string]$GitHubToken = $env:GITHUB_TOKEN,
    [string]$RepoOwner = "Afnan-0206",
    [string]$RepoName = "FieldNote"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  FieldNote - 10 Automated Pull Requests Publisher 🌿     " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Prompt for GitHub Personal Access Token if not already set
if ([string]::IsNullOrWhiteSpace($GitHubToken)) {
    Write-Host "`nPlease enter your GitHub Personal Access Token (classic or fine-grained with 'repo' scope):" -ForegroundColor Yellow
    Write-Host "(Get one from https://github.com/settings/tokens if you haven't yet)" -ForegroundColor DarkGray
    $GitHubToken = Read-Host "GitHub Token"
}

if ([string]::IsNullOrWhiteSpace($GitHubToken)) {
    Write-Host "`nNo GitHub token provided. Running in Git-Push-Only mode (you can open PRs via web links)." -ForegroundColor DarkYellow
}

# Define the 10 PRs
$prs = @(
    @{
        Branch = "feat/github-actions-ci"
        Title = "ci: add GitHub Actions workflow for lint, test, and build matrix"
        Body = @"
### Overview
Adds an automated continuous integration workflow for FieldNote using GitHub Actions.

### What's Changed
- Configures Node.js 20.x and 22.x matrix builds
- Runs ESLint with zero-warning threshold
- Runs backend unit tests (`server.test.js` & `functions.test.js`)
- Validates Vite production bundle build

### Verification
- Tested locally on Windows and verified cleanly passing.
"@
    },
    @{
        Branch = "feat/sound-volume-controls"
        Title = "feat: add audio volume slider, mute toggle, and synthesizer tone presets for pocket mode"
        Body = @"
### Overview
Enhances the Web Audio API synthesizer in Pocket Mode with customizable volume, mute toggle, and three distinct harmonic nature presets.

### What's Changed
- Pure Web Audio API tone synthesis with zero external audio assets
- Added presets: *Singing Bowl* (528/660/792 Hz), *Crystal Bell* (880/1056/1320 Hz), and *Earth Gong* (220/330/440 Hz)
- Volume slider (10% to 100%) and instant sound preview
- Settings persisted in localStorage

### Verification
- Tested sound rendering and confirmed zero network calls.
"@
    },
    @{
        Branch = "feat/weather-seasonal-tagging"
        Title = "feat: add weather conditions and seasonal environmental tags to nature journal entries"
        Body = @"
### Overview
Expands the naturalist observation metadata schema to record local weather conditions and current season for deeper outdoor journaling.

### What's Changed
- Added Weather Condition selector (Sunny, Overcast, Light Rain, Fog/Mist, Breezy, Snow)
- Added Season selector (Spring, Summer, Autumn, Winter)
- Visual badge pills rendered on journal cards and archive detail modals
- Preserved in browser-local storage

### Verification
- Verified persistence and responsive layout.
"@
    },
    @{
        Branch = "feat/photo-sketch-attachments"
        Title = "feat: add local botanical photo and sketch attachment preview and storage"
        Body = @"
### Overview
Allows naturalists to attach a physical observation photo or botanical field sketch directly to their journal entries.

### What's Changed
- Canvas-based client-side downscaling (max 900px, JPEG 0.75) to prevent local storage quota exhaustion
- Photo dropzone with instant thumbnail preview and remove capability
- Displays photograph banner on journal entry cards and high-res preview in archive modal
- 100% on-device image processing with zero cloud telemetry

### Verification
- Tested image compression and localStorage safety.
"@
    },
    @{
        Branch = "feat/species-checklist"
        Title = "feat: add tactile naturalist species observation tally counter and checklist"
        Body = @"
### Overview
Introduces a tactile observation counter for cataloging sightings (birds, wildflowers, trees, moss, fungi, pollinators, tracks, water bodies).

### What's Changed
- Dedicated `SpeciesChecklist.jsx` component with increment/decrement counters
- Running total sightings badge and reset button
- 1-click button to append formatted sightings summary directly into raw observation notes
- Clean responsive design adapting to mobile and desktop

### Verification
- Verified button interactions and state synchronization with journal input.
"@
    },
    @{
        Branch = "feat/printable-field-guide"
        Title = "feat: add printable vintage botanical field log and archive dossier stylesheet"
        Body = @"
### Overview
Adds dedicated print layouts and 1-click print buttons allowing naturalists to print physical nature binder logs.

### What's Changed
- Added 'Print Field Sheet' button in note details modal
- Added 'Print Archives' in field library header
- Clean `@media print` CSS stylesheet formatting entries into classic botanical log sheets (serif typography, framed observation box, removed digital UI controls)

### Verification
- Verified print preview stylesheet stripping digital navigation and rendering field sheet format.
"@
    },
    @{
        Branch = "feat/nature-streak-badges"
        Title = "feat: add outdoor attention habit streaks and botanical milestone badges system"
        Body = @"
### Overview
Introduces a gamified yet mindful milestone badge system celebrating real-world time spent outside away from screens.

### What's Changed
- Added `calculateBadges()` utility in storage engine
- Badges: *First Sprout* (1 mission), *30 Mins Grounded* (30 min outside), *Canopy Seeker* (3 sessions), *Century Naturalist* (100 min), *Dedicated Grass Toucher* (5 notes), *Master Naturalist* (10 notes)
- Visual milestone cards rendered on Home Dashboard with unlocked status and progress trackers

### Verification
- Verified automatic badge unlocking as missions and notes accumulate.
"@
    },
    @{
        Branch = "feat/csv-data-export"
        Title = "feat: add CSV data export for citizen science and ecological research analysis"
        Body = @"
### Overview
Empowers naturalists and amateur ecologists to export all field notes into a standard CSV spreadsheet for GIS mapping, Excel, or citizen science archives.

### What's Changed
- Added `exportAllAsCsv()` in `src/lib/storage.js`
- Escaped RFC 4180 CSV generation supporting titles, locations, durations, weather, seasons, reflections, and raw notes
- 'Export (CSV)' button placed in Field Library header actions

### Verification
- Verified CSV file generation and Excel formatting.
"@
    },
    @{
        Branch = "feat/pwa-offline-support"
        Title = "feat: add Progressive Web App manifest and offline service worker for field use"
        Body = @"
### Overview
Enables FieldNote to be installed as a Progressive Web App (PWA) and operate completely offline in remote wilderness areas.

### What's Changed
- Added `public/manifest.json` with theme color `#2d5a3f` and botanical app icons
- Added cache-first service worker (`public/sw.js`) caching core app shell and SVG icons
- Updated `index.html` with mobile PWA meta tags
- Registered service worker in `src/main.jsx` for production builds

### Verification
- Validated manifest schema and build output.
"@
    },
    @{
        Branch = "feat/naturalist-keyboard-shortcuts"
        Title = "feat: add naturalist keyboard navigation shortcuts and shortcuts reference dialog"
        Body = @"
### Overview
Adds global keyboard shortcuts and a quick-help modal dialog for screen-efficient, distraction-free navigation.

### What's Changed
- Keyboard shortcuts: `H` (Home), `M` (Mission), `J` (Journal), `L` (Library), `?` (Shortcuts Help), `Esc` (Close dialogs)
- Form input safety: ignores shortcuts while typing in text inputs or textareas
- Added `KeyboardShortcutsModal.jsx` and header quick-access button

### Verification
- Verified key bindings and modal focus handling.
"@
    }
)

# 2. Push main branch first
Write-Host "`n[Step 1/3] Pushing 'main' branch to origin/main..." -ForegroundColor Cyan
git push origin main

# 3. Push each branch
Write-Host "`n[Step 2/3] Pushing 10 feature branches to origin..." -ForegroundColor Cyan
foreach ($item in $prs) {
    Write-Host "  -> Pushing $($item.Branch)..." -ForegroundColor Yellow
    git push -u origin $item.Branch
}

# 4. Open PRs via GitHub REST API (or generate direct creation links)
Write-Host "`n[Step 3/3] Creating Pull Requests on GitHub..." -ForegroundColor Cyan

if (-not [string]::IsNullOrWhiteSpace($GitHubToken)) {
    $headers = @{
        "Authorization" = "Bearer $GitHubToken"
        "Accept" = "application/vnd.github.v3+json"
        "User-Agent" = "FieldNote-PR-Publisher"
    }

    $createdPrs = @()
    $index = 1
    foreach ($item in $prs) {
        Write-Host "  [$index/10] Creating PR for branch '$($item.Branch)'..." -ForegroundColor Yellow
        $payload = @{
            title = $item.Title
            head = $item.Branch
            base = "main"
            body = $item.Body
        } | ConvertTo-Json -Depth 5

        try {
            $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$RepoOwner/$RepoName/pulls" -Method Post -Headers $headers -Body $payload -ContentType "application/json"
            Write-Host "       ✔ PR #$($response.number) Created: $($response.html_url)" -ForegroundColor Green
            $createdPrs += $response.html_url
        } catch {
            $errMessage = $_.Exception.Message
            if ($_.ErrorDetails) {
                $errMessage += " - " + $_.ErrorDetails.Message
            }
            Write-Host "       ⚠ Could not create PR via API: $errMessage" -ForegroundColor Red
            Write-Host "       Fallback Link: https://github.com/$RepoOwner/$RepoName/compare/main...$($item.Branch)?expand=1" -ForegroundColor DarkGray
        }
        $index++
    }

    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host "  Successfully processed all 10 Pull Requests! 🎉          " -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    if ($createdPrs.Count -gt 0) {
        Write-Host "`nLive Pull Requests:" -ForegroundColor Cyan
        $createdPrs | ForEach-Object { Write-Host " - $_" -ForegroundColor White }
    }
} else {
    Write-Host "`n10 branches pushed! Open each PR in your browser with 1 click:" -ForegroundColor Cyan
    foreach ($item in $prs) {
        Write-Host " -> $($item.Title):" -ForegroundColor Yellow
        Write-Host "    https://github.com/$RepoOwner/$RepoName/compare/main...$($item.Branch)?expand=1`n" -ForegroundColor White
    }
}
