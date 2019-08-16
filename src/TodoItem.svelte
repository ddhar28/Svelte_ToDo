<script>
  import Button from './Button.svelte'
  export let taskName
  export let id
  export let note
  export let state

  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  function deleteTask() {
    dispatch('delete', id)
  }

  function editTask(e) {
    dispatch('edit', 
      {
        _id: id,
        taskname: taskName,
        note: note
      })
  }

  function completeTask(e) {
    dispatch('complete', {
        id: id,
        state: state
    })
  }
</script>

<style>
  section {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.26);
    padding: 0;
    text-align: right;
  }

  textarea {
    resize: none;
    outline: none;
    border: none;
    margin: 0;
    width: 100%;
    }

  #title {
    padding: 5px;
    background: rgba(206, 127, 10, 0.87);
  }


  textarea::-webkit-scrollbar {
    width: 5px;
  }

  textarea::-webkit-scrollbar-track {
    background: transparent; 
  }

  textarea::-webkit-scrollbar-thumb {
  background: rgba(136, 136, 136, 0.705); 
  border-radius: 5px;
}

  textarea::-webkit-scrollbar-thumb:hover {
  background: rgba(85, 85, 85, 0.637); 
}

  #note {
    margin-top: 3px;
    background: transparent;
    color: black;
    height: auto;
    min-height: 5em;
	  max-height: 50vh;
  }
</style>

<section id={id} on:change={editTask}>
  <textarea id="title" maxlength="50" spellcheck="false" bind:value={taskName}></textarea>
  <textarea id="note" maxlength="300" spellcheck="false" bind:value={note}></textarea>
  <Button on:click={deleteTask}>&#10007;</Button>
  <Button on:click={completeTask}>
  {#if state === 'active'}
       &#10003;
  {:else}
       &#8634;
  {/if}
  </Button>
</section>
