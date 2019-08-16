const mongoose = require('mongoose')
const Todo = require('./todo.model')

const mongoDB = 'mongodb://127.0.0.1/my_db'
mongoose.connect(mongoDB, { useNewUrlParser: true }, (err) => {
  if (!err) console.log('MongoDB connected successfully')
  else console.log('MongoDB connection error:', err)
})

exports.getTask = async function (req, res) {
  let tasks = await Todo.find()
  return tasks
}

exports.addTask = async function (req, res) {
  let todo = new Todo({
    taskname: req.body.taskname,
    state: 'active',
    note: ''
  })
  todo = await todo.save()
  return todo
}

exports.updateTask = async function (req, res) {
  let task = await Todo.findOneAndUpdate({ _id: req.body._id }, req.body, { new: true })
  return task
}

exports.deleteTask = async function (req, res) {
  let task = await Todo.findByIdAndRemove(req.body._id)
  return task
}
