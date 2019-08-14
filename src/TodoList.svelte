<script>
  import TodoItem from "./TodoItem.svelte"
  export let tasks
</script>

<style>
  section {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    align-content: flex-start;
    flex-flow: row wrap;
  }

  section:not(:empty) {
    overflow-y: scroll;
  }

  div {
    margin: 5px;
    max-width: 30%;
    min-width: 30%;
    background-color: rgba(255, 208, 0, 0.678);
    transition: all 1s ease 1s;
  }
</style>

<section>
  {#each tasks as task}
    <div>
      <TodoItem id={task.task_id} taskName={task.taskname} note={task.note} state={task.state} on:delete on:edit on:complete/>
    </div>
  {/each}
</section>
