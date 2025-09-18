<?php
session_start();

// Verificar login
if (isset($_POST['username']) && isset($_POST['password'])) {
    $usuarios = [
        ['username' => 'admin', 'password' => 'cruzeiro2024'],
        ['username' => 'Marco', 'password' => '12345678']
    ];
    
    foreach ($usuarios as $usuario) {
        if ($_POST['username'] === $usuario['username'] && 
            $_POST['password'] === $usuario['password']) {
            $_SESSION['logged_in'] = true;
            $_SESSION['username'] = $usuario['username'];
            break;
        }
    }
}

if (!isset($_SESSION['logged_in'])) {
    include 'login.php';
    exit;
}

// Logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: index.php');
    exit;
}

// Funções para manipular JSON
function lerJSON($arquivo) {
    $caminho = "Json/$arquivo";
    if (!file_exists($caminho)) return [];
    
    $json = file_get_contents($caminho);
    return json_decode($json, true) ?? [];
}

function salvarJSON($arquivo, $dados) {
    $caminho = "Json/$arquivo";
    $json = json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return file_put_contents($caminho, $json);
}

// Processar ações
if ($_POST) {
    $acao = $_POST['acao'] ?? '';
    $arquivo = $_POST['arquivo'] ?? '';
    
    switch($acao) {
        case 'adicionar':
            $dados = lerJSON($arquivo);
            if ($arquivo === 'failed_addresses.json') {
                $dados[] = $_POST['endereco'];
            } else {
                $novo = [
                    'lat' => (float)$_POST['lat'],
                    'lng' => (float)$_POST['lng'],
                    'nome' => $_POST['nome'] ?? null,
                    'cidade' => $_POST['cidade'] ?? null,
                    'imagem_URL' => $_POST['imagem_URL'] ?? null,
                    'endereco_encontrado' => $_POST['endereco_encontrado'],
                    'region' => $_POST['region'] ?? 'brasil'
                ];
                if ($arquivo === 'schools.json') {
                    $novo['endereco'] = $_POST['endereco'] ?? '';
                    $novo['telefone'] = $_POST['telefone'] ?? '';
                    $novo['whatsapp'] = $_POST['whatsapp'] ?? '';
                    $novo['instagram'] = $_POST['instagram'] ?? null;
                    $novo['instagram_url'] = $_POST['instagram_url'] ?? null;
                    $novo['estado'] = $_POST['estado'] ?? '';
                } elseif ($arquivo === 'news.json') {
                    $novo = [
                        'title' => $_POST['title'],
                        'date' => $_POST['date'],
                        'content' => $_POST['content'],
                        'image_URL' => $_POST['image_URL'] ?? null,
                        'category' => $_POST['category'] ?? 'Esporte'
                    ];
                }
                $dados[] = $novo;
            }
            salvarJSON($arquivo, $dados);
            break;
            
        case 'editar':
            $dados = lerJSON($arquivo);
            $index = (int)$_POST['index'];
            if (isset($dados[$index])) {
                if ($arquivo === 'failed_addresses.json') {
                    $dados[$index] = $_POST['endereco'];
                } elseif ($arquivo === 'news.json') {
                    $dados[$index] = [
                        'title' => $_POST['title'],
                        'date' => $_POST['date'],
                        'content' => $_POST['content'],
                        'image_URL' => $_POST['image_URL'] ?: null,
                        'category' => $_POST['category'] ?? 'Esporte'
                    ];
                } else {
                    $dados[$index]['lat'] = (float)$_POST['lat'];
                    $dados[$index]['lng'] = (float)$_POST['lng'];
                    $dados[$index]['nome'] = $_POST['nome'] ?: null;
                    $dados[$index]['cidade'] = $_POST['cidade'] ?: null;
                    $dados[$index]['imagem_URL'] = $_POST['imagem_URL'] ?: null;
                    $dados[$index]['endereco_encontrado'] = $_POST['endereco_encontrado'];
                    $dados[$index]['region'] = $_POST['region'] ?? 'brasil';
                    if ($arquivo === 'schools.json') {
                        $dados[$index]['endereco'] = $_POST['endereco'] ?? '';
                        $dados[$index]['telefone'] = $_POST['telefone'] ?? '';
                        $dados[$index]['whatsapp'] = $_POST['whatsapp'] ?? '';
                        $dados[$index]['instagram'] = $_POST['instagram'] ?: null;
                        $dados[$index]['instagram_url'] = $_POST['instagram_url'] ?: null;
                        $dados[$index]['estado'] = $_POST['estado'] ?? '';
                    }
                }
                salvarJSON($arquivo, $dados);
            }
            break;
            
        case 'deletar':
            $dados = lerJSON($arquivo);
            $index = (int)$_POST['index'];
            if (isset($dados[$index])) {
                array_splice($dados, $index, 1);
                salvarJSON($arquivo, $dados);
            }
            break;
    }
    
    header('Location: index.php?tab=' . ($_POST['arquivo'] ?? 'schools.json'));
    exit;
}

