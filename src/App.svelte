<script>
  import TodoList from './TodoList.svelte'

  let header = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  let all = []
  $: todos = all.filter((todo) => todo.state === 'active')
  $: completed = all.filter((todo) => todo.state === 'inactive')
  $: total = all.length

  let listDisplay =  'todo'
  let task = ''

  async function getTask() {
    const result = await fetch('/get', {
      method: 'GET',
      Headers: header
    });
	  all = await result.json() 
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
    all = all.concat(newTask)
	  task = ''
  }

  async function deleteTask (e) {
    const id = e.detail
    await fetch('/delete', {
      method: 'POST',
      headers: header,
      body: JSON.stringify({ _id: id })
    })

    all = all.filter((todo) => todo._id !== id)
  }

  async function editTask (e) {
	  const editedTask = e.detail
	  const res = await fetch('/edit', {
      method: 'POST',
      headers: header,
      body: JSON.stringify(editedTask)
    })
    
    let task = await res.json()
    let i = all.findIndex((todo) => todo._id === id)
    all.splice(i, 1, task)
    all = all
  }

  async function completeTask(e) {
	  let id = e.detail.id
	  let isActive = e.detail.state === 'active' ? true : false
	  let state =  isActive ? 'inactive' : 'active'

	  let res = await fetch('/edit', {
      method: 'POST',
      headers: header,
      body: JSON.stringify({ 
		  _id: id, 
		  state: state})
    })
    
    let task = await res.json()
    let i = all.findIndex((todo) => todo._id === id)
    all.splice(i, 1, task)
    all = all
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
    margin: 0;
    padding:0;
  }

  h2 {
    margin: 20px;
    margin-left: 0;
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

  .dropdown {
    position: relative;
    display: inline;
  }

  .dropbtn {
    border:none;
    background: transparent;
    padding:0;
    width: auto;
    font-size: 3rem;
    color: rgb(39, 38, 38);
    margin:0;
  } 
  
  .dropdown-content {
    display: none;
    position: absolute;
    background-color: #f1f1f1;
    min-width: 160px;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    z-index: 1;
  }

  .dropdown-content p {
    color: black;
    padding: 10px;
    margin: 0;
    text-decoration: none;
    display: block;
  }

.dropdown:hover .dropdown-content {
  display: block;
}

  .dropdown-content p:hover {
    background-color: #ddd;
  }

  .dropdown:hover .dropbtn {
    text-shadow:0 1px 4px rgba(0, 0, 0, 0.26);
  }

</style>

<div class='container'>
  <section id='taskInput'>
    <h2>To-Do App</h2>
    <input id='input' maxlength="50" type='text' bind:value={task} on:change={addTask}/>
    <button on:click={addTask}>Add</button>
    <div>
      Total tasks : {total}
    </div>
  </section>
  <section id='taskList'>
    <span class="dropdown">
    <button class="dropbtn">&#8801;</button>
    <div class="dropdown-content">
      <p on:click={toggleDisplay}>To-Dos</p>
	    <p on:click={toggleDisplay}>Completed</p>
    </div>
    </span>

	{#if listDisplay === 'todo'}
    {#if todos.length}
      <TodoList tasks={todos} on:delete={deleteTask} on:edit={editTask} on:complete={completeTask}/>
    {:else}
      <p>No active tasks</p>
    {/if}
	{:else}
    {#if completed.length}
      <TodoList tasks={completed} on:delete={deleteTask} on:edit={editTask} on:complete={completeTask}/>
    {:else}
      <p>No tasks completed yet</p>
    {/if}
	{/if}
  </section>
</div>
