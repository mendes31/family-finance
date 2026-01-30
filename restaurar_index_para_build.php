<?php
/**
 * Restaura o index.html original antes de fazer build
 * Execute este script antes de npm run build se necessário
 */

$index_original = __DIR__ . '/index_original.html';
$index_root = __DIR__ . '/index.html';

if (file_exists($index_original)) {
    copy($index_original, $index_root);
    echo "✅ index.html restaurado para versão original (com /src/main.tsx)\n";
    echo "   Agora você pode executar: npm run build\n";
} else {
    // Se não existe backup, criar um novo baseado no padrão do Vite
        $content = '<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="/family_finance/favicon.ico" />
    <link rel="shortcut icon" type="image/x-icon" href="/family_finance/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Family Finance Hub</title>
    <meta name="description" content="Sistema de gerenciamento financeiro familiar" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>';
    
    file_put_contents($index_root, $content);
    copy($index_root, $index_original);
    echo "✅ index.html criado/restaurado para versão original\n";
    echo "   Backup salvo em index_original.html\n";
}

