let veiculoEmEdicao = null; // Variável para armazenar o veículo em edição

// Carrega os modelos e preenche o select
document.addEventListener('DOMContentLoaded', async () => {
    await carregarModelos();
    await listarVeiculos();
});

// Função para carregar os modelos
async function carregarModelos() {
    try {
        const response = await fetch('/modelos'); // Chama a API para buscar os modelos
        if (!response.ok) {
            throw new Error(`Erro na resposta da API: ${response.statusText}`);
        }
        const modelos = await response.json(); // Converte a resposta para JSON

        const modeloSelect = document.getElementById('modeloSelect');

        // Preencher o <select> com os modelos recebidos
        modelos.forEach(modelo => {
            const option = document.createElement('option');
            option.value = modelo.id; // Assume que o campo id está presente
            option.textContent = modelo.nome; // Exibe apenas o nome do modelo
            modeloSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao buscar modelos:', error);
    }
}

// Evento de submit do formulário
document.getElementById('formVeiculo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const modelo_id = e.target.modelo_id.value; // Captura o ID do modelo
    const placa = e.target.placa.value;
    const cor = e.target.cor.value;
    const ano_fabricacao = e.target.ano_fabricacao.value; // Ano de fabricação
    const ano_modelo = e.target.ano_modelo.value; // Ano do modelo
    const valor = e.target.valor.value; // Valor do veículo
    const vendido = e.target.vendido.value; // Status de vendido

    try {
        const response = await fetch('/veiculos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modelo_id, placa, cor, ano_fabricacao, ano_modelo, valor, vendido }),
        });

        if (response.ok) {
            e.target.reset(); // Limpa o formulário
            await listarVeiculos(); // Atualiza a lista de veículos
            alert('Veículo adicionado com sucesso!');
        } else {
            const errorResponse = await response.json();
            alert(`Erro: ${errorResponse.message}`);
        }
    } catch (error) {
        console.error('Erro ao adicionar veículo:', error);
        alert('Erro ao adicionar veículo. Tente novamente.');
    }
});

// Função para listar veículos
async function listarVeiculos() {
    try {
        const response = await fetch('/veiculos');
        if (!response.ok) {
            throw new Error(`Erro na resposta da API: ${response.statusText}`);
        }
        const veiculos = await response.json();
        console.log(veiculos); // Para inspecionar a estrutura dos dados

        const lista = document.getElementById('listaVeiculos');

        // Obter os nomes das montadoras com base nos IDs
        const montadorasResponse = await fetch('/montadoras');
        if (!montadorasResponse.ok) {
            throw new Error(`Erro ao buscar montadoras: ${montadorasResponse.statusText}`);
        }
        const montadoras = await montadorasResponse.json();
        const montadorasMap = {};
        
        // Mapeia o ID da montadora para o nome
        montadoras.forEach(montadora => {
            montadorasMap[montadora.id] = montadora.nome;
        });

        // Atualiza a lista de veículos na página
        lista.innerHTML = '<h2>Lista de Veículos:</h2>';
        
        for (const v of veiculos) {
            // Chamada para buscar o modelo com base no modelo_id
            const modeloResponse = await fetch(`/modelos/${v.modelo_id}`);
            if (!modeloResponse.ok) {
                console.error('Erro ao buscar modelo:', modeloResponse.statusText);
                continue; // Pula para o próximo veículo se houver erro
            }
            const modelo = await modeloResponse.json();

            const modeloNome = modelo ? modelo.nome : 'Modelo não encontrado';
            const montadoraId = modelo.montadora_id; // ID da montadora do modelo
            const montadoraNome = montadorasMap[montadoraId] || 'Montadora não encontrada'; // Nome da montadora
            const valorFormatado = Number(v.valor).toFixed(2); // Formatação do valor
            
            // Atualiza a lista com o formato solicitado
            lista.innerHTML += `
                <div class="veiculo-item">
                    <strong>Placa:</strong> ${v.placa}<br>
                    <strong>Modelo:</strong> ${modeloNome} (${montadoraNome})<br>
                    <strong>Cor:</strong> ${v.cor}<br>
                    <strong>Ano de Fabricação:</strong> ${v.ano_fabricacao}<br>
                    <strong>Ano do Modelo:</strong> ${v.ano_modelo}<br>
                    <strong>Valor:</strong> R$ ${valorFormatado}<br>
                    <strong>Vendido:</strong> ${v.vendido ? 'Sim' : 'Não'}<br>
                    <button onclick="removerVeiculo('${v.id}')">Remover</button>
                    <button onclick="editarVeiculo('${v.id}')">Editar</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao listar veículos:', error);
    }
}




// Função para remover um veículo
// Função para remover um veículo
async function removerVeiculo(id) {
    try {
        const response = await fetch(`/veiculos/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            alert('Veículo removido com sucesso!');
            await listarVeiculos(); // Atualiza a lista de veículos
        } else {
            const errorResponse = await response.json();
            alert(`Erro ao remover veículo: ${errorResponse.message}`);
        }
    } catch (error) {
        console.error('Erro ao remover veículo:', error);
        alert('Erro ao remover veículo. Tente novamente.');
    }
}

// Função para editar um veículo
async function editarVeiculo(id) {
    try {
        // Busca o veículo pelo id
        const response = await fetch(`/veiculos/${id}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar o veículo');
        }
        const veiculo = await response.json();

        // Preenche o formulário com os dados do veículo
        const form = document.getElementById('formVeiculo');
        form.modelo_id.value = veiculo.modelo_id;
        form.placa.value = veiculo.placa;
        form.cor.value = veiculo.cor;
        form.ano_fabricacao.value = veiculo.ano_fabricacao;
        form.ano_modelo.value = veiculo.ano_modelo;
        form.valor.value = veiculo.valor;
        form.vendido.value = veiculo.vendido;

        // Armazena o veículo sendo editado
        veiculoEmEdicao = veiculo;

        // Exibe o formulário (caso esteja escondido)
        form.style.display = 'block';
        
        // Adiciona um event listener para o submit do formulário
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const modelo_id = form.modelo_id.value;
            const placa = form.placa.value;
            const cor = form.cor.value;
            const ano_fabricacao = form.ano_fabricacao.value;
            const ano_modelo = form.ano_modelo.value;
            const valor = form.valor.value;
            const vendido = form.vendido.value;

            try {
                // Atualiza o veículo existente
                const updateResponse = await fetch(`/veiculos/${veiculoEmEdicao.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ modelo_id, placa, cor, ano_fabricacao, ano_modelo, valor, vendido }),
                });

                if (updateResponse.ok) {
                    alert('Veículo editado com sucesso!');
                } else {
                    const errorResponse = await updateResponse.json();
                    alert(`Erro: ${errorResponse.message}`);
                }

                form.reset(); // Limpa o formulário
                veiculoEmEdicao = null; // Reseta o veículo em edição
                listarVeiculos(); // Atualiza a lista de veículos
            } catch (error) {
                console.error('Erro ao salvar veículo:', error);
                alert('Erro ao salvar veículo. Tente novamente.');
            }
        };
    } catch (error) {
        console.error('Erro ao carregar veículo para edição:', error);
        alert('Erro ao carregar veículo para edição.');
    }
}
