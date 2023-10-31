const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const { check, validationResult } = require('express-validator');
const app = express();
const porta = 3030;

const db = new sqlite3.Database('./banco.db');

db.run(`
  CREATE TABLE IF NOT EXISTS agendamentos (
    id INTEGER PRIMARY KEY, 
    paciente TEXT,
    medico TEXT,
    data TEXT,
    hora TEXT,
    status TEXT
  )
`);

app.use(express.json());
app.use(cors());

app.get('/api/agenda', (req, res) => {
    db.all('SELECT * FROM agendamentos', (erro, agendas) => {
        if (erro) {
            return res.status(500).json({ erro: erro.message });
        }
        res.json(agendas);
    });
});

app.post('/api/agendar', [
    check('paciente').isString(),
    check('medico').isString(),
    check('data').custom((value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            throw new Error('A data deve estar no formato "YYYY-MM-DD".');
        }
        return true;
    }),
    check('hora').custom((value) => {
        if (!/^\d{2}:\d{2}:\d{2}$/.test(value)) {
            throw new Error('Hora deve estar no formato "HH:MM:SS".');
        }
        return true;
    }),
    check('status').isIn(['marcado', 'cancelado', 'concluído'])
], (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const { paciente, medico, data, hora, status } = req.body;
    
    const dataHoraAgendamento = new Date(`${data}T${hora}`);
    const dataHoraAtual = new Date();
    
    if (dataHoraAgendamento < dataHoraAtual) {
        return res.status(400).json({ erro: 'Não é possível agendar no passado.' });
    }
    
    db.get('SELECT COUNT(*) AS count FROM agendamentos WHERE data = ? AND hora = ?',
    [data, hora], (err, row) => {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }
        if (row.count > 0) {
            return res.status(400).json({ erro: 'Já existe um agendamento para essa data e hora.' });
        } else {
            db.run('INSERT INTO agendamentos (paciente, medico, data, hora, status) VALUES (?, ?, ?, ?, ?)',
                [paciente, medico, data, hora, status], function (erro) {
                    if (erro) {
                        return res.status(500).json({ erro: erro.message });
                    }
                    res.status(201).json({ mensagem: 'Agendamento adicionado com sucesso', id: this.lastID });
                });
        }
    });
});

app.patch('/api/agenda/:id', [
    check('paciente').optional().isString(),
    check('medico').optional().isString(),
    check('data').optional().custom((value) => {
        if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            throw new Error('A data deve estar no formato "YYYY-MM-DD".');
        }
        return true;
    }),
    check('hora').optional().custom((value) => {
        if (value && !/^\d{2}:\d{2}:\d{2}$/.test(value)) {
            throw new Error('Hora deve estar no formato "HH:MM:SS".');
        }
        return true;
    }),
    check('status').optional().isIn(['marcado', 'cancelado', 'concluído'])
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    db.get('SELECT * FROM agendamentos WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }
        if (!row) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado' });
        }

        const { paciente, medico, data, hora, status } = req.body;
        const updateFields = [];
        const updateValues = [];

        const dataHoraAtual = new Date();
        if (data && hora) {
            const novaDataHoraAgendamento = new Date(data + 'T' + hora);
            if (novaDataHoraAgendamento < dataHoraAtual) {
                return res.status(400).json({ erro: 'Não é possível agendar no passado.' });
            }
        } else if (data) {
            const novaDataHoraAgendamento = new Date(data + 'T' + row.hora);
            if (novaDataHoraAgendamento < dataHoraAtual) {
                return res.status(400).json({ erro: 'Não é possível agendar no passado.' });
            }
        }

        if (paciente) {
            updateFields.push('paciente = ?');
            updateValues.push(paciente);
        }
        if (medico) {
            updateFields.push('medico = ?');
            updateValues.push(medico);
        }
        if (data) {
            updateFields.push('data = ?');
            updateValues.push(data);
        }
        if (hora) {
            updateFields.push('hora = ?');
            updateValues.push(hora);
        }
        if (status) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ mensagem: 'Nenhum campo para atualizar fornecido' });
        }

        const updateQuery = `UPDATE agendamentos SET ${updateFields.join(', ')} WHERE id = ?`;
        db.run(updateQuery, [...updateValues, id], function (erro) {
            if (erro) {
                return res.status(500).json({ erro: erro.message });
            }

            if (this.changes === 0) {
                return res.status(400).json({ mensagem: 'A atualização não teve efeito' });
            }

            res.json({ mensagem: 'Agendamento atualizado com sucesso' });
        });
    });
});


app.delete('/api/agenda/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM agendamentos WHERE id = ?', id, function (erro) {
        if (erro) {
            return res.status(500).json({ erro: erro.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado' });
        }
        res.json({ mensagem: 'Agendamento excluído com sucesso' });
    });
});

app.listen(porta, () => {
    console.log(`Servidor rodando em localhost:${porta}`);
});
