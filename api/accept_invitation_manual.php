<?php
/**
 * Script para aceitar convite manualmente via web
 * Acesse: http://localhost/family_finance/api/accept_invitation_manual.php?token=TOKEN
 * 
 * ATENÇÃO: Este script é apenas para casos de emergência.
 * O método recomendado é usar a página /accept-invitation
 */

require_once __DIR__ . '/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$token = $_GET['token'] ?? '';

if (empty($token)) {
    die('Token não fornecido. Use: ?token=TOKEN_DO_CONVITE');
}

?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aceitar Convite - FinFamily</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .error { background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; color: #c62828; }
        .success { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; color: #2e7d32; }
        input, button {
            width: 100%;
            padding: 12px;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-sizing: border-box;
        }
        button {
            background: #4F46E5;
            color: white;
            border: none;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover { background: #4338CA; }
        label { display: block; margin-top: 15px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Aceitar Convite Manualmente</h1>
        
        <?php
        try {
            // Buscar convite
            $stmt = $pdo->prepare("
                SELECT 
                    id, family_id, email, full_name, role, invitation_type, 
                    password_hash, status, expires_at
                FROM family_invitations
                WHERE token = ? AND status = 'pending' AND expires_at > NOW()
                LIMIT 1
            ");
            $stmt->execute([$token]);
            $invitation = $stmt->fetch();
            
            if (!$invitation) {
                echo '<div class="error">';
                echo '<strong>Erro:</strong> Convite não encontrado, já foi aceito ou expirou.';
                echo '</div>';
                exit;
            }
            
            echo '<div class="info">';
            echo '<strong>Convite encontrado:</strong><br>';
            echo 'E-mail: ' . htmlspecialchars($invitation['email']) . '<br>';
            echo 'Nome: ' . htmlspecialchars($invitation['full_name'] ?: 'Não informado') . '<br>';
            echo 'Tipo: ' . ($invitation['invitation_type'] === 'full_register' ? 'Cadastro Completo' : 'Pré-cadastro') . '<br>';
            echo 'Perfil: ' . ($invitation['role'] === 'admin' ? 'Administrador' : 'Usuário') . '<br>';
            echo 'Expira em: ' . date('d/m/Y H:i', strtotime($invitation['expires_at']));
            echo '</div>';
            
            // Verificar se já existe usuário
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
            $stmt->execute([$invitation['email']]);
            $existing_user = $stmt->fetch();
            
            if ($existing_user) {
                echo '<div class="error">';
                echo '<strong>Atenção:</strong> Este e-mail já possui uma conta. Faça login normalmente.';
                echo '</div>';
                echo '<p><a href="/family_finance/auth">Ir para Login</a></p>';
                exit;
            }
            
            // Processar formulário
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $password = $_POST['password'] ?? '';
                $confirm_password = $_POST['confirm_password'] ?? '';
                
                if ($invitation['invitation_type'] === 'pre_register') {
                    // Pré-cadastro: senha obrigatória
                    if (empty($password) || strlen($password) < 6) {
                        echo '<div class="error">Senha deve ter pelo menos 6 caracteres.</div>';
                    } elseif ($password !== $confirm_password) {
                        echo '<div class="error">As senhas não coincidem.</div>';
                    } else {
                        $password_hash = hash_password($password);
                        $create_user = true;
                    }
                } else {
                    // Cadastro completo: usar hash do convite
                    if (empty($password)) {
                        echo '<div class="error">Por favor, insira a senha que foi enviada por e-mail.</div>';
                    } else {
                        // Verificar se a senha está correta
                        if (!password_verify($password, $invitation['password_hash'])) {
                            echo '<div class="error">Senha incorreta. Use a senha exata que foi enviada por e-mail.</div>';
                        } else {
                            $password_hash = $invitation['password_hash'];
                            $create_user = true;
                        }
                    }
                }
                
                if (isset($create_user) && $create_user) {
                    try {
                        $pdo->beginTransaction();
                        
                        // Criar usuário
                        $user_id = generate_uuid();
                        $stmt = $pdo->prepare("
                            INSERT INTO users (id, email, password_hash, email_verified, created_at, updated_at)
                            VALUES (?, ?, ?, TRUE, NOW(), NOW())
                        ");
                        $stmt->execute([$user_id, $invitation['email'], $password_hash]);
                        
                        // Criar perfil
                        $stmt = $pdo->prepare("
                            INSERT INTO profiles (id, full_name, email, created_at, updated_at)
                            VALUES (?, ?, ?, NOW(), NOW())
                        ");
                        $stmt->execute([$user_id, $invitation['full_name'] ?: $invitation['email'], $invitation['email']]);
                        
                        // Criar role
                        $role_id = generate_uuid();
                        $stmt = $pdo->prepare("
                            INSERT INTO user_roles (id, user_id, role, created_at)
                            VALUES (?, ?, ?, NOW())
                        ");
                        $stmt->execute([$role_id, $user_id, $invitation['role']]);
                        
                        // Adicionar à família
                        $member_id = generate_uuid();
                        $stmt = $pdo->prepare("
                            INSERT INTO family_members (id, family_id, user_id, joined_at)
                            VALUES (?, ?, ?, NOW())
                        ");
                        $stmt->execute([$member_id, $invitation['family_id'], $user_id]);
                        
                        // Marcar convite como aceito
                        $stmt = $pdo->prepare("
                            UPDATE family_invitations 
                            SET status = 'accepted', accepted_at = NOW(), updated_at = NOW()
                            WHERE id = ?
                        ");
                        $stmt->execute([$invitation['id']]);
                        
                        $pdo->commit();
                        
                        echo '<div class="success">';
                        echo '<strong>Sucesso!</strong> Convite aceito e conta criada com sucesso!<br>';
                        echo 'Agora você pode fazer login.';
                        echo '</div>';
                        echo '<p><a href="/family_finance/auth">Ir para Login</a></p>';
                        exit;
                        
                    } catch (PDOException $e) {
                        if ($pdo->inTransaction()) {
                            $pdo->rollBack();
                        }
                        echo '<div class="error">Erro ao criar conta: ' . htmlspecialchars($e->getMessage()) . '</div>';
                    }
                }
            } else {
                // Mostrar formulário
                ?>
                <form method="POST">
                    <?php if ($invitation['invitation_type'] === 'full_register'): ?>
                        <label>Senha (use a senha que foi enviada por e-mail):</label>
                        <input type="password" name="password" required placeholder="Cole a senha do e-mail aqui">
                        <small style="color: #666;">Para cadastro completo, você deve usar a senha exata que foi enviada por e-mail.</small>
                    <?php else: ?>
                        <label>Senha (mínimo 6 caracteres):</label>
                        <input type="password" name="password" required minlength="6" placeholder="Digite sua senha">
                        <label>Confirmar Senha:</label>
                        <input type="password" name="confirm_password" required minlength="6" placeholder="Confirme sua senha">
                    <?php endif; ?>
                    
                    <button type="submit">Aceitar Convite e Criar Conta</button>
                </form>
                <?php
            }
            
        } catch (PDOException $e) {
            echo '<div class="error">Erro: ' . htmlspecialchars($e->getMessage()) . '</div>';
        }
        ?>
    </div>
</body>
</html>


