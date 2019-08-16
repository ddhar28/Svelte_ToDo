const express = require('express')
const router = express.Router()
const db = require('../models/db')

router.get('/get', async function (req, res) {
  let tasks = await db.getTask()
  res.send(tasks)
})

router.post('/add', async function (req, res) {
  let id = await db.addTask(req)
  res.send(id)
})

router.post('/edit', async function (req, res) {
  let task = await db.updateTask(req)
  res.send(task)
})

router.post('/delete', async function (req, res) {
  let task = await db.deleteTask(req)
  res.send(task)
})

module.exports = router
