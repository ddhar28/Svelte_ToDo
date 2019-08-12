const express = require('express')
const app = express()
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.static('public'))
// var mongoose = require('mongoose')

// var mongoDB = 'mongodb://127.0.0.1/my_db'
// mongoose.connect(mongoDB, { useNewUrlParser: true })

// var db = mongoose.connection

// db.on('error', console.error.bind(console, 'MongoDB connection error:'))

app.get('/hello', (req, res) => {
  res.end('Hello!')
})

const { Client } = require('pg')
var conString = 'postgres://postgres:@localhost:5432/todo'

app.get('/getTasks', async function (req, res) {
  const client = new Client(conString)
  await client.connect()

  const sql = 'SELECT * FROM TODOS;'
  const result = await client.query(sql)

  res.send(result.rows)
})

app.post('/add', async function (req, res) {
  const client = new Client(conString)
  await client.connect()

  const sql = 'INSERT INTO TODOS(taskname, state, note) VALUES($1,$2,$3);'
  console.log(req.body)
  const param = [req.body.taskname, req.body.state, req.body.note]
  let result = await client.query(sql, param)
  // console.log(result.rows[0])
  res.end(result.rows[0])
})

app.post('/delete', async function (req, res) {
  console.log('deleting...', req.body)
  const client = new Client(conString)
  await client.connect()

  const param = req.body.id
  const sql = 'DELETE FROM TODOS WHERE task_id=' + param + ';'
  await client.query(sql)

  res.end('ok')
})

app.post('/state', async function (req, res) {
  const client = new Client(conString)
  await client.connect()

  const sql = 'UPDATE TODOS SET state = $1 WHERE task_id = $2;'
  const param = [req.body.state, req.body.id]
  await client.query(sql, param)

  res.end('ok')
})

app.post('/edit', async function (req, res) {
  const client = new Client(conString)
  await client.connect()

  const sql = 'UPDATE TODOS SET taskname = $1, note = $2 WHERE task_id = $3;'
  const param = [req.body.taskname, req.body.note, req.body.id]
  await client.query(sql, param)

  res.end('ok')
})

// app.post('/note', async function (req, res) {
//   const client = new Client(conString)
//   await client.connect()

//   const sql = 'UPDATE TODOS SET note = $1 WHERE task_id = $2;'
//   const param = [req.body.note, req.body.id]
//   await client.query(sql, param)

//   res.end('ok')
// })

// app.use((req, res, next) => {
//   const error = new Error()
//   res.status = 404
//   next(error)
// })

// app.use((error, req, res) => {
//   res.status(error.status || 500)
//   res.json({
//     error: {
//       message: error.message
//     }
//   }
//   )
// })

module.exports = app
