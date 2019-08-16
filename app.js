const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const taskRouter = require('./controllers/taskRouter')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.static('public'))

require('./models/db')

app.use('/', taskRouter)

module.exports = app
