let montadoraEmEdicao = null; // Variável para armazenar a montadora sendo editada

// Função para listar montadoras
async function listarMontadoras() {
    try {
        const response = await fetch('/montadoras');
        const montadoras = await response.json();
        const lista = document.getElementById('listaMontadoras');

        if (Array.isArray(montadoras) && montadoras.length > 0) {
            lista.innerHTML = '<h2>Lista de Montadoras:</h2>' + montadoras.map(m => `
                <div class="montadora-item">
                    <strong>Nome:</strong> ${m.nome}<br>
                    <strong>País:</strong> ${m.pais}<br>
                    <strong>Ano de Fundação:</strong> ${m.ano_fundacao}<br>
                    <button onclick="removerMontadora('${m.id}')">Remover</button>
                    <button onclick="editarMontadora('${m.id}')">Editar</button>
                </div>
            `).join('');
        } else {
            lista.innerHTML = '<h2>Lista de Montadoras:</h2><p>Nenhuma montadora encontrada.</p>';
        }
    } catch (error) {
        console.error('Erro ao listar montadoras:', error);
    }
}

// Função para editar uma montadora
async function editarMontadora(id) {
    // Busca a montadora pelo id
    const response = await fetch(`/montadoras/${id}`);
    const montadora = await response.json();

    // Preenche o formulário com os dados da montadora
    const form = document.getElementById('formMontadora');
    form.nome.value = montadora.nome;
    form.pais.value = montadora.pais;
    form.ano_fundacao.value = montadora.ano_fundacao;

    // Exibe o formulário
    form.style.display = 'block';
    montadoraEmEdicao = montadora; // Armazena a montadora sendo editada
}

// Evento de submit do formulário de montadoras
document.getElementById('formMontadora').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = e.target.nome.value;
    const pais = e.target.pais.value;
    const ano_fundacao = e.target.ano_fundacao.value;

    try {
        if (montadoraEmEdicao) {
            // Atualiza a montadora existente
            const response = await fetch(`/montadoras/${montadoraEmEdicao.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, pais, ano_fundacao }),
            });

            if (response.ok) {
                alert('Montadora editada com sucesso!');
            } else {
                const errorResponse = await response.json();
                alert(`Erro: ${errorResponse.message}`);
            }
        } else {
            // Adiciona uma nova montadora
            const response = await fetch('/montadoras', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, pais, ano_fundacao }),
            });

            if (response.ok) {
                alert('Montadora adicionada com sucesso!');
            } else {
                const errorResponse = await response.json();
                alert(`Erro: ${errorResponse.message}`);
            }
        }

        e.target.reset(); // Limpa o formulário
        montadoraEmEdicao = null; // Reseta a montadora em edição
        listarMontadoras(); // Atualiza a lista de montadoras
    } catch (error) {
        console.error('Erro ao salvar montadora:', error);
        alert('Erro ao salvar montadora. Tente novamente.');
    }
});
// Função para remover uma montadora
async function removerMontadora(id) {
    const confirmacao = confirm('Você realmente deseja remover esta montadora e seus modelos e veículos associados?');

    if (confirmacao) {
        try {
            const response = await fetch(`/montadoras/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('Montadora, modelos e veículos associados excluídos com sucesso!');
                listarMontadoras(); // Atualiza a lista de montadoras após a remoção
            } else {
                const errorResponse = await response.json();
                alert(`Erro: ${errorResponse.message}`);
            }
        } catch (error) {
            console.error('Erro ao remover montadora:', error);
            alert('Erro ao remover montadora. Tente novamente.');
        }
    }
}


// Chama a função listarMontadoras na inicialização da página
listarMontadoras();
