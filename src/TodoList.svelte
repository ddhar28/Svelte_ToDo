<script>
    import TodoItem from './TodoItem.svelte'
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
        max-width:30%;
        min-width: 30%;
        height: 50px auto;
        background-color: rgba(255, 255, 0, 0.678);
    }
</style>


<section>
    {#each todos as todo}
    <div>
        <TodoItem taskName={todo.title}/>
    </div>
    {/each}
</section>