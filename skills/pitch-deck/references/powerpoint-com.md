# PowerPoint automation (Windows + PowerPoint only)

Three PowerShell scripts that let PowerPoint itself do what no library does exactly: embed fonts, export the PDF, measure text with its own layout engine, and render each slide to PNG. Generalised from WasteOS's `embed_and_export.ps1`, `qa_overflow.ps1` and `render.ps1`.

Tested while this skill was built (Windows 11, PowerPoint 16 / Microsoft 365): `embed-and-export` grew an 8-slide deck from 0.0 to 0.8 MB with nine embedded font parts and wrote the PDF twin; `qa-overflow` flagged a planted TOO TALL, TOO WIDE and OFF-SLIDE and then found three real TOO TALL stat boxes in the pptxgenjs starter; `render-slides` exported eight PNGs. Each run takes about two seconds.

Save each block as a `.ps1` file in your project's `deck/` folder and run it with `powershell -ExecutionPolicy Bypass -File <script> ...`.

Rules the scripts follow:
- Open files with no window (`Presentations.Open(path, readOnly, 0, 0)`).
- Count the user's open presentations on attach and call `Quit()` only when there were none. PowerPoint is single-instance: an unconditional `Quit()` closes the user's own work. PowerPoint exits a few seconds after the PowerShell process ends.
- Run `python pptx_kit.py check deck.pptx` first: a file with negative extents opens with a Repair prompt, and with no window that prompt can block the script.

## Embed fonts and export the PDF twin

```powershell
# embed-and-export.ps1 · re-save a generated deck from PowerPoint with TrueType fonts embedded, export a PDF
# twin, and warn about fonts that cannot be embedded. Windows + PowerPoint only.
# usage: powershell -ExecutionPolicy Bypass -File embed-and-export.ps1 -In build\raw.pptx -Out out\Deck.pptx [-Pdf out\Deck.pdf]
param(
  [Parameter(Mandatory = $true)][string]$In,
  [Parameter(Mandatory = $true)][string]$Out,
  [string]$Pdf = ""
)
$ErrorActionPreference = "Stop"
$In = (Resolve-Path $In).Path
$Out = [System.IO.Path]::GetFullPath($Out)
if (-not $Pdf) { $Pdf = [System.IO.Path]::ChangeExtension($Out, ".pdf") }
$Pdf = [System.IO.Path]::GetFullPath($Pdf)
New-Item -ItemType Directory -Force (Split-Path $Out) | Out-Null
foreach ($f in @($Out, $Pdf)) { if (Test-Path $f) { Remove-Item $f -Force } }
$ppt = New-Object -ComObject PowerPoint.Application
$userDocs = $ppt.Presentations.Count   # presentations the user already has open: never quit on top of them
try {
  $pres = $ppt.Presentations.Open($In, 0, 0, 0)        # read/write, not untitled, no window
  foreach ($font in $pres.Fonts) {                      # a font that is not embeddable stays out, whatever you ask
    if ($font.Embeddable -ne -1) { "warn  font '{0}' is not embeddable (licence); swap it for a system-safe face" -f $font.Name }
  }
  $pres.SaveAs($Out, 24, -1)                            # 24 = ppSaveAsOpenXMLPresentation, -1 = embed TrueType fonts
  $pres.SaveAs($Pdf, 32)                                # 32 = ppSaveAsPDF
  $pres.Close()
} finally {
  if ($pres) { try { [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($pres) } catch {} }
  if ($userDocs -eq 0) { $ppt.Quit() }        # only an instance with none of the user's documents open
  [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($ppt)
}
"{0}  {1:N1} MB" -f $Out, ((Get-Item $Out).Length / 1MB)
"{0}  {1:N1} MB" -f $Pdf, ((Get-Item $Pdf).Length / 1MB)
"verify: python pptx_kit.py check <out.pptx> --require-embedded-fonts"
```

