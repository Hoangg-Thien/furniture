$lines = Get-Content "target\cp.txt"
$cp = $lines[1]
$files = Get-ChildItem -Recurse -Filter *.java "src\main\java" | Select-Object -ExpandProperty FullName
$argsList = @("-cp", $cp, "-d", "target\classes") + $files
[System.IO.File]::WriteAllLines("target\args.txt", $argsList)
javac "@target\args.txt"
if ($LASTEXITCODE -eq 0) {
    Write-Host "COMPILED_SUCCESSFULLY"
} else {
    Write-Host "COMPILE_FAILED with code $LASTEXITCODE"
}
