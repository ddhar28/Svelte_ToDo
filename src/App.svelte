<script>
	import TodoList from './TodoList.svelte'

	let todos = []

	let task = {
		title: ''
	}

	function addTask () {
		const newTask = {
			title: task.title
		}
		todos = todos.concat(newTask)
		task.title = ''
	}

	function select (e) {
		e.target.class = "selected"
	}

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
		width:63%;
	}

	input {
		width:50%;
	}

	button {
		width:30%;
	}

</style>

<div class="container">
	<section id="taskInput">
		<h2>To-Dos:</h2>
		<input id="input" type="text" bind:value={task.title} on:change={addTask}>
		<button>Add</button>
	</section>
	<section id="taskList">
		<span>
			<h2 id="test">Incomplete</h2>
			<h2 id="test1">Completed</h2>
		</span>
		<TodoList todos={todos}/>
	</section>
</div> 