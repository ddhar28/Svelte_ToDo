<script>
  export let taskName
  export let id
  export let note

  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  function deleteTask() {
    dispatch('delete', id)
  }

  function editTask(e) {
    dispatch('edit', 
      {
        id: id,
        taskname: taskName,
        note: note
      })
  }

//   function completeTask() {
//     e.target.disabled = true;
//     dispatch("complete", id)
//   }
</script>

<style>
  section {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.26);
    overflow: auto;
  }
  button {
    padding: 2px;
    margin: 0;
    margin-left: 2px;
    height: auto;
    font-size: 1rem;
    background: transparent;
    border: none;
    float: right;
    cursor: pointer;
  }

  div {
    outline: none;
    padding: 5px;
    margin: 0;
    background: rgba(206, 127, 10, 0.87);
    height: auto;
  }

  #note {
    outline: none;
    border:none;
    margin-bottom: 0;
    margin-top: 3px;
    background: transparent;
  }
</style>

<section id={id} on:input={editTask}>
  <div contenteditable="true" bind:textContent={taskName}></div>
  <div id="note" contenteditable="true" bind:textContent={note}></div>
  <button on:click={deleteTask}>&#10007;</button>
  <button on:click>&#10003;</button>
</section>
