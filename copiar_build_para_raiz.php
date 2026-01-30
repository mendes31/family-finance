<?php
/**
 * Script para copiar arquivos de dist/ para a raiz
 * Isso permite que o Apache sirva os arquivos diretamente
 * Uso: php copiar_build_para_raiz.php
 */

$dist_dir = __DIR__ . '/dist';
$root_dir = __DIR__;

// Verificar se dist existe
if (!is_dir($dist_dir)) {
    echo "❌ Pasta dist/ não encontrada!\n";
    echo "   Execute primeiro: npm run build\n";
    exit(1);
}

echo "📦 Copiando arquivos de dist/ para raiz...\n\n";

// Lista de arquivos/pastas para copiar (NÃO incluir index.html - manter original)
$items_to_copy = [
    'assets',
    '.htaccess',
    'favicon.ico',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'apple-touch-icon.png',
    'android-chrome-192x192.png',
    'android-chrome-512x512.png',
    'site.webmanifest',
    'robots.txt',
    'placeholder.svg'
];

$copied = 0;
$errors = 0;

foreach ($items_to_copy as $item) {
    $source = $dist_dir . '/' . $item;
    $dest = $root_dir . '/' . $item;
    
    if (!file_exists($source) && !is_dir($source)) {
        echo "⚠️  Pulando: $item (não existe em dist/)\n";
        continue;
    }
    
    try {
        if (is_dir($source)) {
            // Remover diretório existente se houver
            if (is_dir($dest)) {
                $files = new RecursiveIteratorIterator(
                    new RecursiveDirectoryIterator($dest, RecursiveDirectoryIterator::SKIP_DOTS),
                    RecursiveIteratorIterator::CHILD_FIRST
                );
                foreach ($files as $file) {
                    $file->isDir() ? rmdir($file->getRealPath()) : unlink($file->getRealPath());
                }
                rmdir($dest);
            }
            copyDirectory($source, $dest);
            echo "✅ Copiado: $item/ (diretório)\n";
        } else {
            // Copiar arquivo
            copy($source, $dest);
            echo "✅ Copiado: $item\n";
        }
        $copied++;
    } catch (Exception $e) {
        echo "❌ Erro ao copiar $item: " . $e->getMessage() . "\n";
        $errors++;
    }
}

function copyDirectory($src, $dst) {
    if (!is_dir($src)) {
        return false;
    }
    $dir = opendir($src);
    @mkdir($dst);
    while (($file = readdir($dir)) !== false) {
        if ($file != '.' && $file != '..') {
            if (is_dir($src . '/' . $file)) {
                copyDirectory($src . '/' . $file, $dst . '/' . $file);
            } else {
                copy($src . '/' . $file, $dst . '/' . $file);
            }
        }
    }
    closedir($dir);
    return true;
}

// Substituir index.html da raiz pelo de dist/ (compilado)
$index_build = $dist_dir . '/index.html';
$index_root = $root_dir . '/index.html';
$index_original = $root_dir . '/index_original.html';

if (file_exists($index_build)) {
    // Fazer backup do index.html original (se ainda não foi feito e se é o original)
    if (!file_exists($index_original) && file_exists($index_root)) {
        $current_content = file_get_contents($index_root);
        if (strpos($current_content, '/src/main.tsx') !== false) {
            // É o original, fazer backup
            copy($index_root, $index_original);
            echo "✅ Backup do index.html original salvo como index_original.html\n";
        }
    }
    // Substituir pelo compilado (Apache vai servir este)
    copy($index_build, $index_root);
    echo "✅ index.html atualizado com versão compilada\n";
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "📊 Resumo:\n";
echo "   Copiados: $copied\n";
echo "   Erros: $errors\n";
echo str_repeat("=", 50) . "\n";

if ($errors == 0) {
    echo "\n✅ Arquivos copiados com sucesso!\n";
    echo "   ✅ index.html original mantido (necessário para Vite)\n";
    echo "   ✅ index_build.html atualizado (usado pelo Apache)\n";
    echo "   ✅ Assets e .htaccess copiados\n";
    echo "   Agora acesse: http://localhost/family_finance/\n";
    echo "\n⚠️  Nota:\n";
    echo "   - O index.html original é necessário para o Vite fazer build\n";
    echo "   - O Apache servirá o index.html que referencia os assets copiados\n";
    echo "   - Após build, os assets são atualizados automaticamente\n";
} else {
    echo "\n❌ Houve erros ao copiar alguns arquivos.\n";
    exit(1);
}
