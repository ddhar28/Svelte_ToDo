const express = require('express')
const app = express()
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.static('public'))
var mongoose = require('mongoose')

// Set up default mongoose connection
var mongoDB = 'mongodb://127.0.0.1/my_db'
mongoose.connect(mongoDB, { useNewUrlParser: true })

// Get the default connection
var db = mongoose.connection

// Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

app.use('/hello', (req, res) => {
  res.end('Hello!')
})

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
