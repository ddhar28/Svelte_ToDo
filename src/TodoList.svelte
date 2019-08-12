<script>
  import TodoItem from "./TodoItem.svelte"
  export let todos
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
  }
</style>

<section>
  {#each todos as todo}
    <div>
      <TodoItem id={todo.task_id} taskName={todo.taskname} note={todo.note} on:delete on:edit/>
    </div>
  {/each}
</section>
