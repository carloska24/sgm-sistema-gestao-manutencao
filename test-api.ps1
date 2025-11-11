$body = @{
    prompt = "Crie um checklist de manutenção preventiva semanal"
    entityType = "machine"
} | ConvertTo-Json

Write-Host "Enviando requisição para API..."
Write-Host "Body: $body"

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/generate-checklist" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body `
        -ErrorAction Stop

    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response:"
    Write-Host $response.Content
} catch {
    Write-Host "Erro: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorContent = $reader.ReadToEnd()
        Write-Host "Error Content: $errorContent"
    }
}

