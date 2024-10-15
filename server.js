const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');
require('dotenv').config(); // Carregar variáveis de ambiente do .env
const { ulid } = require('ulid'); // Importa a biblioteca ulid para gerar ULIDs

const app = express();
const port = process.env.PORT || 3000;

// Configurar body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Servir arquivos estáticos da pasta 'public'
app.use(express.static('public'));

// Conectar ao banco de dados PostgreSQL
const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

client.connect();

// Rota principal 
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html'); // Serve seu arquivo index.html
});

// Rota para Montadoras (Página HTML)
app.get('/montadoras/form', (req, res) => {
    res.sendFile(__dirname + '/public/montadoras.html'); // Serve seu arquivo montadoras.html
});


// Rota para atualizar uma montadora pelo ID


// Rota para obter montadoras (API)
app.get('/montadoras', async (req, res) => {
    console.log("Recebendo requisição para listar montadoras"); // Log para depuração
    try {
        const result = await client.query('SELECT * FROM montadoras');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar montadoras:', error);
        res.status(500).send('Erro ao buscar montadoras');
    }
});
app.get('/montadoras/:id', async (req, res) => {
    const { id } = req.params; // Captura o ID da montadora da URL
    console.log(`Buscando montadora com ID: ${id}`); // Log para depuração
    try {
        const result = await client.query('SELECT * FROM montadoras WHERE id = $1', [id]);
        console.log('Resultado da consulta:', result.rows); // Log para ver o resultado da consulta
        if (result.rows.length > 0) {
            res.json(result.rows[0]); // Retorna a montadora encontrada
        } else {
            res.status(404).json({ message: 'Montadora não encontrada' }); // Retorna 404 se não encontrado
        }
    } catch (error) {
        console.error('Erro ao buscar montadora:', error);
        res.status(500).send('Erro ao buscar montadora');
    }
});

app.put('/montadoras/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, pais, ano_fundacao } = req.body;

    try {
        const result = await client.query(
            'UPDATE montadoras SET nome = $1, pais = $2, ano_fundacao = $3 WHERE id = $4',
            [nome, pais, ano_fundacao, id]
        );

        if (result.rowCount > 0) {
            res.json({ message: 'Montadora atualizada com sucesso!' });
        } else {
            res.status(404).json({ message: 'Montadora não encontrada' });
        }
    } catch (error) {
        console.error('Erro ao atualizar montadora:', error);
        res.status(500).json({ message: 'Erro ao atualizar montadora' });
    }
});

// Rota para excluir uma montadora pelo ID (com exclusão em cascata dos modelos e veículos)
app.delete('/montadoras/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Exclui todos os veículos associados aos modelos da montadora
        await client.query('DELETE FROM veiculos WHERE modelo_id IN (SELECT id FROM modelos WHERE montadora_id = $1)', [id]);
        
        // Exclui todos os modelos da montadora
        await client.query('DELETE FROM modelos WHERE montadora_id = $1', [id]);
        
        // Exclui a montadora
        const result = await client.query('DELETE FROM montadoras WHERE id = $1', [id]);
        if (result.rowCount > 0) {
            res.send('Montadora, modelos e veículos associados excluídos com sucesso!');
        } else {
            res.status(404).send('Montadora não encontrada');
        }
    } catch (error) {
        console.error('Erro ao excluir montadora:', error);
        res.status(500).send('Erro ao excluir montadora');
    }
});


// Rotas para Montadoras (CRUD)
app.post('/montadoras', async (req, res) => {
    const { nome, pais, ano_fundacao } = req.body; // Incluindo os campos 'pais' e 'ano_fundacao'
    const id = ulid(); // Gera um ULID para o ID da montadora
    try {
        await client.query('INSERT INTO montadoras (id, nome, pais, ano_fundacao) VALUES ($1, $2, $3, $4)', [id, nome, pais, ano_fundacao]);
        res.status(201).send('Montadora adicionada com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar montadora:', error);
        res.status(500).send('Erro ao adicionar montadora');
    }
});

// Rota para Modelos (Página HTML)
app.get('/modelos/form', (req, res) => {
    res.sendFile(__dirname + '/public/modelos.html'); // Serve seu arquivo modelos.html
});

// Rota para obter todos os modelos (API)
app.get('/modelos', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM modelos');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar modelos:', error);
        res.status(500).send('Erro ao buscar modelos');
    }
});

// Rota para obter um modelo específico pelo ID (ULID)
app.get('/modelos/:id', async (req, res) => {
    const { id } = req.params; // Captura o ID do modelo da URL
    try {
        const result = await client.query('SELECT * FROM modelos WHERE id = $1', [id]); // Consulta ao banco de dados
        if (result.rows.length > 0) {
            res.json(result.rows[0]); // Retorna o modelo encontrado
        } else {
            res.status(404).json({ message: 'Modelo não encontrado' }); // Retorna 404 se não encontrado
        }
    } catch (error) {
        console.error('Erro ao buscar modelo:', error);
        res.status(500).send('Erro ao buscar modelo');
    }
});

