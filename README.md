# API de Agendamentos de Consultório

Esta é uma API simples para agendar e gerenciar consultas médicas em um consultório. A API permite criar, atualizar, listar e cancelar agendamentos de consultas.

## Recursos Disponíveis

A API oferece os seguintes recursos:

- **Agendamentos**: Criação, atualização, listagem e cancelamento de consultas médicas.

## Endpoints

A API possui os seguintes endpoints:

- `GET /api/agendamentos`: Lista todos os agendamentos disponíveis.
- `POST /api/agendar`: Cria um novo agendamento de consulta.
- `PATCH /api/agenda/:id`: Atualiza um agendamento existente.
- `DELETE /api/agenda/:id`: Cancela um agendamento.

## Validações

A API realiza as seguintes validações nos agendamentos:

- O nome do paciente e o nome do médico devem ser strings.
- A data deve estar no formato "YYYY-MM-DD" (por exemplo, "2023-11-15").
- A hora deve estar no formato "HH:MM:SS" (por exemplo, "14:30:00").
- O status deve ser um dos seguintes: "marcado", "cancelado" ou "concluído".
- Não é possível agendar no passado.
- Não é possível criar agendamentos com a mesma data e hora.
- A data e hora de um agendamento não podem ser alteradas para o passado.

## Exemplo de Payload

### Criar um Agendamento (POST /api/agendar)

Payload de Exemplo:

```json
{
  "paciente": "João da Silva",
  "medico": "Dra. Maria",
  "data": "2023-11-15",
  "hora": "14:30:00",
  "status": "marcado"
}
