const mongoose = require('mongoose')

let todoSchema = new mongoose.Schema({
  taskname: {
    type: String
  },
  state: {
    type: String
  },
  note: {
    type: String
  }
})

module.exports = mongoose.model('Todo', todoSchema)
