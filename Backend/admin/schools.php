<?php
$Admin = 'marco.repoles@cruzeiro.com.br';
$passwd = '';

// Função para ler dados do JSON
function lerEscolas() {
    $arquivo = 'schools.json';
    if (!file_exists($arquivo)) {
        return [];
    }
    
    $json = file_get_contents($arquivo);
    $dados = json_decode($json, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        die('Erro no JSON: ' . json_last_error_msg());
    }
    
    return $dados ?? [];
}

// Função para salvar dados no JSON
function salvarEscolas($escolas) {
    $json = json_encode($escolas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return file_put_contents('schools.json', $json);
}

// Função para adicionar nova escola
function adicionarEscola($nome, $lat, $lng, $endereco) {
    $escolas = lerEscolas();
    
    $nova_escola = [
        'lat' => (float)$lat,
        'lng' => (float)$lng,
        'nome' => $nome,
        'endereco_encontrado' => $endereco,
        'region' => 'Brasil',
        'ComoChegar' => 'Como chegar'
    ];
    
    $escolas[] = $nova_escola;
    return salvarEscolas($escolas);
}

// Função para editar escola
function editarEscola($index, $nome, $lat, $lng, $endereco) {
    $escolas = lerEscolas();
    
    if (isset($escolas[$index])) {
        $escolas[$index]['nome'] = $nome;
        $escolas[$index]['lat'] = (float)$lat;
        $escolas[$index]['lng'] = (float)$lng;
        $escolas[$index]['endereco_encontrado'] = $endereco;
        $escolas[$index]['region'] = 'Brasil';
        $escolas[$index]['ComoChegar'] = 'Como chegar (GMapsLink)';
        
        return salvarEscolas($escolas);
    }
    return false;
}

// Função para deletar escola
function deletarEscola($index) {
    $escolas = lerEscolas();
    
    if (isset($escolas[$index])) {
        array_splice($escolas, $index, 1);
        return salvarEscolas($escolas);
    }
    return false;
}

// Processar ações
if ($_POST) {
    $acao = $_POST['acao'] ?? '';
    
    switch($acao) {
        case 'adicionar':
            adicionarEscola($_POST['nome'], $_POST['lat'], $_POST['lng'], $_POST['endereco'], $_POST['ComoChegar']);
            break;
            
        case 'editar':
            editarEscola($_POST['index'], $_POST['nome'], $_POST['lat'], $_POST['lng'], $_POST['endereco'], $_POST['ComoChegar']);
            break;
            
        case 'deletar':
            deletarEscola($_POST['index']);
            break;
    }
    
    // Sanitizar URL para prevenir HTTP Response Splitting
    $location = filter_var($_SERVER['PHP_SELF'], FILTER_SANITIZE_URL);
    $location = str_replace(['\r', '\n', '\0'], '', $location);
    header('Location: ' . $location);
    exit;
}

$escolas = lerEscolas();
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gerenciar Escolas - Cruzeiro</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #0033a0; color: white; }
        .form-container { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px; }
        input, textarea { width: 100%; padding: 8px; margin: 5px 0; }
        button { background: #0033a0; color: white; padding: 10px 20px; border: none; cursor: pointer; }
        button:hover { background: #002080; }
        .edit-btn { background: #28a745; }
        .delete-btn { background: #dc3545; }
    </style>
</head>
<body>
    <h1>Gerenciar Escolas do Cruzeiro</h1>
    
    <!-- Formulário para adicionar nova escola -->
    <div class="form-container">
        <h3>Adicionar Nova Escola</h3>
        <form method="POST">
            <input type="hidden" name="acao" value="adicionar">
            <input type="text" name="nome" placeholder="Nome da escola" required>
            <input type="number" step="any" name="lat" placeholder="Latitude" required>
            <input type="number" step="any" name="lng" placeholder="Longitude" required>
            <textarea name="endereco" placeholder="Endereço completo" required></textarea>
            <textarea name="ComoChegar" placeholder="Como chegar (GMapsLink)" required></textarea>
            <button type="submit">Adicionar Escola</button>
        </form>
    </div>
    
    <!-- Lista de escolas -->
    <h3>Escolas Cadastradas (<?= count($escolas) ?>)</h3>
    <table>
        <tr>
            <th>Nome</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Endereço</th>
            <th>Ações</th>
        </tr>
        <?php foreach($escolas as $index => $escola): ?>
        <tr>
            <td><?= htmlspecialchars($escola['nome']) ?></td>
            <td><?= $escola['lat'] ?></td>
            <td><?= $escola['lng'] ?></td>
            <td><?= htmlspecialchars($escola['endereco_encontrado']) ?></td>
            <td>
                <button class="edit-btn" onclick="editarEscola(<?= $index ?>)">Editar</button>
                <form method="POST" style="display:inline;" onsubmit="return confirm('Deletar esta escola?')">
                    <input type="hidden" name="acao" value="deletar">
                    <input type="hidden" name="index" value="<?= $index ?>">
                    <button type="submit" class="delete-btn">Deletar</button>
                </form>
            </td>
        </tr>
        <?php endforeach; ?>
    </table>
    
    <!-- Modal de edição -->
    <div id="editModal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:white; padding:20px; border:2px solid #ccc; z-index:1000;">
        <h3>Editar Escola</h3>
        <form method="POST">
            <input type="hidden" name="acao" value="editar">
            <input type="hidden" name="index" id="editIndex">
            <input type="text" name="nome" id="editNome" required>
            <input type="number" step="any" name="lat" id="editLat" required>
            <input type="number" step="any" name="lng" id="editLng" required>
            <input type="text" name="ComoChegar" id="editComoChegar" required>
            <textarea name="endereco" id="editEndereco" required></textarea>
            <button type="submit">Salvar</button>
            <button type="button" onclick="document.getElementById('editModal').style.display='none'">Cancelar</button>
        </form>
    </div>
    
    <script>
        function editarEscola(index) {
            const escolas = <?= json_encode($escolas) ?>;
            const escola = escolas[index];
            
            document.getElementById('editIndex').value = index;
            document.getElementById('editNome').value = escola.nome;
            document.getElementById('editLat').value = escola.lat;
            document.getElementById('editLng').value = escola.lng;
            document.getElementById('editEndereco').value = escola.endereco_encontrado;
            document.getElementById('editComoChegar').value = escola.ComoChegar;
            
            document.getElementById('editModal').style.display = 'block';
        }
    </script>
</body>
</html>