$tab_atual = $_GET['tab'] ?? 'schools.json';
$dados = lerJSON($tab_atual);
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Gerenciamento - Escolas Cruzeiro</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>Sistema de Gerenciamento - Escolas Cruzeiro</h1>
        <div class="user-info">
            Logado como: <?= $_SESSION['username'] ?> | <a href="?logout=1">Sair</a>
        </div>
    </header>

    <nav class="tabs">
        <a href="?tab=schools.json" class="<?= $tab_atual === 'schools.json' ? 'active' : '' ?>">
            Escolas (<?= count(lerJSON('schools.json')) ?>)
        </a>
        <a href="?tab=addressSchools.json" class="<?= $tab_atual === 'addressSchools.json' ? 'active' : '' ?>">
            Endereços (<?= count(lerJSON('addressSchools.json')) ?>)
        </a>
        <a href="?tab=failed_addresses.json" class="<?= $tab_atual === 'failed_addresses.json' ? 'active' : '' ?>">
            Falhas (<?= count(lerJSON('failed_addresses.json')) ?>)
        </a>
        <a href="?tab=news.json" class="<?= $tab_atual === 'news.json' ? 'active' : '' ?>">
            Notícias (<?= count(lerJSON('news.json')) ?>)
        </a>
    </nav>

    <main>
        <!-- Formulário de Adição -->
        <div class="form-container">
            <h3>Adicionar Novo Item</h3>
            <form method="POST" id="addForm">
                <input type="hidden" name="acao" value="adicionar">
                <input type="hidden" name="arquivo" value="<?= $tab_atual ?>">
                
                <?php if ($tab_atual === 'failed_addresses.json'): ?>
                    <input type="text" name="endereco" placeholder="Endereço que falhou" required>
                <?php elseif ($tab_atual === 'news.json'): ?>
                    <div class="form-grid">
                        <input type="text" name="title" placeholder="Título" required>
                        <input type="date" name="date" placeholder="Data" required>
                        <input type="url" name="image_URL" placeholder="URL da Imagem">
                        <input type="text" name="category" placeholder="Categoria" value="Esporte">
                        <textarea name="content" placeholder="Conteúdo da notícia" required></textarea>
                    </div>
                <?php else: ?>
                    <div class="form-grid">
                        <input type="text" name="nome" placeholder="Nome">
                        <input type="text" name="cidade" placeholder="Cidade" required>
                        <input type="url" name="imagem_URL" placeholder="URL da Imagem">
                        <input type="number" step="any" name="lat" placeholder="Latitude" required>
                        <input type="number" step="any" name="lng" placeholder="Longitude" required>
                        <input type="text" name="region" placeholder="Região" value="brasil">
                        <textarea name="endereco_encontrado" placeholder="Endereço encontrado" required></textarea>
                        
                        <?php if ($tab_atual === 'schools.json'): ?>
                            <input type="text" name="endereco" placeholder="Endereço original">
                            <input type="text" name="telefone" placeholder="Telefone">
                            <input type="text" name="whatsapp" placeholder="WhatsApp URL">
                            <input type="text" name="instagram" placeholder="Instagram @">
                            <input type="text" name="instagram_url" placeholder="Instagram URL">
                            <input type="text" name="estado" placeholder="Estado (UF)">
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
                
                <button type="submit">Adicionar</button>
            </form>
        </div>

        <!-- Lista de Dados -->
        <div class="data-container">
            <h3><?= ucfirst(str_replace(['.json', '_'], ['', ' '], $tab_atual)) ?> (<?= count($dados) ?> itens)</h3>
            
            <?php if ($tab_atual === 'news.json'): ?>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Data</th>
                                <th>Categoria</th>
                                <th>Conteúdo</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach($dados as $index => $item): ?>
                            <tr>
                                <td><?= htmlspecialchars($item['title']) ?></td>
                                <td><?= htmlspecialchars($item['date']) ?></td>
                                <td><?= htmlspecialchars($item['category']) ?></td>
                                <td class="endereco"><?= htmlspecialchars(substr($item['content'], 0, 100)) ?>...</td>
                                <td class="actions">
                                    <button onclick="editarItem(<?= $index ?>)">Editar</button>
                                    <form method="POST" style="display:inline;" onsubmit="return confirm('Deletar?')">
                                        <input type="hidden" name="acao" value="deletar">
                                        <input type="hidden" name="arquivo" value="<?= $tab_atual ?>">
                                        <input type="hidden" name="index" value="<?= $index ?>">
                                        <button type="submit">Deletar</button>
                                    </form>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php elseif ($tab_atual === 'failed_addresses.json'): ?>
                <div class="failed-addresses">
                    <?php foreach($dados as $index => $endereco): ?>
                        <div class="failed-item">
                            <span><?= htmlspecialchars($endereco) ?></span>
                            <div class="actions">
                                <button onclick="editarFailed(<?= $index ?>, '<?= htmlspecialchars($endereco, ENT_QUOTES) ?>')">Editar</button>
                                <form method="POST" style="display:inline;" onsubmit="return confirm('Deletar?')">
                                    <input type="hidden" name="acao" value="deletar">
                                    <input type="hidden" name="arquivo" value="<?= $tab_atual ?>">
                                    <input type="hidden" name="index" value="<?= $index ?>">
                                    <button type="submit">Deletar</button>
                                </form>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php else: ?>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Cidade</th>
                                <th>Coordenadas</th>
                                <?php if ($tab_atual === 'schools.json'): ?>
                                    <th>Telefone</th>
                                    <th>Instagram</th>
                                    <th>Estado</th>
                                <?php endif; ?>
                                <th>Endereço</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach($dados as $index => $item): ?>
                            <tr>
                                <td><?= htmlspecialchars($item['cidade'] ?? $item['nome']) ?></td>
                                <td><?= $item['lat'] ?>, <?= $item['lng'] ?></td>
                                <?php if ($tab_atual === 'schools.json'): ?>
                                    <td><?= htmlspecialchars($item['telefone'] ?? '') ?></td>
                                    <td><?= $item['instagram'] ? htmlspecialchars($item['instagram']) : '-' ?></td>
                                    <td><?= htmlspecialchars($item['estado'] ?? '') ?></td>
                                <?php endif; ?>
                                <td class="endereco"><?= htmlspecialchars($item['endereco_encontrado']) ?></td>
                                <td class="actions">
                                    <button onclick="editarItem(<?= $index ?>)">Editar</button>
                                    <form method="POST" style="display:inline;" onsubmit="return confirm('Deletar?')">
                                        <input type="hidden" name="acao" value="deletar">
                                        <input type="hidden" name="arquivo" value="<?= $tab_atual ?>">
                                        <input type="hidden" name="index" value="<?= $index ?>">
                                        <button type="submit">Deletar</button>
                                    </form>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>
    </main>

    <!-- Modal de Edição -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <h3>Editar Item</h3>
            <form method="POST" id="editForm">
                <input type="hidden" name="acao" value="editar">
                <input type="hidden" name="arquivo" value="<?= $tab_atual ?>">
                <input type="hidden" name="index" id="editIndex">
                <div id="editFields"></div>
                <div class="modal-actions">
                    <button type="submit">Salvar</button>
                    <button type="button" onclick="fecharModal()">Cancelar</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        const dados = <?= json_encode($dados) ?>;
        const tabAtual = '<?= $tab_atual ?>';
        
        function editarItem(index) {
            const item = dados[index];
            document.getElementById('editIndex').value = index;
            
            let fields = '';
            if (tabAtual === 'failed_addresses.json') {
                fields = `<input type="text" name="endereco" value="${item}" required>`;
            } else if (tabAtual === 'news.json') {
                fields = `
                    <div class="form-grid">
                        <input type="text" name="title" value="${item.title}" required>
                        <input type="date" name="date" value="${item.date}" required>
                        <input type="url" name="image_URL" value="${item.image_URL || ''}">
                        <input type="text" name="category" value="${item.category}">
                        <textarea name="content" required>${item.content}</textarea>
                    </div>
                `;
            } else {
                fields = `
                    <div class="form-grid">
                        <input type="text" name="nome" value="${item.nome || ''}">
                        <input type="text" name="cidade" value="${item.cidade || ''}" required>
                        <input type="url" name="imagem_URL" value="${item.imagem_URL || ''}">
                        <input type="number" step="any" name="lat" value="${item.lat}" required>
                        <input type="number" step="any" name="lng" value="${item.lng}" required>
                        <input type="text" name="region" value="${item.region || 'brasil'}">
                        <textarea name="endereco_encontrado" required>${item.endereco_encontrado}</textarea>
                `;
                
                if (tabAtual === 'schools.json') {
                    fields += `
                        <input type="text" name="endereco" value="${item.endereco || ''}">
                        <input type="text" name="telefone" value="${item.telefone || ''}">
                        <input type="text" name="whatsapp" value="${item.whatsapp || ''}">
                        <input type="text" name="instagram" value="${item.instagram || ''}">
                        <input type="text" name="instagram_url" value="${item.instagram_url || ''}">
                        <input type="text" name="estado" value="${item.estado || ''}">
                    `;
                }
                fields += '</div>';
            }
            
            document.getElementById('editFields').innerHTML = fields;
            document.getElementById('editModal').style.display = 'flex';
        }
        
        function editarFailed(index, endereco) {
            editarItem(index);
        }
        
        function fecharModal() {
            document.getElementById('editModal').style.display = 'none';
        }
        
        // Fechar modal clicando fora
        window.onclick = function(event) {
            const modal = document.getElementById('editModal');
            if (event.target === modal) {
                fecharModal();
            }
        }
    </script>
</body>
</html>