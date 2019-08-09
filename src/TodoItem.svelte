<script>
    export let taskName

    function deleteTask() {
        
    }
</script>

<style>
    button {
        padding: 2px;
        margin-left: 2px;
        height: auto;
        font-size: 1rem;
        background: transparent;
        border: none;
        float: right;
        cursor: pointer;
    }

    p {
        margin-top: 0;
        background-color: rgba(206, 127, 10, 0.87);
        padding: 5px;
        height: auto;
    }

    input:disabled {
        background: transparent;
        border: none;
        width: 100%;
        padding: 0;
        margin: 0;
        color:black;
        overflow-wrap: visible;
    }
</style>


<p>
<input type="text" value={taskName} disabled=true>
</p>
<button on:click={deleteTask}>&#10007;</button>
<button>&#10003;</button>
<button>&#9997</button>


