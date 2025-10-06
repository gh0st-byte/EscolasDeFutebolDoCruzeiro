<?php
session_start();

// Gerar token CSRF
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Verificar login (apenas se não for ação administrativa)
if (isset($_POST['username']) && isset($_POST['password']) && !isset($_POST['acao'])) {
    $usuarios = lerJSON('.user.json');
    
    foreach ($usuarios as $usuario) {
        if ($_POST['username'] === $usuario['username'] && 
            password_verify($_POST['password'], $usuario['password'])) {
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
    $allowed_files = ['schools.json', 'failed_addresses.json', 'news.json', 'news_draft.json', '.user.json'];
    if (!in_array($arquivo, $allowed_files)) return [];
    
    $caminho = "../data/Json/$arquivo";
    if (!file_exists($caminho)) return [];
    
    $json = file_get_contents($caminho);
    return json_decode($json, true) ?? [];
}

function salvarJSON($arquivo, $dados) {
    $allowed_files = ['schools.json', 'failed_addresses.json', 'news.json', 'news_draft.json', '.user.json'];
    if (!in_array($arquivo, $allowed_files)) return false;
    
    $caminho = "../data/Json/$arquivo";
    $json = json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return file_put_contents($caminho, $json);
}
function processarAcoesUsuario($acao, $arquivo, $dados) {
    $index = (int)($_POST['index'] ?? -1);
    
    switch ($acao) {
        case 'adicionar':
            $novo = [
                'username' => htmlspecialchars($_POST['username'], ENT_QUOTES, 'UTF-8'),
                'password' => password_hash($_POST['password'], PASSWORD_DEFAULT)
            ];
            $dados[] = $novo;
            break;

        case 'editar':
            if ($index >= 0 && isset($dados[$index])) {
                $dados[$index]['username'] = htmlspecialchars($_POST['username'], ENT_QUOTES, 'UTF-8');
                if (!empty($_POST['password'])) {
                    $dados[$index]['password'] = password_hash($_POST['password'], PASSWORD_DEFAULT);
                }
            }
            break;

        case 'deletar':
            if ($index >= 0 && isset($dados[$index])) {
                unset($dados[$index]);
                $dados = array_values($dados);
            }
            break;
            
        default:
            return false;
    }

    return salvarJSON($arquivo, $dados);
}
// Debug temporário
if ($_POST) {
    error_log('POST recebido: ' . print_r($_POST, true));
}

// Processar ações administrativas
if ($_POST && isset($_POST['acao']) && isset($_POST['arquivo'])) {
    $acao = $_POST['acao'] ?? '';
    $arquivo = $_POST['arquivo'] ?? '';
    
    // Validar CSRF token para ações administrativas
    if (!isset($_POST['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Token CSRF inválido']);
        exit;
    }
    
    // Validar arquivo permitido
    $allowed_files = ['schools.json', 'failed_addresses.json', 'news.json', 'news_draft.json', '.user.json'];
    if (!in_array($arquivo, $allowed_files)) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Arquivo não permitido']);
        exit;
    }
    
    // Lógica especial para .user.json
    if ($arquivo === '.user.json') {
        error_log('Processando .user.json - Ação: ' . $acao);
        $dados = lerJSON($arquivo);
        error_log('Dados antes: ' . print_r($dados, true));
        $resultado = processarAcoesUsuario($acao, $arquivo, $dados);
        error_log('Resultado: ' . ($resultado ? 'sucesso' : 'falha'));
        if (!$resultado) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Erro ao processar ação']);
            exit;
        }
    } 
    // **Lógica para todos os outros arquivos**
    else {
        switch($acao) {
            case 'adicionar':
                $dados = lerJSON($arquivo);
                if ($arquivo === 'failed_addresses.json') {
                    $dados[] = $_POST['endereco'];
                } else {
                    // Lógica para adicionar School, News, etc. (mantida)
                    $novo = [
                        'lat' => (float)$_POST['lat'],
                        'lng' => (float)$_POST['lng'],
                        'nome' => $_POST['nome'] ?? null,
                        'cidade' => $_POST['cidade'] ?? null,
                        'imagem_URL' => $_POST['imagem_URL'] ?? null,
                        'endereco_encontrado' => $_POST['endereco_encontrado'],
                        'ComoChegar' => $_POST['ComoChegar'] ?? null,
                        'region' => $_POST['region'] ?? 'Brasil'
                    ];
                    if ($arquivo === 'schools.json') {
                        $novo['endereco'] = $_POST['endereco'] ?? '';
                        $novo['telefone'] = $_POST['telefone'] ?? '';
                        $novo['whatsapp'] = $_POST['whatsapp'] ?? '';
                        $novo['instagram'] = $_POST['instagram'] ?? null;
                        $novo['instagram_url'] = $_POST['instagram_url'] ?? null;
                        $novo['ComoChegar'] = $_POST['ComoChegar'] ?? null;
                        $novo['estado'] = $_POST['estado'] ?? '';
                    } elseif ($arquivo === 'news.json' || $arquivo === 'news_draft.json') {
                        $novo = [
                            'title' => $_POST['title'],
                            'subtitle' => $_POST['subtitle'] ?? '',
                            'dayWeek' => $_POST['dayWeek'] ?? '',
                            'date' => $_POST['date'],
                            'month' => $_POST['month'] ?? '',
                            'content' => $_POST['content'],
                            '1-image_URL' => $_POST['1-image_URL'] ?? null
                        ];
                    }
                    $dados[] = $novo;
                }
                salvarJSON($arquivo, $dados);
                break;
                
            case 'publicar':
                $rascunhos = lerJSON('news_draft.json');
                $noticias = lerJSON('news.json');
                $index = (int)$_POST['index'];
                if (isset($rascunhos[$index])) {
                    $noticias[] = $rascunhos[$index];
                    // Mantém array_splice aqui, pois news_draft.json não precisa de reindexação rigorosa como .user.json
                    array_splice($rascunhos, $index, 1);
                    salvarJSON('news.json', $noticias);
                    salvarJSON('news_draft.json', $rascunhos);
                }
                break;
                
            case 'editar':
                $dados = lerJSON($arquivo);
                $index = (int)$_POST['index'];
                if (isset($dados[$index])) {
                    if ($arquivo === 'failed_addresses.json') {
                        $dados[$index] = $_POST['endereco'];
                    } elseif ($arquivo === 'news.json' || $arquivo === 'news_draft.json') {
                        $dados[$index] = [
                            'title' => $_POST['title'],
                            'subtitle' => $_POST['subtitle'] ?? '',
                            'dayWeek' => $_POST['dayWeek'] ?? '',
                            'date' => $_POST['date'],
                            'month' => $_POST['month'] ?? '',
                            'content' => $_POST['content'],
                            '1-image_URL' => $_POST['1-image_URL'] ?: null
                        ];
                    } else {
                        // Edição para Schools e outros (mantida)
                        $dados[$index]['lat'] = (float)$_POST['lat'];
                        $dados[$index]['lng'] = (float)$_POST['lng'];
                        $dados[$index]['nome'] = $_POST['nome'] ?: null;
                        $dados[$index]['cidade'] = $_POST['cidade'] ?: null;
                        $dados[$index]['imagem_URL'] = $_POST['imagem_URL'] ?: null;
                        $dados[$index]['endereco_encontrado'] = $_POST['endereco_encontrado'];
                        $dados[$index]['ComoChegar'] = $_POST['ComoChegar'] ?: null;
                        $dados[$index]['region'] = $_POST['region'] ?? 'Brasil';
                        if ($arquivo === 'schools.json') {
                            $dados[$index]['endereco'] = $_POST['endereco'] ?? '';
                            $dados[$index]['telefone'] = $_POST['telefone'] ?? '';
                            $dados[$index]['whatsapp'] = $_POST['whatsapp'] ?? '';
                            $dados[$index]['instagram'] = $_POST['instagram'] ?: null;
                            $dados[$index]['instagram_url'] = $_POST['instagram_url'] ?: null;
                            $dados[$index]['ComoChegar'] = $_POST['ComoChegar'] ?: null;
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
                    // Mantém array_splice para outros arquivos (mais simples se a reindexação não for crítica)
                    array_splice($dados, $index, 1);
                    salvarJSON($arquivo, $dados);
                }
                break;
        }
    }
    
    // Redirecionamento (mantido)
    if ($acao === 'publicar') {
        header('Location: index.php?tab=news_draft.json');
    } else {
        header('Location: index.php?tab=' . ($_POST['arquivo'] ?? 'schools.json'));
    }
    exit;
}


$allowed_tabs = ['schools.json', 'failed_addresses.json', 'news.json', 'news_draft.json', '.user.json'];
$tab_atual = in_array($_GET['tab'] ?? '', $allowed_tabs) ? $_GET['tab'] : 'schools.json';
$dados = lerJSON($tab_atual);

// Inverter ordem para notícias (mais recentes primeiro)
if ($tab_atual === 'news.json' || $tab_atual === 'news_draft.json') {
    $dados = array_reverse($dados);
}
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
            Logado como: <?= htmlspecialchars($_SESSION['username'], ENT_QUOTES, 'UTF-8') ?> | <a href="?logout=1">Sair</a>
        </div>
    </header>

    <nav class="tabs">
        <a href="?tab=schools.json" class="<?= $tab_atual === 'schools.json' ? 'active' : '' ?>">
            Escolas (<?= count(lerJSON('schools.json')) ?>)
        </a>

        <a href="?tab=failed_addresses.json" class="<?= $tab_atual === 'failed_addresses.json' ? 'active' : '' ?>">
            Escolas não encontradas (<?= count(lerJSON('failed_addresses.json')) ?>)
        </a>
        <a href="?tab=news_draft.json" class="<?= $tab_atual === 'news_draft.json' ? 'active' : '' ?>">
            Rascunhos de notícias (<?= count(lerJSON('news_draft.json')) ?>)
        </a>
        <a href="?tab=news.json" class="<?= $tab_atual === 'news.json' ? 'active' : '' ?>">
            Notícias (<?= count(lerJSON('news.json')) ?>)
        </a>
        <a href="?tab=.user.json" class="<?= $tab_atual === '.user.json' ? 'active' : '' ?>">
            Usuários (<?= count(lerJSON('.user.json')) ?>)
        </a>
        
    </nav>

    <main>
        <!-- Formulário de Adição -->
        <div class="form-container">
            <h3>Adicionar Novo Item</h3>
            <form method="POST" id="addForm">
                <input type="hidden" name="acao" value="adicionar">
                <input type="hidden" name="arquivo" value="<?= htmlspecialchars($tab_atual, ENT_QUOTES, 'UTF-8') ?>">
                <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
                
                <?php if ($tab_atual === 'failed_addresses.json'): ?>
                    <input type="text" name="endereco" placeholder="Endereço que falhou" required>
                <?php elseif ($tab_atual === 'news.json' || $tab_atual === 'news_draft.json'): ?>
                    <div class="form-grid">
                        <input type="text" name="title" placeholder="Título" required>
                        <input type="text" name="subtitle" placeholder="Subtítulo">
                        <select name="dayWeek">
                            <option value="">Selecione o dia da semana</option>
                            <option value="Segunda-feira">Segunda-feira</option>
                            <option value="Terça-feira">Terça-feira</option>
                            <option value="Quarta-feira">Quarta-feira</option>
                            <option value="Quinta-feira">Quinta-feira</option>
                            <option value="Sexta-feira">Sexta-feira</option>
                            <option value="Sábado">Sábado</option>
                            <option value="Domingo">Domingo</option>
                        </select>
                        <select name="date" required>
                            <option value="">Selecione o dia</option>
                            <?php for($i = 1; $i <= 31; $i++): ?>
                                <option value="<?= sprintf('%02d', $i) ?>"><?= sprintf('%02d', $i) ?></option>
                            <?php endfor; ?>
                        </select>
                        <select name="month">
                            <option value="">Selecione o mês</option>
                            <option value="Janeiro">Janeiro</option>
                            <option value="Fevereiro">Fevereiro</option>
                            <option value="Março">Março</option>
                            <option value="Abril">Abril</option>
                            <option value="Maio">Maio</option>
                            <option value="Junho">Junho</option>
                            <option value="Julho">Julho</option>
                            <option value="Agosto">Agosto</option>
                            <option value="Setembro">Setembro</option>
                            <option value="Outubro">Outubro</option>
                            <option value="Novembro">Novembro</option>
                            <option value="Dezembro">Dezembro</option>
                        </select>
                        <input type="url" name="1-image_URL" placeholder="URL da Imagem">
                        <textarea name="content" placeholder="Conteúdo da notícia" required></textarea>
                    </div>
                <?php elseif ($tab_atual === '.user.json'): ?>
                    <div class="form-grid">
                        <input type="text" name="username" placeholder="Nome de usuário" required>
                        <input type="password" name="password" placeholder="Senha" required>
                    </div>
                <?php else: ?>
                    <div class="form-grid">
                        <input type="text" name="nome" placeholder="Nome">
                        <input type="text" name="cidade" placeholder="Cidade" required>
                        <input type="url" name="imagem_URL" placeholder="URL da Imagem">
                        <input type="number" step="any" name="lat" placeholder="Latitude" required>
                        <input type="number" step="any" name="lng" placeholder="Longitude" required>
                        <select name="region">
                            <option value="Brasil" selected>Brasil</option>
                            <option value="Argentina">Argentina</option>
                            <option value="Chile">Chile</option>
                            <option value="Uruguai">Uruguai</option>
                            <option value="Paraguai">Paraguai</option>
                            <option value="Estados Unidos">Estados Unidos</option>
                            <option value="Canadá">Canadá</option>
                            <option value="México">México</option>
                            <option value="Portugal">Portugal</option>
                            <option value="Espanha">Espanha</option>
                            <option value="França">França</option>
                            <option value="Itália">Itália</option>
                            <option value="Alemanha">Alemanha</option>
                            <option value="Reino Unido">Reino Unido</option>
                            <option value="Japão">Japão</option>
                            <option value="China">China</option>
                            <option value="Austrália">Austrália</option>
                            <option value="Outros">Outros</option>
                        </select>
                        <textarea name="endereco_encontrado" placeholder="Endereço encontrado" required></textarea>
                        
                        <?php if ($tab_atual === 'schools.json'): ?>
                            <input type="text" name="endereco" placeholder="Endereço original">
                            <input type="text" name="telefone" placeholder="Telefone">
                            <input type="text" name="whatsapp" placeholder="WhatsApp URL (basta inserir o numero completo sem símbolos)" value="https://wa.me/+" >
                            <input type="text" name="instagram" placeholder="Instagram @" value="@">
                            <input type="text" name="instagram_url" placeholder="Instagram URL (basta inserir o usuário do instagram)" value="https://www.instagram.com/" >
                            <input type="text" name="ComoChegar" placeholder=" Google maps de Como chegar">
                            <label for="estado" style="color: red; font-weight:900">Observação: Caso o País nativo da escola não seja o Brasil não selecione nenhuma opção de Estado</label>
                            <select name="estado">
                                <option value="">Selecione o Estado</option>
                                <option value="AC">Acre (AC)</option>
                                <option value="AL">Alagoas (AL)</option>
                                <option value="AP">Amapá (AP)</option>
                                <option value="AM">Amazonas (AM)</option>
                                <option value="BA">Bahia (BA)</option>
                                <option value="CE">Ceará (CE)</option>
                                <option value="DF">Distrito Federal (DF)</option>
                                <option value="ES">Espírito Santo (ES)</option>
                                <option value="GO">Goiás (GO)</option>
                                <option value="MA">Maranhão (MA)</option>
                                <option value="MT">Mato Grosso (MT)</option>
                                <option value="MS">Mato Grosso do Sul (MS)</option>
                                <option value="MG">Minas Gerais (MG)</option>
                                <option value="PA">Pará (PA)</option>
                                <option value="PB">Paraíba (PB)</option>
                                <option value="PR">Paraná (PR)</option>
                                <option value="PE">Pernambuco (PE)</option>
                                <option value="PI">Piauí (PI)</option>
                                <option value="RJ">Rio de Janeiro (RJ)</option>
                                <option value="RN">Rio Grande do Norte (RN)</option>
                                <option value="RS">Rio Grande do Sul (RS)</option>
                                <option value="RO">Rondônia (RO)</option>
                                <option value="RR">Roraima (RR)</option>
                                <option value="SC">Santa Catarina (SC)</option>
                                <option value="SP">São Paulo (SP)</option>
                                <option value="SE">Sergipe (SE)</option>
                                <option value="TO">Tocantins (TO)</option>
                            </select>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
                
                <button type="submit">Adicionar</button>
            </form>
        </div>

        <!-- Lista de Dados -->
        <div class="data-container">
            <h3><?= ucfirst(str_replace(['.json', '_'], ['', ' '], $tab_atual)) ?> (<?= count($dados) ?> itens)</h3>
            
            <?php if ($tab_atual === 'news.json' || $tab_atual === 'news_draft.json'): ?>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Subtítulo</th>
                                <th>Data</th>
                                <th>Conteúdo</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach($dados as $index => $item): ?>
                            <tr>
                                <td><?= htmlspecialchars($item['title']) ?></td>
                                <td><?= htmlspecialchars($item['subtitle'] ?? '') ?></td>
                                <td><?= htmlspecialchars(($item['dayWeek'] ?? '') . ', ' . ($item['date'] ?? '') . ' de ' . ($item['month'] ?? '')) ?></td>
                                <td class="endereco"><?= htmlspecialchars(substr($item['content'], 0, 100)) ?>...</td>
                                <td class="actions">
                                    <button onclick="visualizarNoticia(<?= $index ?>)">Visualizar</button>
                                    <button onclick="editarItem(<?= $index ?>)">Editar</button>
                                    <?php if ($tab_atual === 'news_draft.json'): ?>
                                        <form method="POST" style="display:inline;" onsubmit="return confirm('Publicar notícia?')">
                                            <input type="hidden" name="acao" value="publicar">
                                            <input type="hidden" name="arquivo" value="news_draft.json">
                                            <input type="hidden" name="index" value="<?= count(lerJSON('news_draft.json')) - 1 - $index ?>">
                                            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
                                            <button type="submit" style="background: #28a745; color: white;">Publicar</button>
                                        </form>
                                    <?php endif; ?>
                                    <form method="POST" style="display:inline;" onsubmit="return confirm('Deletar?')">
                                        <input type="hidden" name="acao" value="deletar">
                                        <input type="hidden" name="arquivo" value="<?= $tab_atual ?>">
                                        <input type="hidden" name="index" value="<?php 
                                            if ($tab_atual === 'news.json' || $tab_atual === 'news_draft.json') {
                                                echo count(lerJSON($tab_atual)) - 1 - $index;
                                            } else {
                                                echo $index;
                                            }
                                        ?>">
                                        <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
                                        <button type="submit">Deletar</button>
                                    </form>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php elseif ($tab_atual === '.user.json'): ?>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Usuário</th>
                                <th>Senha</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach($dados as $index => $item): ?>
                            <tr>
                                <td><?= htmlspecialchars($item['username']) ?></td>
                                <td>***</td>
                                <td class="actions">
                                    <button onclick="editarItem(<?= $index ?>)">Editar</button>
                                    <form method="POST" style="display:inline;" onsubmit="return confirm('Deletar?')">
                                        <input type="hidden" name="acao" value="deletar">
                                        <input type="hidden" name="arquivo" value="<?= $tab_atual ?>">
                                        <input type="hidden" name="index" value="<?= $index ?>">
                                        <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
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
                                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
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
                                <td><?= htmlspecialchars($item['nome'] ?? $item['cidade']) ?></td>
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
                                        <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
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
                <input type="hidden" name="arquivo" value="<?= htmlspecialchars($tab_atual, ENT_QUOTES, 'UTF-8') ?>">
                <input type="hidden" name="index" id="editIndex">
                <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
                <div id="editFields"></div>
                <div class="modal-actions">
                    <button type="submit">Salvar</button>
                    <button type="button" onclick="fecharModal()">Cancelar</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal de Visualização de Notícia -->
    <div id="newsModal" class="modal">
        <div class="modal-content" style="max-width: 800px;">
            <div class="news-modal-container" style="padding: 2rem; background: linear-gradient(135deg, #0033a0, #1e5bb8); color: white; border-radius: 10px;">
                <h1 class="news-modal-title" id="newsModalLabel" style="margin-bottom: 1.5rem; font-size: 2rem;">Título da Notícia</h1>
                <div class="news-modal-image" id="newsModalImage" style="margin-bottom: 1.5rem;"></div>
                <div class="news-modal-text" id="newsModalBody"></div>
            </div>
            <div class="modal-actions">
                <button type="button" onclick="fecharModalNoticia()">Fechar</button>
            </div>
        </div>
    </div>

    <script>
        const dados = <?= json_encode($dados, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>;
        const tabAtual = <?= json_encode($tab_atual, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>;
        
        function editarItem(index) {
            const realIndex = (tabAtual === 'news.json' || tabAtual === 'news_draft.json') ? 
                dados.length - 1 - index : index;
            const item = dados[index];
            document.getElementById('editIndex').value = realIndex;
            
            let fields = '';
            if (tabAtual === 'failed_addresses.json') {
                fields = `<input type="text" name="endereco" value="${item}" required>`;
            } else if (tabAtual === 'news.json' || tabAtual === 'news_draft.json') {
                fields = `
                    <div class="form-grid">
                        <input type="text" placeholder="Título" name="title" value="${item.title}" required>
                        <input type="text" placeholder="Subtítulo" name="subtitle" value="${item.subtitle || ''}">
                        <select name="dayWeek">
                            <option value="">Selecione o dia da semana</option>
                            <option value="Segunda-feira" ${item.dayWeek === 'Segunda-feira' ? 'selected' : ''}>Segunda-feira</option>
                            <option value="Terça-feira" ${item.dayWeek === 'Terça-feira' ? 'selected' : ''}>Terça-feira</option>
                            <option value="Quarta-feira" ${item.dayWeek === 'Quarta-feira' ? 'selected' : ''}>Quarta-feira</option>
                            <option value="Quinta-feira" ${item.dayWeek === 'Quinta-feira' ? 'selected' : ''}>Quinta-feira</option>
                            <option value="Sexta-feira" ${item.dayWeek === 'Sexta-feira' ? 'selected' : ''}>Sexta-feira</option>
                            <option value="Sábado" ${item.dayWeek === 'Sábado' ? 'selected' : ''}>Sábado</option>
                            <option value="Domingo" ${item.dayWeek === 'Domingo' ? 'selected' : ''}>Domingo</option>
                        </select>
                        <select name="date" required>
                            <option value="">Selecione o dia</option>`;
                        for(let i = 1; i <= 31; i++) {
                            const day = i.toString().padStart(2, '0');
                            fields += `<option value="${day}" ${item.date === day ? 'selected' : ''}>${day}</option>`;
                        }
                        fields += `</select>
                        <select name="month">
                            <option value="">Selecione o mês</option>
                            <option value="Janeiro" ${item.month === 'Janeiro' ? 'selected' : ''}>Janeiro</option>
                            <option value="Fevereiro" ${item.month === 'Fevereiro' ? 'selected' : ''}>Fevereiro</option>
                            <option value="Março" ${item.month === 'Março' ? 'selected' : ''}>Março</option>
                            <option value="Abril" ${item.month === 'Abril' ? 'selected' : ''}>Abril</option>
                            <option value="Maio" ${item.month === 'Maio' ? 'selected' : ''}>Maio</option>
                            <option value="Junho" ${item.month === 'Junho' ? 'selected' : ''}>Junho</option>
                            <option value="Julho" ${item.month === 'Julho' ? 'selected' : ''}>Julho</option>
                            <option value="Agosto" ${item.month === 'Agosto' ? 'selected' : ''}>Agosto</option>
                            <option value="Setembro" ${item.month === 'Setembro' ? 'selected' : ''}>Setembro</option>
                            <option value="Outubro" ${item.month === 'Outubro' ? 'selected' : ''}>Outubro</option>
                            <option value="Novembro" ${item.month === 'Novembro' ? 'selected' : ''}>Novembro</option>
                            <option value="Dezembro" ${item.month === 'Dezembro' ? 'selected' : ''}>Dezembro</option>
                        </select>
                        <input type="url" placeholder="URL da Imagem" name="1-image_URL" value="${item['1-image_URL'] || ''}">
                        <textarea placeholder="Conteúdo" name="content" required>${item.content}</textarea>
                    </div>
                `;
            } else if (tabAtual === '.user.json') {
                fields = `
            <div class="form-grid">
                <input type="text" name="username" value="${item.username}" required>
                <input type="password" name="password" placeholder="Nova senha (deixe vazio para manter atual)">
            </div>
        `;
            } else {
                fields = `
                    <div class="form-grid">
                        <input type="text" placeholder="Nome" name="nome" value="${item.nome || ''}">
                        <input type="text" placeholder="Cidade" name="cidade" value="${item.cidade || ''}" required>
                        <input type="url" placeholder="URL da Imagem" name="imagem_URL" value="${item.imagem_URL || ''}">
                        <input type="number" step="any" placeholder="Latitude" name="lat" value="${item.lat}" required>
                        <input type="number" step="any" placeholder="Longitude" name="lng" value="${item.lng}" required>
                        <select name="region">
                            <option value="Brasil" ${(item.region || 'Brasil') === 'Brasil' ? 'selected' : ''}>Brasil</option>
                            <option value="Argentina" ${item.region === 'Argentina' ? 'selected' : ''}>Argentina</option>
                            <option value="Chile" ${item.region === 'Chile' ? 'selected' : ''}>Chile</option>
                            <option value="Uruguai" ${item.region === 'Uruguai' ? 'selected' : ''}>Uruguai</option>
                            <option value="Paraguai" ${item.region === 'Paraguai' ? 'selected' : ''}>Paraguai</option>
                            <option value="Estados Unidos" ${item.region === 'Estados Unidos' ? 'selected' : ''}>Estados Unidos</option>
                            <option value="Canadá" ${item.region === 'Canadá' ? 'selected' : ''}>Canadá</option>
                            <option value="México" ${item.region === 'México' ? 'selected' : ''}>México</option>
                            <option value="Portugal" ${item.region === 'Portugal' ? 'selected' : ''}>Portugal</option>
                            <option value="Espanha" ${item.region === 'Espanha' ? 'selected' : ''}>Espanha</option>
                            <option value="França" ${item.region === 'França' ? 'selected' : ''}>França</option>
                            <option value="Itália" ${item.region === 'Itália' ? 'selected' : ''}>Itália</option>
                            <option value="Alemanha" ${item.region === 'Alemanha' ? 'selected' : ''}>Alemanha</option>
                            <option value="Reino Unido" ${item.region === 'Reino Unido' ? 'selected' : ''}>Reino Unido</option>
                            <option value="Japão" ${item.region === 'Japão' ? 'selected' : ''}>Japão</option>
                            <option value="China" ${item.region === 'China' ? 'selected' : ''}>China</option>
                            <option value="Austrália" ${item.region === 'Austrália' ? 'selected' : ''}>Austrália</option>
                            <option value="Outros" ${item.region === 'Outros' ? 'selected' : ''}>Outros</option>
                        </select>
                        <textarea placeholder="Endereço Encontrado" name="endereco_encontrado" required>${item.endereco_encontrado}</textarea>
                `;
                
                if (tabAtual === 'schools.json') {
                    fields += `
                        <input type="text" placeholder="Endereço Original" name="endereco" value="${item.endereco || ''}">
                        <input type="text" placeholder="Telefone" name="telefone" value="${item.telefone || ''}">
                        <input type="text" placeholder="WhatsApp" name="whatsapp" value="${item.whatsapp || ''}">
                        <input type="text" placeholder="Instagram" name="instagram" value="${item.instagram || ''}">
                        <input type="text" placeholder="URL do Instagram" name="instagram_url" value="${item.instagram_url || ''}">
                        <input type"text" placeholder="URL do maps de como  chegar" name="ComoChegar" value="${item.ComoChegar || ''}">
                        <select name="estado">
                            <option value="">Selecione o Estado</option>
                            <option value="AC" ${item.estado === 'AC' ? 'selected' : ''}>Acre (AC)</option>
                            <option value="AL" ${item.estado === 'AL' ? 'selected' : ''}>Alagoas (AL)</option>
                            <option value="AP" ${item.estado === 'AP' ? 'selected' : ''}>Amapá (AP)</option>
                            <option value="AM" ${item.estado === 'AM' ? 'selected' : ''}>Amazonas (AM)</option>
                            <option value="BA" ${item.estado === 'BA' ? 'selected' : ''}>Bahia (BA)</option>
                            <option value="CE" ${item.estado === 'CE' ? 'selected' : ''}>Ceará (CE)</option>
                            <option value="DF" ${item.estado === 'DF' ? 'selected' : ''}>Distrito Federal (DF)</option>
                            <option value="ES" ${item.estado === 'ES' ? 'selected' : ''}>Espírito Santo (ES)</option>
                            <option value="GO" ${item.estado === 'GO' ? 'selected' : ''}>Goiás (GO)</option>
                            <option value="MA" ${item.estado === 'MA' ? 'selected' : ''}>Maranhão (MA)</option>
                            <option value="MT" ${item.estado === 'MT' ? 'selected' : ''}>Mato Grosso (MT)</option>
                            <option value="MS" ${item.estado === 'MS' ? 'selected' : ''}>Mato Grosso do Sul (MS)</option>
                            <option value="MG" ${item.estado === 'MG' ? 'selected' : ''}>Minas Gerais (MG)</option>
                            <option value="PA" ${item.estado === 'PA' ? 'selected' : ''}>Pará (PA)</option>
                            <option value="PB" ${item.estado === 'PB' ? 'selected' : ''}>Paraíba (PB)</option>
                            <option value="PR" ${item.estado === 'PR' ? 'selected' : ''}>Paraná (PR)</option>
                            <option value="PE" ${item.estado === 'PE' ? 'selected' : ''}>Pernambuco (PE)</option>
                            <option value="PI" ${item.estado === 'PI' ? 'selected' : ''}>Piauí (PI)</option>
                            <option value="RJ" ${item.estado === 'RJ' ? 'selected' : ''}>Rio de Janeiro (RJ)</option>
                            <option value="RN" ${item.estado === 'RN' ? 'selected' : ''}>Rio Grande do Norte (RN)</option>
                            <option value="RS" ${item.estado === 'RS' ? 'selected' : ''}>Rio Grande do Sul (RS)</option>
                            <option value="RO" ${item.estado === 'RO' ? 'selected' : ''}>Rondônia (RO)</option>
                            <option value="RR" ${item.estado === 'RR' ? 'selected' : ''}>Roraima (RR)</option>
                            <option value="SC" ${item.estado === 'SC' ? 'selected' : ''}>Santa Catarina (SC)</option>
                            <option value="SP" ${item.estado === 'SP' ? 'selected' : ''}>São Paulo (SP)</option>
                            <option value="SE" ${item.estado === 'SE' ? 'selected' : ''}>Sergipe (SE)</option>
                            <option value="TO" ${item.estado === 'TO' ? 'selected' : ''}>Tocantins (TO)</option>
                        </select>
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
        
        function visualizarNoticia(index) {
            const item = dados[index];
            document.getElementById('newsModalLabel').textContent = item.title || 'Notícia';
            
            const imageContainer = document.getElementById('newsModalImage');
            const imageUrl = item['1-image_URL'];
            if (imageUrl) {
                imageContainer.innerHTML = '<img src="' + imageUrl + '" alt="' + (item.title || '') + '" style="width: 100%; max-width: 500px; border-radius: 8px;">';
            } else {
                imageContainer.innerHTML = '';
            }
            
            let dateText = '';
            if (item.dayWeek && item.date && item.month) {
                dateText = item.dayWeek + ', ' + item.date + ' de ' + item.month;
            }
            
            document.getElementById('newsModalBody').innerHTML = 
                '<div class="news-meta" style="margin-bottom: 1rem;">' +
                    (dateText ? '<span class="news-date" style="color: gold; font-weight: 600;">' + dateText + '</span>' : '') +
                '</div>' +
                '<div class="news-content">' +
                    (item.subtitle ? '<h3 style="color: white; margin-bottom: 1rem;">' + item.subtitle + '</h3>' : '') +
                    '<p style="color: rgba(255,255,255,0.95); line-height: 1.6;">' + (item.content || 'Conteúdo não disponível') + '</p>' +
                '</div>';
            
            document.getElementById('newsModal').style.display = 'flex';
        }
        
        function fecharModalNoticia() {
            document.getElementById('newsModal').style.display = 'none';
        }
        
        // Fechar modal clicando fora
        window.onclick = function(event) {
            const editModal = document.getElementById('editModal');
            const newsModal = document.getElementById('newsModal');
            if (event.target === editModal) {
                fecharModal();
            }
            if (event.target === newsModal) {
                fecharModalNoticia();
            }
        }
    </script>
</body>
</html>