// Rota para excluir um modelo pelo ID (com exclusão em cascata dos veículos)
app.delete('/modelos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Exclui todos os veículos associados ao modelo
        await client.query('DELETE FROM veiculos WHERE modelo_id = $1', [id]);
        
        // Exclui o modelo
        const result = await client.query('DELETE FROM modelos WHERE id = $1', [id]);
        if (result.rowCount > 0) {
            res.send('Modelo e veículos associados excluídos com sucesso!');
        } else {
            res.status(404).send('Modelo não encontrado');
        }
    } catch (error) {
        console.error('Erro ao excluir modelo:', error);
        res.status(500).send('Erro ao excluir modelo');
    }
});

// Rotas para Modelos (CRUD)
app.post('/modelos', async (req, res) => {
    const { nome, montadora_id, valor, motor, automatico, turbo } = req.body;
    const id = ulid(); // Gera um ULID para o ID do modelo

    // Converte as strings em valores booleanos
    const turboBoolean = turbo === true; // ou 'true' dependendo de como você está enviando os dados
    const automaticoBoolean = automatico === true; // ou 'true' dependendo de como você está enviando os dados

    try {
        await client.query(
            'INSERT INTO modelos (id, nome, montadora_id, motor, valor, automatico, turbo) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, nome, montadora_id, motor, valor, automaticoBoolean, turboBoolean]
        );
        res.status(201).send('Modelo adicionado com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar modelo:', error);
        res.status(500).send('Erro ao adicionar modelo');
    }
});

app.put('/modelos/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, montadora_id, valor, motor, automatico, turbo } = req.body;

    // Converte as strings em valores booleanos
    const turboBoolean = turbo === true;
    const automaticoBoolean = automatico === true;

    try {
        await client.query(
            'UPDATE modelos SET nome = $1, montadora_id = $2, valor = $3, motor = $4, automatico = $5, turbo = $6 WHERE id = $7',
            [nome, montadora_id, valor, motor, automaticoBoolean, turboBoolean, id]
        );
        res.send('Modelo atualizado com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar modelo:', error);
        res.status(500).send('Erro ao atualizar modelo');
    }
});

app.delete('/modelos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await client.query('DELETE FROM modelos WHERE id = $1', [id]);
        res.send('Modelo removido com sucesso!');
    } catch (error) {
        console.error('Erro ao remover modelo:', error);
        res.status(500).send('Erro ao remover modelo');
    }
});

// Rota para Veículos (Página HTML)
app.get('/veiculos/form', (req, res) => {
    res.sendFile(__dirname + '/public/veiculos.html'); // Serve seu arquivo veiculos.html
});

// Rota para obter veículos (API)
app.get('/veiculos', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM veiculos');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar veículos:', error);
        res.status(500).send('Erro ao buscar veículos');
    }
});
// Rota para obter um veículo específico pelo ID (ULID)
app.get('/veiculos/:id', async (req, res) => {
    const { id } = req.params; // Captura o ID do veículo da URL
    try {
        const result = await client.query('SELECT * FROM veiculos WHERE id = $1', [id]); // Consulta ao banco de dados
        if (result.rows.length > 0) {
            res.json(result.rows[0]); // Retorna o veículo encontrado
        } else {
            res.status(404).json({ message: 'Veículo não encontrado' }); // Retorna 404 se não encontrado
        }
    } catch (error) {
        console.error('Erro ao buscar veículo:', error);
        res.status(500).send('Erro ao buscar veículo');
    }
});


// Rotas para Veículos (CRUD)
app.post('/veiculos', async (req, res) => {
    const { modelo_id, cor, ano_fabricacao, ano_modelo, valor, placa, vendido } = req.body; // Ajuste para incluir novos campos
    const id = ulid(); // Gera um ULID para o ID do veículo
    try {
        await client.query(
            'INSERT INTO veiculos (id, modelo_id, cor, ano_fabricacao, ano_modelo, valor, placa, vendido) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [id, modelo_id, cor, ano_fabricacao, ano_modelo, valor, placa, vendido]
        );
        res.status(201).send('Veículo adicionado com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar veículo:', error);
        res.status(500).send('Erro ao adicionar veículo');
    }
});

app.delete('/veiculos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await client.query('DELETE FROM veiculos WHERE id = $1', [id]);
        if (result.rowCount > 0) {
            res.send('Veículo excluído com sucesso!');
        } else {
            res.status(404).send('Veículo não encontrado');
        }
    } catch (error) {
        console.error('Erro ao excluir veículo:', error);
        res.status(500).send('Erro ao excluir veículo');
    }
});


app.put('/veiculos/:id', async (req, res) => {
    const { id } = req.params;
    const { modelo_id, cor, ano_fabricacao, ano_modelo, valor, placa, vendido } = req.body; // Ajuste para incluir novos campos
    try {
        await client.query(
            'UPDATE veiculos SET modelo_id = $1, cor = $2, ano_fabricacao = $3, ano_modelo = $4, valor = $5, placa = $6, vendido = $7 WHERE id = $8',
            [modelo_id, cor, ano_fabricacao, ano_modelo, valor, placa, vendido, id]
        );
        res.send('Veículo atualizado com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar veículo:', error);
        res.status(500).send('Erro ao atualizar veículo');
    }
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