The `Embedded` flag PowerPoint reports in memory right after `SaveAs` stays false; verify the saved file instead: `pptx_kit.py check out\Deck.pptx --require-embedded-fonts` reads the font list from the package. OFL fonts (Barlow, IBM Plex, Anton, Space Grotesk, JetBrains Mono) and the Windows system faces used here are embeddable. A single-weight face such as Anton has no bold: never ask for bold, the renderer smears a fake one (FLOODLIGHT's build script carried that warning).

## Overflow QA with PowerPoint's own layout engine

```powershell
# qa-overflow.ps1 · text-fit QA with PowerPoint's own layout engine. Windows + PowerPoint only.
# Flags every text frame whose laid-out text is taller or wider than its box (minus margins), and
# every shape past the slide edge, with a 2 pt tolerance (width gets 5 pt more for glyph overhang).
# usage: powershell -ExecutionPolicy Bypass -File qa-overflow.ps1 -Deck out\Deck.pptx [-Tol 2]
param([Parameter(Mandatory = $true)][string]$Deck, [double]$Tol = 2.0)
$ErrorActionPreference = "Stop"
$Deck = (Resolve-Path $Deck).Path
$ppt = New-Object -ComObject PowerPoint.Application
$userDocs = $ppt.Presentations.Count   # presentations the user already has open: never quit on top of them
$issues = 0
try {
  $pres = $ppt.Presentations.Open($Deck, -1, 0, 0)     # read-only, no window
  [double]$slideW = $pres.PageSetup.SlideWidth; [double]$slideH = $pres.PageSetup.SlideHeight
  foreach ($s in $pres.Slides) {
    $idx = [int]$s.SlideIndex
    foreach ($sh in $s.Shapes) {
      try {
        [double]$l = $sh.Left; [double]$t = $sh.Top; [double]$w = $sh.Width; [double]$h = $sh.Height
        if (($l -lt -$Tol) -or ($t -lt -$Tol) -or (($l + $w) -gt ($slideW + $Tol)) -or (($t + $h) -gt ($slideH + $Tol))) {
          "OFF-SLIDE  s{0,-2} {1,-28} L={2:N1} T={3:N1} W={4:N1} H={5:N1} pt" -f $idx, $sh.Name, $l, $t, $w, $h
          $issues++
        }
        if (-not $sh.HasTextFrame) { continue }
        $tf = $sh.TextFrame2
        if (-not $tf.HasText) { continue }
        $tr = $tf.TextRange
        [double]$innerW = $w - [double]$tf.MarginLeft - [double]$tf.MarginRight
        [double]$innerH = $h - [double]$tf.MarginTop - [double]$tf.MarginBottom
        [double]$bh = $tr.BoundHeight; [double]$bw = $tr.BoundWidth
        $txt = ([string]$tr.Text) -replace "[\r\n\v]+", " / "
        if ($txt.Length -gt 60) { $txt = $txt.Substring(0, 60) + "..." }
        if ($bh -gt ($innerH + $Tol)) {
          "TOO TALL   s{0,-2} need {1,6:N1} pt, box {2,6:N1} pt, lines={3}  '{4}'" -f $idx, $bh, $innerH, $tr.Lines().Count, $txt
          $issues++
        }
        if ($bw -gt ($innerW + $Tol + 5)) {                 # +5 pt: glyph overhang on one-line labels
          "TOO WIDE   s{0,-2} need {1,6:N1} pt, box {2,6:N1} pt  '{3}'" -f $idx, $bw, $innerW, $txt
          $issues++
        }
      } catch { "ERR        s{0} {1}: {2}" -f $idx, $sh.Name, $_.Exception.Message }
    }
  }
  $pres.Close()
} finally {
  if ($pres) { try { [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($pres) } catch {} }
  if ($userDocs -eq 0) { $ppt.Quit() }        # only an instance with none of the user's documents open
  [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($ppt)
}
"QA done: $issues issue(s)"
if ($issues -gt 0) { exit 1 }
```

Organiser art that bleeds off the slide on purpose shows up as OFF-SLIDE on every slide; `pptx_kit.py check` groups those repeats into one line. TOO TALL is the finding that matters: the starter's build-time estimator missed three big stat numbers that PowerPoint measured at 64.8 pt in a 61.9 pt box.

## Render every slide to PNG, then look

```powershell
# render-slides.ps1 · export slides to PNG with PowerPoint itself (true fonts, true layout), so the
# agent can look at them. Windows + PowerPoint only.
# usage: powershell -ExecutionPolicy Bypass -File render-slides.ps1 -Deck out\Deck.pptx -Out qa\slides [-Width 1920] [-Only "3,5"]
param(
  [Parameter(Mandatory = $true)][string]$Deck,
  [Parameter(Mandatory = $true)][string]$Out,
  [int]$Width = 1920,
  [string]$Only = ""
)
$ErrorActionPreference = "Stop"
$Deck = (Resolve-Path $Deck).Path
New-Item -ItemType Directory -Force $Out | Out-Null
$Out = (Resolve-Path $Out).Path
$ppt = New-Object -ComObject PowerPoint.Application
$userDocs = $ppt.Presentations.Count   # presentations the user already has open: never quit on top of them
try {
  $pres = $ppt.Presentations.Open($Deck, -1, 0, 0)
  $height = [int][math]::Round($Width * $pres.PageSetup.SlideHeight / $pres.PageSetup.SlideWidth)   # keep the deck's aspect
  $want = @()
  if ($Only) { $want = $Only.Split(",") | ForEach-Object { [int]$_ } }
  for ($i = 1; $i -le $pres.Slides.Count; $i++) {
    if ($want.Count -gt 0 -and -not ($want -contains $i)) { continue }
    $f = Join-Path $Out ("slide{0:D2}.png" -f $i)
    $pres.Slides.Item($i).Export($f, "PNG", $Width, $height)
    $f
  }
  $pres.Close()
} finally {
  if ($pres) { try { [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($pres) } catch {} }
  if ($userDocs -eq 0) { $ppt.Quit() }        # only an instance with none of the user's documents open
  [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($ppt)
}
```

Look at every PNG (an agent can read images; tile them into one sheet first when there are many). For a PDF made by `embed-and-export.ps1`, `qa-pdf.py` gives zoom crops and footer strips too.

## Without PowerPoint

- **LibreOffice** (`soffice` on PATH, or `C:\Program Files\LibreOffice\program\soffice.exe`): `soffice --headless --convert-to pdf --outdir out out/Deck.pptx`, then `qa-pdf.py out/Deck.pdf --sheet`. It substitutes missing fonts, so trust it for layout and overflow, not for typography. Not installed on the machine this skill was built on, so this path is untested here.
- **Neither:** render on any machine with PowerPoint or Keynote before submitting, or switch to route D (an image-per-slide PPTX from the HTML render), which looks the same everywhere because nothing is re-laid-out.
