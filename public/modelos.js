// Variável global para armazenar o modelo em edição
let modeloEmEdicao = null;

// Carrega as montadoras e preenche o select
document.addEventListener('DOMContentLoaded', async () => {
    await carregarMontadoras();
    await listarModelos();
});

// Função para carregar montadoras
async function carregarMontadoras() {
    try {
        const response = await fetch('/montadoras');
        const montadoras = await response.json();

        const montadoraSelect = document.getElementById('montadoraSelect');
        montadoraSelect.innerHTML = ''; // Limpa opções existentes

        montadoras.forEach(montadora => {
            const option = document.createElement('option');
            option.value = montadora.id;
            option.textContent = montadora.nome;
            montadoraSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao buscar montadoras:', error);
    }
}

// Evento de submit do formulário
document.getElementById('formModelo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const montadora_id = e.target.montadora_id.value;
    const nome = e.target.nome.value;
    const motor = e.target.motor.value;
    const valor = e.target.valor.value;
    
    // Corrigido para usar o valor do select
    const automatico = e.target.automatico.value === 'true'; 
    const turbo = e.target.turbo.value === 'true'; 

    const id = modeloEmEdicao ? modeloEmEdicao.id : null; // Obtém o ID do modelo se estiver editando

    try {
        const response = await fetch(id ? `/modelos/${id}` : '/modelos', {
            method: id ? 'PUT' : 'POST', // Altera o método dependendo se está editando ou adicionando
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ montadora_id, nome, motor, valor: parseFloat(valor), automatico, turbo }), // Envio correto do valor
        });

        if (response.ok) {
            e.target.reset();
            modeloEmEdicao = null; // Reseta o modelo em edição
            listarModelos();
            alert('Modelo ' + (id ? 'atualizado' : 'adicionado') + ' com sucesso!');
        } else {
            const errorResponse = await response.json();
            alert(`Erro: ${errorResponse.message}`);
        }
    } catch (error) {
        console.error('Erro ao adicionar ou editar modelo:', error);
        alert('Erro ao adicionar ou editar modelo. Tente novamente.');
    }
});

// Função para listar modelos
async function listarModelos() {
    try {
        const response = await fetch('/modelos');
        const modelos = await response.json();
        const lista = document.getElementById('listaModelos');

        if (Array.isArray(modelos) && modelos.length > 0) {
            const montadoras = await fetch('/montadoras').then(res => res.json());
            const montadorasMap = {};
            montadoras.forEach(montadora => {
                montadorasMap[montadora.id] = montadora.nome;
            });

            lista.innerHTML = '<h2>Lista de Modelos:</h2>' + modelos.map(m => {
                const valor = parseFloat(m.valor); // Converter valor para número
                return `
                    <div class="modelo-item">
                        <strong>Modelo:</strong> ${m.nome}<br>
                        <strong>Montadora:</strong> ${montadorasMap[m.montadora_id] || 'Montadora desconhecida'}<br>
                        <strong>Motor:</strong> ${m.motor}<br>
                        <strong>Valor:</strong> R$ ${isNaN(valor) ? 'Valor inválido' : valor.toFixed(2)}<br>
                        <strong>Automático:</strong> ${m.automatico ? 'Sim' : 'Não'}<br>
                        <strong>Turbo:</strong> ${m.turbo ? 'Sim' : 'Não'}<br>
                        <button onclick="removerModelo('${m.id}')">Remover</button>
                        <button onclick="editarModelo('${m.id}')">Editar</button>
                    </div>
                `;
            }).join('');
        } else {
            lista.innerHTML = '<h2>Lista de Modelos:</h2><p>Nenhum modelo encontrado.</p>';
        }
    } catch (error) {
        console.error('Erro ao listar modelos:', error);
    }
}

// Função para remover um modelo
async function removerModelo(id) {
    try {
        const response = await fetch(`/modelos/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            alert('Modelo removido com sucesso!');
            listarModelos();
        } else {
            const errorResponse = await response.json();
            alert(`Erro ao remover modelo: ${errorResponse.message}`);
        }
    } catch (error) {
        console.error('Erro ao remover modelo:', error);
        alert('Erro ao remover modelo. Tente novamente.');
    }
}

// Função para editar um modelo
async function editarModelo(id) {
    try {
        const response = await fetch(`/modelos/${id}`);
        if (!response.ok) throw new Error('Modelo não encontrado');
        
        const modelo = await response.json();
        const form = document.getElementById('formModelo'); // Altera para usar o formulário correto
        form.nome.value = modelo.nome;
        form.motor.value = modelo.motor;
        form.valor.value = modelo.valor;
        form.montadora_id.value = modelo.montadora_id; // Define a montadora correspondente

        // Altera para usar os selects para "automatico" e "turbo"
        form.automatico.value = modelo.automatico ? 'true' : 'false';
        form.turbo.value = modelo.turbo ? 'true' : 'false';

        // Exibe o formulário
        modeloEmEdicao = modelo; // Armazena o modelo sendo editado
    } catch (error) {
        console.error('Erro ao editar modelo:', error);
        alert('Erro ao editar modelo. Tente novamente.');
    }
}
