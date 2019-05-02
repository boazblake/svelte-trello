<style>
	.container {
		display: flex;
		flex-flow: wrap;
		background: #ecf0f1;
		height: 95vh;
		width: 95vw;
		margin:0 auto;
		padding: 20px;
		justify-content: flex-start;
		align-content: flex-start;
	}

	.top {
		width: 100%;
		height:100px;
	}

	.title {
		width: fit-content;
		margin: 0 auto;
	}

	.hr {
		background-color: black;
	}

  .collectionInputContainer {
    display: flex;
    flex-flow: wrap;
  }

  .collectionInput {

  }

  .collectionBtn {

  }

	.col {
		position:relative;
		display: flex;
		margin: 20px;
		flex-flow: column;
    color: #ecf0f1;
		background-color: rgba(52, 73, 94,0.8);
		justify-content: flex-start;
		align-content:center;
		width: 250px;
    min-height: 200px;
	}

	.col:hover > .delBtn {
		opacity: 1;
	}

  .colBody {
    display: flex;
    flex-flow: wrap;
  }

  .cardRow {
    display: flex;
    flex-flow: row;
    justify-content: space-between;
    align-content: center;
  }

	.card {
		width: 200px;
		background-color: #ecf0f1;
    color: rgba(52, 73, 94,1);
		margin: 4px;
	}

	.card:hover ~ .delBtn {
		opacity: 1;
	}

	.btn {
		height: 40px;
		width: auto;
	}

	.delBtn {
		height: 25px;
		width: 25px;
		padding-top:2px;
    background: none;
    outline: none;
	}

	.delBtn::before {
  	content: 'X';
    color: #c0392b;
	}

	.inputContainer {
		display:flex;
	}

	.input {
		width: 100%;
	}


</style>

<script>
	let collections = [	]
	let cards = [	]
  let dragging = { id:'', status:false }

	let clearInput = (id) => document.getElementById(`input-${id}`).value = ''
	let getInput = (id) => document.getElementById(`input-${id}`).value

  let addCollections = ()  => {
    collections = [...collections, {val:getInput('collection'), id: collections.length + 1}]
    clearInput('collection')
  }

  let addCard = col => {
    cards = [...cards, {id: cards.length + 1, val:getInput(col), col:parseInt(col)}]
    clearInput(col)
  }

  let removeCard = id => {
    let updateCards = cards.filter(card => card.id > id)
    updateCards.map(card => card.id = card.id -1)
    cards = [...cards.filter(c => c.id <id),...updateCards]
  }

  let startDrag = ev =>  {
    dragging.id = ev.target.id.split('-')[1]
    dragging.status = true
    ev.dataTransfer.dropEffect = "move";
  }

  let handleDrop = ev => {
    ev.preventDefault()
    let prefix = ev.target.id.split('-')[0]
    let col = ev.target.id.split('-')[1]

    if (prefix == 'col') {
      let card = cards.filter(c => c.id == dragging.id)[0]
      card.col = parseInt(col)
      cards = cards
    }

    if (prefix == 'card') {
     let realCol = cards.filter(c => c.id == col)[0].col
      let card = cards.filter(c => c.id == dragging.id)[0]
      card.col = parseInt(realCol)
      cards = cards
    }
  }

  let handleDragOver = ev => {
    ev.preventDefault();
    ev.stopPropagation();
    ev.dataTransfer.dropEffect = "move"
  }

  let handleDragEnter = ev => {
    ev.preventDefault()
    ev.stopPropagation();
  }

  const fadein= (node,params) => {console.log(node, params)}
</script>

<section class="container">
	<div class="top">
		<h1 class="title">Svelte Trello</h1>
		<hr class="hr">
    <div class="collectionInputContainer">
      <label for="input-collection">Add A Collection</label>
      <input id='input-collection' class="collectionInput" placeholder="add a new Collection"/>
      <button class="collectionBtn" on:click={ev => addCollections()}>+</button>
    </div>
		<!-- <code>{JSON.stringify(cards)}<code> -->
		<!-- <code>{JSON.stringify(collections)}<code> -->
	</div>

	{#each collections as collection, i (collection.id)}
		<div class="col" id='col-{collection.id}' on:drop={handleDrop} on:dragover={handleDragOver}>
      <h1 class="h1">{collection.val}</h1>
			<div class="inputContainer">
        <input id='input-{collection.id}' class="input" placeholder="add a new task"/>
        <button class="btn" on:click={ev => addCard(collection.id)}>Add</button>
			</div>
      <div class="colBody">
        {#each cards as card, i (card.id)}
          {#if card.col == collection.id}
            <div class="cardRow">
              <div class="card"
                id='card-{card.id}'
                draggable
                on:dragstart={startDrag}>{card.val}
              </div>
              <span class="delBtn"
              on:click={ev => removeCard(card.id)}></span>
            </div>
          {/if}
        {/each}
      </div>
	 </div>
	{/each}

</section>