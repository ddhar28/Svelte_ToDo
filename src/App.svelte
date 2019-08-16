<script>
  import TodoList from './TodoList.svelte'

  let header = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  let all = []
  let todos = []
  let completed = []
  let listDisplay =  'todo'

  let task = ''

  async function getTask() {
    const result = await fetch('/get', {
      method: 'GET',
      Headers: header
    });
	all = await result.json()
	// all = tasks.sort((a, b) => a.task_id-b.task_id)
	todos = all.filter((todo) => todo.state === 'active')
	completed = all.filter((todo) => todo.state === 'inactive')
  }

  async function addTask() {
    let newTask = task.trim()
    if (newTask === '') return
    const res = await fetch('/add', {
      method: 'POST',
      headers: header,
      body: JSON.stringify({ taskname: newTask })
    })
	newTask = await res.json()
	todos = todos.concat(newTask)
	task = ''
  }

  async function deleteTask (e) {
    const id = e.detail
    await fetch('/delete', {
      method: 'POST',
      headers: header,
      body: JSON.stringify({ id: id })
    })
    todos = todos.filter((todo) => todo.task_id !== id)
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

  async function completeTask(e) {
	console.log('changing state...', e.detail)
	let id = e.detail.id
	let isActive = e.detail.state === 'active' ? true : false
	let state =  isActive ? 'inactive' : 'active'

	await fetch('/state', {
      method: 'POST',
      headers: header,
      body: JSON.stringify({ 
		id: id, 
		state: state})
	})
	
	getTask()
  }

  function toggleDisplay () {
	  if (listDisplay === 'todo') listDisplay = 'completed'
	  else listDisplay = 'todo'
  }

  getTask()
</script>

<style>
  .container {
    display: flex;
    justify-content: space-around;
    align-items: stretch;
    height: 100%;
	background-color: beige;
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
	cursor: pointer;
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
    <input id='input' maxlength="50" type='text' bind:value={task} on:change={addTask}/>
    <button on:click={addTask}>Add</button>
  </section>
  <section id='taskList'>
    <span>
      <h2 on:click={toggleDisplay}>To-Dos</h2>
	  <h2 on:click={toggleDisplay}>Completed</h2>
    </span>

	{#if listDisplay === 'todo'}
		<TodoList tasks={todos} on:delete={deleteTask} on:edit={editTask} on:complete={completeTask}/>
	{:else}
		<TodoList tasks={completed} on:delete={deleteTask} on:edit={editTask} on:complete={completeTask}/>
	{/if}
  </section>
</div>
