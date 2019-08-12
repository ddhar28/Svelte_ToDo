<script>
  import TodoList from './TodoList.svelte'

  let header = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  let todos = []
  let completed = []

  let task = {
    taskname: '',
    state: 'active',
	note: '',
  }

  async function getTask() {
    const result = await fetch('/getTasks', {
      method: 'GET',
      Headers: header
    });
	let tasks = await result.json()
	todos = tasks.sort((a, b) => a.task_id-b.task_id)
	console.log(todos)
  }

  async function addTask() {
    const newTask = {
      taskname: task.taskname,
      state: 'active',
      note: ''
	}
	console.log(newTask)
    const res = await fetch('/add', {
      method: 'POST',
      headers: header,
      body: JSON.stringify(newTask)
    })
	getTask()
  }

  async function deleteTask (e) {
    const id = e.detail
    await fetch('/delete', {
      method: 'POST',
      headers: header,
      body: JSON.stringify({ id: id })
    })
    getTask()
  }

  async function editTask (e) {
	const editedTask = e.detail
	await fetch('/edit', {
      method: 'POST',
      headers: header,
      body: JSON.stringify(editedTask)
    })
    getTask()
  }

//   function completeTask(e) {
//     let name = e.detail
//     let task = todos.find(todo => todo.taskname === name)
//     completed = completed.concat(task)
//     console.log(completed)
//   }

  getTask()
</script>

<style>
  .container {
    display: flex;
    justify-content: space-around;
    align-items: stretch;
    height: 100%;
  }

  section {
    display: flex;
    background-color: transparent;
    width: 49%;
    padding: 2px;
    flex-direction: column;
  }

  #taskInput {
    width: 35%;
	align-content: center;
  }

  span {
    display: flex;
    flex: row wrap;
    justify-content: flex-start;
  }

  h2 {
    margin: 5px;
  }

  #taskList {
    width: 63%;
  }

  input {
    width: 50%;
  }

  button {
    width: 30%;
  }

  @media only screen and (max-width: 600px) {
    .container {
      flex-direction: column;
      align-items: center;
    }

    #taskInput {
      flex-direction: row;
	  justify-content: space-evenly;
    }
  }
</style>

<div class='container'>
  <section id='taskInput'>
    <h2>To-Do App</h2>
    <input id='input' type='text' bind:value={task.taskname} on:change={addTask}/>
    <button>Add</button>
  </section>
  <section id='taskList'>
    <span>
      <h2 id='test'>To-Dos:</h2>
      <!-- <h2 id='test1'>Completed</h2> -->
    </span>
    <TodoList {todos} on:delete={deleteTask} on:edit={editTask}/>
  </section>
</div>
