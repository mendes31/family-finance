<?php
/**
 * Script para restaurar o index.html original antes de fazer build
 * Uso: php restaurar_index_original.php
 */

$root_dir = __DIR__;
$index_original = $root_dir . '/index_original.html';
$index_root = $root_dir . '/index.html';

if (!file_exists($index_original)) {
    echo "⚠️  Arquivo index_original.html não encontrado!\n";
    echo "   Criando index.html original baseado no template...\n";
    
    // Criar index.html original
    $index_content = <<<'HTML'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Family Finance Hub</title>
    <meta name="description" content="Sistema de gerenciamento financeiro familiar" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
HTML;
    file_put_contents($index_root, $index_content);
    copy($index_root, $index_original);
    echo "✅ index.html original criado\n";
} else {
    copy($index_original, $index_root);
    echo "✅ index.html original restaurado\n";
}

echo "\n📝 Agora você pode fazer build: npm run build\n";

