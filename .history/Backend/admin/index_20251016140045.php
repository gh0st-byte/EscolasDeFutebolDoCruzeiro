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
    $allowed_files = ['schools.json', 'failed_addresses.json', 'news.json', 'news_draft.json', '.user.json', 'licenciadosProposta.json'];
    if (!in_array($arquivo, $allowed_files)) return [];
    
    $caminho = "../data/Json/$arquivo";
    if (!file_exists($caminho)) return [];
    
    $json = file_get_contents($caminho);
    return json_decode($json, true) ?? [];
}

function salvarJSON($arquivo, $dados) {
    $allowed_files = ['schools.json', 'failed_addresses.json', 'news.json', 'news_draft.json', '.user.json', 'licenciadosProposta.json'];
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

// Processar propostas de licenciamento
if ($_POST && isset($_POST['action']) && $_POST['action'] === 'save_proposta') {
    header('Content-Type: application/json');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['nome']) || !isset($input['email']) || !isset($input['telefone'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Dados obrigatórios não fornecidos']);
        exit;
    }
    
    $filepath = __DIR__ . '/data/Json/licenciadosProposta.json';
    
    if (!file_exists($filepath)) {
        file_put_contents($filepath, '[]');
    }
    
    $data = json_decode(file_get_contents($filepath), true) ?: [];
    
    $newId = count($data) > 0 ? max(array_column($data, 'id')) + 1 : 1;
    
    $newEntry = [
        'id' => $newId,
        'name' => $input['nome'],
        'email' => $input['email'],
        'whatsapp' => $input['telefone'],
        'cidade de interesse' => $input['cidade'] ?? '',
        'bairro de interesse' => $input['bairro'] ?? '',
        'estado de interesse' => $input['estado'] ?? '',
        'experiencia' => $input['experiencia'] ?? '',
        'capital disponível' => $input['investimento'] ?? '',
        'mensagem' => $input['mensagem'] ?? '',
        'status' => 'Em análise',
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    $data[] = $newEntry;
    
    if (file_put_contents($filepath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        echo json_encode(['success' => true, 'id' => $newId]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao salvar dados']);
    }
    exit;
}

// Atualizar status de proposta
if ($_POST && isset($_POST['action']) && $_POST['action'] === 'update_status') {
    header('Content-Type: application/json');
    
    if (!isset($_POST['id']) || !isset($_POST['status'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID e status são obrigatórios']);
        exit;
    }
    
    $filepath = __DIR__ . '/data/Json/licenciadosProposta.json';
    
    if (!file_exists($filepath)) {
        http_response_code(404);
        echo json_encode(['error' => 'Arquivo não encontrado']);
        exit;
    }
    
    $data = json_decode(file_get_contents($filepath), true) ?: [];
    
    $found = false;
    foreach ($data as &$item) {
        if ($item['id'] == $_POST['id']) {
            $item['status'] = $_POST['status'];
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        http_response_code(404);
        echo json_encode(['error' => 'Proposta não encontrada']);
        exit;
    }
    
    if (file_put_contents($filepath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao atualizar status']);
    }
    exit;
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
    $allowed_files = ['schools.json', 'failed_addresses.json', 'news.json', 'news_draft.json', '.user.json', 'licenciadosProposta.json'];
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

                        'endereco_encontrado' => $_POST['endereco_encontrado'],
                        'ComoChegar' => $_POST['ComoChegar'] ?? 'google.com/maps',
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
                        //Schools e outros
                        $dados[$index]['lat'] = (float)$_POST['lat'];
                        $dados[$index]['lng'] = (float)$_POST['lng'];
                        $dados[$index]['nome'] = $_POST['nome'] ?: null;
                        $dados[$index]['cidade'] = $_POST['cidade'] ?: null;

                        $dados[$index]['endereco_encontrado'] = $_POST['endereco_encontrado'];
                        $dados[$index]['ComoChegar'] = $_POST['ComoChegar'] ?: 'google.com/maps';
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


$allowed_tabs = ['schools.json', 'failed_addresses.json', 'news.json', 'news_draft.json', '.user.json', 'licenciadosProposta.json'];
$tab_atual = in_array($_GET['tab'] ?? '', $allowed_tabs) ? $_GET['tab'] : 'schools.json';
$dados = lerJSON($tab_atual);

// Inverter ordem para notícias e propostas (mais recentes primeiro)
if ($tab_atual === 'news.json' || $tab_atual === 'news_draft.json' || $tab_atual === 'licenciadosProposta.json') {
    $dados = array_reverse($dados);
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Gerenciamento - Escolas Cruzeiro</title>
     <link rel="icon" type="image/png" href="https://imagens.cruzeiro.com.br/Escudos/Cruzeiro.png">
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
        <a href="?tab=licenciadosProposta.json" class="<?= $tab_atual === 'licenciadosProposta.json' ? 'active' : '' ?>">
            Propostas (<?= count(lerJSON('licenciadosProposta.json')) ?>)
        </a>
    </nav>

    <main>
        <?php if ($tab_atual !== 'licenciadosProposta.json'): ?>
        <!-- Formulário de Adição -->
        <div class="form-container">
            <h3>Adicionar Novo Item</h3>
            <form method="POST" id="addForm">
                <input type="hidden" name="acao" value="adicionar">
                <input type="hidden" name="arquivo" value="<?= htmlspecialchars($tab_atual, ENT_QUOTES, 'UTF-8') ?>">
                <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
                
                <?php if ($tab_atual === 'failed_addresses.json'): ?>
                    <div class="field-group">
                        <label> Endereço com Problema</label>
                        <input type="text" name="endereco" placeholder="Digite o endereço que não foi encontrado" required>
                    </div>
                <?php elseif ($tab_atual === 'news.json' || $tab_atual === 'news_draft.json'): ?>
                    <div class="form-grid">
                        <div class="field-group">
                            <label> Título da Notícia *</label>
                            <input type="text" name="title" placeholder="Ex: Cruzeiro inaugura nova escola em BH" required>
                        </div>
                        <div class="field-group">
                            <label> Subtítulo (opcional)</label>
                            <input type="text" name="subtitle" placeholder="Breve descrição da notícia">
                        </div>
                        <div class="field-group">
                            <label> Dia da Semana</label>
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
                        </div>
                        <div class="field-group">
                            <label> Dia do Mês *</label>
                            <select name="date" required>
                                <option value="">Selecione o dia</option>
                                <?php for($i = 1; $i <= 31; $i++): ?>
                                    <option value="<?= sprintf('%02d', $i) ?>"><?= sprintf('%02d', $i) ?></option>
                                <?php endfor; ?>
                            </select>
                        </div>
                        <div class="field-group">
                            <label> Mês</label>
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
                        </div>
                        <div class="field-group">
                            <label> Imagem da Notícia</label>
                            <input type="url" name="1-image_URL" placeholder="https://exemplo.com/imagem.jpg">
                        </div>
                        <div class="field-group full-width">
                            <label> Conteúdo da Notícia *</label>
                            <textarea name="content" placeholder="Escreva o conteúdo completo da notícia aqui..." rows="6" required></textarea>
                        </div>
                    </div>
                <?php elseif ($tab_atual === '.user.json'): ?>
                    <div class="form-grid">
                        <div class="field-group">
                            <label> Nome de Usuário *</label>
                            <input type="text" name="username" placeholder="Digite o nome de usuário" required>
                        </div>
                        <div class="field-group">
                            <label> Senha *</label>
                            <input type="password" name="password" placeholder="Digite uma senha segura" required>
                        </div>
                    </div>
                <?php else: ?>
                    <div class="form-grid">
                        <div class="field-group">
                            <label> Nome da Escola</label>
                            <input type="text" name="nome" placeholder="Ex: Escola Cruzeiro - Castelo">
                        </div>
                        <div class="field-group">
                            <label> Cidade *</label>
                            <input type="text" name="cidade" placeholder="Ex: Belo Horizonte" required>
                        </div>

                        <div class="field-group">
                            <label> Latitude *</label>
                            
                            <input type="number" step="any" name="lat" placeholder="Ex: -19.9227318" required>
                            <small>Use Google Maps para obter coordenadas</small>
                        </div>
                        <div class="field-group">
                            <label> Longitude *</label>
                            <input type="number" step="any" name="lng" placeholder="Ex: -43.9450948" required>
                            <small>Use Google Maps para obter coordenadas</small>
                        </div>
                        <div class="field-group">
                            <label> País/Região</label>
                            <select name="region">
                                <option value="Brasil" selected> Brasil</option>
                                <option value="Argentina"> Argentina</option>
                                <option value="Chile"> Chile</option>
                                <option value="Uruguai"> Uruguai</option>
                                <option value="Paraguai"> Paraguai</option>
                                <option value="Estados Unidos"> Estados Unidos</option>
                                <option value="Canadá"> Canadá</option>
                                <option value="México"> México</option>
                                <option value="Portugal"> Portugal</option>
                                <option value="Espanha"> Espanha</option>
                                <option value="França"> França</option>
                                <option value="Itália"> Itália</option>
                                <option value="Alemanha"> Alemanha</option>
                                <option value="Reino Unido"> Reino Unido</option>
                                <option value="Japão"> Japão</option>
                                <option value="China"> China</option>
                                <option value="Austrália"> Austrália</option>
                                <option value="Outros"> Outros</option>
                            </select>
                        </div>
                        <div class="field-group full-width">
                            <label> Endereço Completo *</label>
                            <textarea name="endereco_encontrado" placeholder="Ex: Rua das Flores, 123 - Bairro Centro - Belo Horizonte/MG" rows="3" required></textarea>
                        </div>
                        
                        <?php if ($tab_atual === 'schools.json'): ?>
                            <div class="field-group">
                                <label> Endereço Original</label>
                                <input type="text" name="endereco" placeholder="Endereço como foi fornecido inicialmente">
                            </div>
                            <div class="field-group">
                                <label> Telefone</label>
                                <input type="text" name="telefone" placeholder="(31) 99999-9999">
                            </div>
                            <div class="field-group">
                                <label> WhatsApp</label>
                                <input type="text" name="whatsapp" placeholder="5531999999999" value="">
                                <small style="color: #e74c3c; font-weight: 900;"> Digite apenas números: 55 + DDD + número</small>
                            </div>
                            <div class="field-group">
                                <label> Instagram (@user)</label>
                                <input type="text" name="instagram" placeholder="@escolacruzeiro">
                            </div>
                            <div class="field-group">
                                <label> URL do Instagram</label>
                                <input type="text" name="instagram_url" placeholder="escolacruzeiro" value="">
                                <small>Digite apenas o nome de usuário (sem @)</small>
                            </div>
                            <div class="field-group">
                                <label> Link Google Maps</label>
                                <input type="text" name="ComoChegar" placeholder="https://maps.google.com/...">
                            </div>
                            <div class="field-group">
                                <label> Estado (apenas para Brasil)</label>
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
                                <small style="color: #e74c3c;">⚠️ Deixe vazio se a escola não for no Brasil</small>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
                
                <button type="submit">Adicionar</button>
            </form>
        </div>
        <?php endif; ?>

        <!-- Lista de Dados -->
        <div class="data-container">
            <?php if ($tab_atual === 'licenciadosProposta.json'): ?>
                <div class="propostas-tabs">
                    <button class="proposta-tab active" onclick="filtrarPropostas('all')">Todas (<?= count($dados) ?>)</button>
                    <button class="proposta-tab em-analise" onclick="filtrarPropostas('Em análise')">Em Análise (<?= count(array_filter($dados, fn($p) => ($p['status'] ?? 'Em análise') === 'Em análise')) ?>)</button>
                    <button class="proposta-tab aprovado" onclick="filtrarPropostas('Aprovado')">Aprovadas (<?= count(array_filter($dados, fn($p) => ($p['status'] ?? '') === 'Aprovado')) ?>)</button>
                    <button class="proposta-tab recusado" onclick="filtrarPropostas('Recusado')">Recusadas (<?= count(array_filter($dados, fn($p) => ($p['status'] ?? '') === 'Recusado')) ?>)</button>
                </div>
            <?php endif; ?>
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
            <?php elseif ($tab_atual === 'licenciadosProposta.json'): ?>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>WhatsApp</th>
                                <th>Cidade</th>
                                <th>Estado</th>
                                <th>Status</th>
                                <th>Data</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach($dados as $index => $item): ?>
                            <tr class="proposta-row" data-status="<?= htmlspecialchars($item['status'] ?? 'Em análise') ?>">
                                <td><?= htmlspecialchars($item['name'] ?? '') ?></td>
                                <td><?= htmlspecialchars($item['email'] ?? '') ?></td>
                                <td><?= htmlspecialchars($item['whatsapp'] ?? '') ?></td>
                                <td><?= htmlspecialchars($item['cidade de interesse'] ?? '') ?></td>
                                <td><?= htmlspecialchars($item['estado de interesse'] ?? '') ?></td>
                                <td>
                                    <span class="status-badge status-<?= strtolower(str_replace(' ', '-', $item['status'] ?? 'Em análise')) ?>">
                                        <?= htmlspecialchars($item['status'] ?? 'Em análise') ?>
                                    </span>
                                </td>
                                <td><?= isset($item['timestamp']) ? date('d/m/Y H:i', strtotime($item['timestamp'])) : '-' ?></td>
                                <td class="actions">
                                    <button onclick="visualizarProposta(<?= $index ?>)">Ver</button>
                                    <?php if (($item['status'] ?? 'Em análise') === 'Em análise'): ?>
                                        <button onclick="atualizarStatus(<?= $item['id'] ?>, 'Aprovado')" style="background: #1e3a8a; color: white;">Aceitar</button>
                                        <button onclick="atualizarStatus(<?= $item['id'] ?>, 'Recusado')" style="background: #dc2626; color: white;">Recusar</button>
                                    <?php endif; ?>
                                    <form method="POST" style="display:inline;" onsubmit="return confirm('Deletar proposta?')">
                                        <input type="hidden" name="acao" value="deletar">
                                        <input type="hidden" name="arquivo" value="<?= $tab_atual ?>">
                                        <input type="hidden" name="index" value="<?= count(lerJSON($tab_atual)) - 1 - $index ?>">
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
            <div class="news-modal-container" style="padding: 2rem; background: white; color: #11114E; border-radius: 10px; text-align: center">
                <h1 class="news-modal-title" id="newsModalLabel" style="margin-bottom: 1.5rem; font-size: 2rem;">Título da Notícia</h1>
                <div class="news-modal-image" id="newsModalImage" style="margin-bottom: 1.5rem;"></div>
                <div class="news-modal-text" id="newsModalBody"></div>
            </div>
            <div class="modal-actions">
                <button type="button" onclick="fecharModalNoticia()">Fechar</button>
            </div>
        </div>
    </div>

    <!-- Modal de Visualização de Proposta -->
    <div id="propostaModal" class="modal">
        <div class="modal-content" style="max-width: 600px;">
            <h3>Detalhes da Proposta</h3>
            <div id="propostaContent"></div>
            <div class="modal-actions">
                <button type="button" onclick="fecharModalProposta()">Fechar</button>
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
                fields = `
                    <div class="field-group">
                        <label>Endereço com Problema</label>
                        <input type="text" name="endereco" value="${escapeHtml(item)}" required>
                    </div>
                `;
            } 
            else if (tabAtual === 'news.json' || tabAtual === 'news_draft.json') {
                fields = `
                    <div class="form-grid">
                        <div class="field-group">
                            <label>Título da Notícia *</label>
                            <input type="text" name="title" value="${escapeHtml(item.title)}" required>
                        </div>
                        <div class="field-group">
                            <label>Subtítulo</label>
                            <input type="text" name="subtitle" value="${escapeHtml(item.subtitle || '')}">
                        </div>
                        <div class="field-group">
                            <label>Dia da Semana</label>
                            <select name="dayWeek">
                                <option value="">Selecione o dia da semana</option>
                                ${['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']
                                  .map(day => `<option value="${day}" ${item.dayWeek === day ? 'selected' : ''}>${day}</option>`).join('')}
                            </select>
                        </div>
                        <div class="field-group">
                            <label>Dia do Mês *</label>
                            <select name="date" required>
                                <option value="">Selecione o dia</option>
                                ${Array.from({length: 31}, (_, i) => {
                                    const day = String(i + 1).padStart(2, '0');
                                    return `<option value="${day}" ${item.date === day ? 'selected' : ''}>${day}</option>`;
                                }).join('')}
                            </select>
                        </div>
                        <div class="field-group">
                            <label>Mês</label>
                            <select name="month">
                                <option value="">Selecione o mês</option>
                                ${['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
                                  .map(month => `<option value="${month}" ${item.month === month ? 'selected' : ''}>${month}</option>`).join('')}
                            </select>
                        </div>
                        <div class="field-group">
                            <label>Imagem da Notícia</label>
                            <input type="url" name="1-image_URL" value="${escapeHtml(item['1-image_URL'] || '')}" placeholder="https://exemplo.com/imagem.jpg">
                        </div>
                        <div class="field-group full-width">
                            <label>Conteúdo da Notícia *</label>
                            <textarea name="content" required rows="6">${escapeHtml(item.content)}</textarea>
                        </div>
                    </div>
                `;
            } 
            else if (tabAtual === '.user.json') {
                fields = `
                    <div class="form-grid">
                        <div class="field-group">
                            <label>Nome de Usuário *</label>
                            <input type="text" name="username" value="${escapeHtml(item.username)}" required>
                        </div>
                        <div class="field-group">
                            <label>Nova Senha</label>
                            <input type="password" name="password" placeholder="Deixe vazio para manter atual">
                            <small>Digite apenas se quiser alterar a senha</small>
                        </div>
                    </div>
                `;
            } 
            else {
                fields = `
                    <div class="form-grid">
                        <div class="field-group">
                            <label>Nome da Escola</label>
                            <input type="text" name="nome" value="${escapeHtml(item.nome || '')}">
                        </div>
                        <div class="field-group">
                            <label>Cidade *</label>
                            <input type="text" name="cidade" value="${escapeHtml(item.cidade || '')}" required>
                        </div>
                        <div class="field-group">

                        </div>
                        <div class="field-group">
                            <label>Latitude *</label>
                            <input type="number" step="any" name="lat" value="${item.lat}" required>
                            <small>Use Google Maps para obter coordenadas</small>
                        </div>
                        <div class="field-group">
                            <label>Longitude *</label>
                            <input type="number" step="any" name="lng" value="${item.lng}" required>
                            <small>Use Google Maps para obter coordenadas</small>
                        </div>
                        <div class="field-group">
                            <label>País/Região</label>
                            <select name="region">
                                ${['Brasil', 'Argentina', 'Chile', 'Uruguai', 'Paraguai', 'Estados Unidos', 'Canadá', 'México', 'Portugal', 'Espanha', 'França', 'Itália', 'Alemanha', 'Reino Unido', 'Japão', 'China', 'Austrália', 'Outros']
                                  .map(region => `<option value="${region}" ${(item.region || 'Brasil') === region ? 'selected' : ''}>${region}</option>`).join('')}
                            </select>
                        </div>
                        <div class="field-group full-width">
                            <label>Endereço Completo *</label>
                            <textarea name="endereco_encontrado" required rows="3">${escapeHtml(item.endereco_encontrado)}</textarea>
                        </div>
                `;
                
                if (tabAtual === 'schools.json') {
                    fields += `
                        <div class="field-group">
                            <label>Endereço Original</label>
                            <input type="text" name="endereco" value="${escapeHtml(item.endereco || '')}">
                        </div>
                        <div class="field-group">
                            <label>Telefone</label>
                            <input type="text" name="telefone" value="${escapeHtml(item.telefone || '')}" placeholder="(31) 99999-9999">
                        </div>
                        <div class="field-group">
                            <label>WhatsApp</label>
                            <input type="text" name="whatsapp" value="${escapeHtml(item.whatsapp || '')}" placeholder="5531999999999">
                            <small style="color: #e74c3c;">Digite apenas números: 55 + DDD + número</small>
                        </div>
                        <div class="field-group">
                            <label>Instagram (@user)</label>
                            <input type="text" name="instagram" value="${escapeHtml(item.instagram || '')}" placeholder="@escolacruzeiro">
                        </div>
                        <div class="field-group">
                            <label>URL do Instagram</label>
                            <input type="text" name="instagram_url" value="${escapeHtml(item.instagram_url || '')}" placeholder="escolacruzeiro">
                            <small>Digite apenas o nome de usuário (sem @)</small>
                        </div>
                        <div class="field-group">
                            <label>Link Google Maps</label>
                            <input type="url" name="ComoChegar" value="${escapeHtml(item.ComoChegar || 'https://www.google.com/maps')}" placeholder="https://maps.google.com/...">
                        </div>
                        <div class="field-group">
                            <label>Estado (apenas Brasil)</label>
                            <select name="estado">
                                <option value="">Selecione o Estado</option>
                                ${[{v:'AC',n:'Acre'},{v:'AL',n:'Alagoas'},{v:'AP',n:'Amapá'},{v:'AM',n:'Amazonas'},{v:'BA',n:'Bahia'},{v:'CE',n:'Ceará'},{v:'DF',n:'Distrito Federal'},{v:'ES',n:'Espírito Santo'},{v:'GO',n:'Goiás'},{v:'MA',n:'Maranhão'},{v:'MT',n:'Mato Grosso'},{v:'MS',n:'Mato Grosso do Sul'},{v:'MG',n:'Minas Gerais'},{v:'PA',n:'Pará'},{v:'PB',n:'Paraíba'},{v:'PR',n:'Paraná'},{v:'PE',n:'Pernambuco'},{v:'PI',n:'Piauí'},{v:'RJ',n:'Rio de Janeiro'},{v:'RN',n:'Rio Grande do Norte'},{v:'RS',n:'Rio Grande do Sul'},{v:'RO',n:'Rondônia'},{v:'RR',n:'Roraima'},{v:'SC',n:'Santa Catarina'},{v:'SP',n:'São Paulo'},{v:'SE',n:'Sergipe'},{v:'TO',n:'Tocantins'}]
                                  .map(estado => `<option value="${estado.v}" ${item.estado === estado.v ? 'selected' : ''}>${estado.n} (${estado.v})</option>`).join('')}
                            </select>
                            <small style="color: #e74c3c;">⚠️ Deixe vazio se a escola não for no Brasil</small>
                        </div>
                    `;
                }
                fields += '</div>';
            }
            
            document.getElementById('editFields').innerHTML = fields;
            document.getElementById('editModal').style.display = 'flex';
        }
        
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
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
            const imageURL = item['1-image_URL'];
            if (imageURL) {
                imageContainer.innerHTML = '<img src="' + imageURL + '" style="width: 100%; max-width: 500px; border-radius: 8px;" alt="Imagem da notícia">';
            } else {
                imageContainer.innerHTML = '';
            }
            
            let dateText = '';
            if (item.dayWeek && item.date && item.month) {
                dateText = item.dayWeek + ', ' + item.date + ' de ' + item.month;
            }
            
            document.getElementById('newsModalBody').innerHTML = 
                '<div class="news-meta" style="margin-bottom: 1rem; text-align: center;">' +
                    (dateText ? '<span class="news-date" style="color: gold; font-weight: 600;">' + dateText + '</span>' : '') +
                '</div>' +
                '<div class="news-content">' +
                    (item.subtitle ? '<h3 style="color:  rgba(0, 8, 67, 0.95); margin-bottom: 1rem;">' + item.subtitle + '</h3>' : '') +
                    '<p style="color: rgba(0, 8, 67, 0.95); line-height: 1.6;">' + (item.content || 'Conteúdo não disponível') + '</p>' +
                '</div>';
            
            document.getElementById('newsModal').style.display = 'flex';
        }
        
        function fecharModalNoticia() {
            document.getElementById('newsModal').style.display = 'none';
        }
        
        function visualizarProposta(index) {
            const item = dados[index];
            const statusClass = (item.status || 'Em análise').toLowerCase().replace(' ', '-').replace('á', 'a');
            const content = `
                <div class="proposta-details-enhanced">
                    <div class="proposta-header">
                        <h4 style="color: #0033a0; margin-bottom: 10px;">${escapeHtml(item.name || 'Nome não informado')}</h4>
                        <span class="status-badge status-${statusClass}" style="font-size: 12px; padding: 4px 12px;">${escapeHtml(item.status || 'Em análise')}</span>
                    </div>
                    
                    <div class="proposta-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                        <div class="info-card">
                            <h5 style="color: #666; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Contato</h5>
                            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${escapeHtml(item.email || '')}" style="color: #0033a0;">${escapeHtml(item.email || 'Não informado')}</a></p>
                            <p style="margin: 5px 0;"><strong>WhatsApp:</strong> <a href="https://wa.me/${escapeHtml(item.whatsapp || '').replace(/\D/g, '')}" target="_blank" style="color: #25D366;">${escapeHtml(item.whatsapp || 'Não informado')}</a></p>
                        </div>
                        
                        <div class="info-card">
                            <h5 style="color: #666; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Localização</h5>
                            <p style="margin: 5px 0;"><strong>Cidade:</strong> ${escapeHtml(item['cidade de interesse'] || 'Não informado')}</p>
                            <p style="margin: 5px 0;"><strong>Bairro:</strong> ${escapeHtml(item['bairro de interesse'] || 'Não informado')}</p>
                            <p style="margin: 5px 0;"><strong>Estado:</strong> ${escapeHtml(item['estado de interesse'] || 'Não informado')}</p>
                        </div>
                        
                        <div class="info-card">
                            <h5 style="color: #666; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Perfil</h5>
                            <p style="margin: 5px 0;"><strong>Experiência:</strong> ${escapeHtml(item.experiencia || 'Não informado')}</p>
                            <p style="margin: 5px 0;"><strong>Investimento:</strong> ${escapeHtml(item['capital disponível'] || 'Não informado')}</p>
                        </div>
                        
                        <div class="info-card">
                            <h5 style="color: #666; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Informações</h5>
                            <p style="margin: 5px 0;"><strong>Data:</strong> ${item.timestamp ? new Date(item.timestamp).toLocaleString('pt-BR') : 'Não informado'}</p>
                            <p style="margin: 5px 0;"><strong>ID:</strong> #${item.id || 'N/A'}</p>
                        </div>
                    </div>
                    
                    ${item.mensagem ? `
                        <div class="mensagem-card" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
                            <h5 style="color: #666; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Mensagem</h5>
                            <p style="line-height: 1.6; color: #333;">${escapeHtml(item.mensagem).replace(/\n/g, '<br>')}</p>
                        </div>
                    ` : ''}
                    
                    ${(item.status || 'Em análise') === 'Em análise' ? `
                        <div class="proposta-actions" style="margin-top: 20px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; tex">
                            <button onclick="atualizarStatus(${item.id}, 'Aprovado'); fecharModalProposta();" style="background: #1e3a8a; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 0 5px; cursor: pointer;">Aceitar Proposta</button>
                            <button onclick="atualizarStatus(${item.id}, 'Recusado'); fecharModalProposta();" style="background: #dc2626; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 0 5px; cursor: pointer;">Recusar Proposta</button>
                        </div>
                    ` : ''}
                </div>
            `;
            document.getElementById('propostaContent').innerHTML = content;
            document.getElementById('propostaModal').style.display = 'flex';
        }
        
        function fecharModalProposta() {
            document.getElementById('propostaModal').style.display = 'none';
        }
        
        function atualizarStatus(id, status) {
            if (!confirm(`Confirma ${status.toLowerCase()} esta proposta?`)) return;
            
            const formData = new FormData();
            formData.append('action', 'update_status');
            formData.append('id', id);
            formData.append('status', status);
            
            fetch('index.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.text())
            .then(data => {
                try {
                    const result = JSON.parse(data);
                    if (result.success) {
                        location.reload();
                    } else {
                        alert('Erro ao atualizar status: ' + (result.error || 'Erro desconhecido'));
                    }
                } catch (e) {
                    console.error('Resposta não é JSON:', data);
                    location.reload();
                }
            })
            .catch(error => {
                alert('Erro ao atualizar status');
                console.error(error);
            });
        }
        
        function filtrarPropostas(status) {
            const rows = document.querySelectorAll('.proposta-row');
            const tabs = document.querySelectorAll('.proposta-tab');
            
            tabs.forEach(tab => tab.classList.remove('active'));
            event.target.classList.add('active');
            
            rows.forEach(row => {
                if (status === 'all' || row.dataset.status === status) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
        
        // Fechar modal clicando fora
        window.onclick = function(event) {
            const editModal = document.getElementById('editModal');
            const newsModal = document.getElementById('newsModal');
            const propostaModal = document.getElementById('propostaModal');
            if (event.target === editModal) {
                fecharModal();
            }
            if (event.target === newsModal) {
                fecharModalNoticia();
            }
            if (event.target === propostaModal) {
                fecharModalProposta();
            }
        }
    </script>
</body>
</html>