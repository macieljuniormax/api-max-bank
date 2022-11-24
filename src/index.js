import express from 'express'
import { v4 } from 'uuid'

const app = express()
app.use(express.json())
app.listen(3333)
// app.use(verifyIfExistsAccountCPF)

const customers = []
// Middleware
function verifyIfExistsAccountCPF (request, response, next) {
  const { cpf } = request.headers
  const customer = customers.find((customer) => customer.cpf === cpf)

  if (!customer) {
    return response.status(400).json({ error: 'Customer not found' })
  }

  request.customer = customer
  return next()
}

function getBalance (statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount
    } else {
      return acc - operation.amount
    }
  }, 0)

  return balance
}

app.post('/account', (request, response) => {
  const { cpf, name } = request.body

  /** Verifica de o cpf de cadastro já está no sistema */
  const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf)
  if (customerAlreadyExists) {
    return response.status(400).json({ error: 'Customer already exists' })
  }
  /** ================================================ */

  customers.push({
    cpf,
    name,
    id: v4(),
    statement: []
  })

  return response.status(201).send()
})

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  return response.json(customer.statement)
})

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  const { date } = request.query

  console.log(date)

  const dateFormated = new Date(date + ' 00:00')

  console.log(dateFormated)

  const statement = customer.statement.filter((statement) =>
    statement.created_at.toDateString() ===
    new Date(dateFormated).toDateString()
  )

  return response.json(statement)
})

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body
  const { customer } = request

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit'
  }

  customer.statement.push(statementOperation)
  return response.status(201).send()
})

app.post('/withdrow', verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body
  const { customer } = request

  const balance = getBalance(customer.statement)

  if (balance < amount) {
    return response.status(400).json({ error: 'Insuficients funds!' })
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit'
  }

  customer.statement.push(statementOperation)

  return response.status(201).send()
})

app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { name } = request.body
  const { customer } = request

  customer.name = name

  return response.status(201).send()
})

app.get('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request

  return response.json(customer)
})

app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request

  customers.splice(customer, 1)
  return response.status(200).json(customers)
})
