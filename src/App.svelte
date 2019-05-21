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
    word-wrap: break-word;;
  }

  .row {
    display: flex;
    flex-flow: row-wrap;
    align-content: center;
  }

  .hr {
    background-color: black;
  }

  .inputContainer {
    display: flex;
    flex-flow: row;
  }

  .input {
    margin: 4px;
    line-height: 1.8;
    font-size: 18px;
    width: 70%;
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
    width: 300px;
    min-height: 200px;
    padding: 4px;
  }

  .colBody {
    margin-top: 4px;
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
    padding: 4px;
  }

  .card:hover ~ .delBtn {
    opacity: 1;
  }

  .h2 {
    width: 80%;
     word-wrap: break-word;
  }

  .btn {
    outline: none;
    padding: .35em 1.2em;
    border: 0.1em solid #FFFFFF;
    margin: 0 0.3em 0.3em 0;
    border-radius: 0.12em;
    box-sizing: border-box;
    text-decoration:none;
    font-weight: 300;
    color: rgba(52, 73, 94,1);
    text-align:center;
    transition: all 0.2s;
  }
  .btn:hover {
    color: #000000;
    background-color: #FFFFFF;
  }

  @media all and (max-width:30em) {
    .btn {
      display: block;
      margin: 0.4em auto;
    }
  }

  .delete {
    margin: auto;
    padding-top:5px;
    padding-right:15px;
    background: none;
    border-radius: 100px;
    font-weight: 900;
    /* font-size: 1.2em; */
    border: none;
    justify-content: space-between;
  }

  .delete:hover {
    color: #c0392b;
    background-color: #FFFFFF;
  }

  .drag {
    margin: auto;
    padding-top:5px;
    padding-right:-15px;
    background: none;
    border-radius: 100px;
    font-weight: 900;
    /* font-size: 1.2em; */
    border: none;
    justify-content: space-between;
  }

  .drag:hover {
    cursor: grab;
  }

  .drag:active {
    cursor:grabbing;
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

  let removeCol = id => {
    let updateCol = collections.filter(col => col.id > id)
    updateCol.map(col => col.id = col.id -1)
    collections = [...collections.filter(c => c.id <id),...updateCol]
  }

  let removeCard = id => {
    let updateCards = cards.filter(card => card.id > id)
    updateCards.map(card => card.id = card.id -1)
    cards = [...cards.filter(c => c.id <id),...updateCards]
  }

  let startDrag = ev =>  {
    ev.target.classList.toggle('dragging')
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
    <div class="inputContainer">
      <input id='input-collection' class="input" placeholder="add a new Collection"/>
      <button class="btn" on:click={ev => addCollections()}>ADD</button>
    </div>
    <!-- <code>{JSON.stringify(cards)}<code> -->
    <!-- <code>{JSON.stringify(collections)}<code> -->
  </div>

  {#each collections as collection, i (collection.id)}
    <div class="col" id='col-{collection.id}' on:drop={handleDrop} on:dragover={handleDragOver}>
      <div class="inputContainer">
        <h2 class="h2">{collection.val}</h2>
        <button class="btn delete" on:click={ev => removeCol(collection.id)}>X</button>
      </div>
      <div class="inputContainer">
        <input id='input-{collection.id}' class="input" placeholder="add a new task"/>
        <button class="btn" on:click={ev => addCard(collection.id)}>ADD</button>
      </div>
      <div class="colBody">
        {#each cards as card, i (card.id)}
          {#if card.col == collection.id}
            <div class="cardRow">
              <span class="drag"
              id='card-{card.id}'
              draggable
              on:dragstart={startDrag}
              >	&#9776;</span>
              <div class="card">
                <span class="title">{card.val}</span>
              </div>
              <span class="btn delete"
              on:click={ev => removeCard(card.id)}>X</span>
            </div>
          {/if}
        {/each}
      </div>
   </div>
  {/each}

</section>
