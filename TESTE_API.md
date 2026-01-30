# 🧪 Como Testar a API

## Testar Criação de Família

### Via Navegador (Console)

1. Abra o Console do navegador (F12)
2. Execute:

```javascript
fetch('/family_finance/api/family.php?action=create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ name: 'Teste Família' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Via PowerShell (curl)

```powershell
$body = @{name="Teste Família"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost/family_finance/api/family.php?action=create" -Method POST -Body $body -ContentType "application/json" -SessionVariable session
```

## Verificar Erros

1. Abra o Console do navegador (F12)
2. Vá na aba **Network**
3. Tente criar uma família
4. Clique na requisição `family.php?action=create`
5. Veja a resposta e o status code

## Possíveis Problemas

- **401 Unauthorized**: Sessão não está sendo mantida
- **500 Internal Server Error**: Erro no PHP (verificar logs do Apache)
- **CORS Error**: Problema com headers CORS

---

**Última atualização**: 2026-01-05

