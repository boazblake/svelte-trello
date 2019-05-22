<style>
  .container {
    display: grid;
    grid-template-rows: repeat(1fr);
    grid-template-columns: repeat(1fr) ;
    grid-template-areas: 'top' 'body';
    background: #ecf0f1;
    height: 95vh;
    width: 95vw;
    margin:0 auto;
    padding: 20px;
    justify-content: flex-start;
    align-content: flex-start;
  }

  .top {
    grid-area: top;
    width: 100%;
    height:100px;
  }

  .body {
    grid-area: body;
    width: 95vw;
    display: flex;
    flex-flow: wrap;
  }

  .title {
    width: fit-content;
    margin: 0 auto;
    word-wrap: break-word;;
  }


  .hr {
    background-color: black;
  }

  .row {
    display: flex;
    flex-flow: row;
  }

  .title {
    width: 100%;
    padding: 10px;
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
    justify-content: flex-start;
    align-content:center;
    min-width: 30%;
    padding: 4px;
    width: 80%;
  }

  .colHead {
    background-color: rgba(52, 73, 94, 0.6);
  }

  .colBody {
    display: flex;
    flex-flow: column;
    background-color: rgba(52, 73, 94,0.8);
    min-height: 150px;
    justify-content: space-evenly;
  }

  .cardRow {
    display: flex;
    flex-flow: row;
    justify-content: center;
    align-content: center;
  }

  .card {
    width: 200px;
    height: 30px;
    background-color: #ecf0f1;
    color: rgba(52, 73, 94,1);
    margin: auto;
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
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn:hover {
    color: #000000;
    background-color: #FFFFFF;
  }

  .delete {
    margin: auto;
    padding-top:5px;
    padding-right:15px;
    background: none;
    border-radius: 100px;
    font-weight: 900;
    border: none;
    justify-content: space-between;
    cursor: pointer;
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
    border: none;
    justify-content: space-between;
  }

  .drag:hover {
    cursor: grab;
  }

  .drag:active {
    cursor:grabbing;
  }

  @media screen and (min-width: 600px) and (max-width: 899px) {
  
  }

  @media screen and (min-width: 900px)  and (max-width: 1199px) {
    .col {
      width: 40%;
    }
  }


  @media screen and (min-width: 1200px)  and (max-width: 1799px) {
    .col {
      width: 40%;
    }
  }

  @media screen and (min-width: 1800px) {
    .col {
      width: 20%;
    }
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
    console.log(ev.target)
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
    <div class="row">
      <input id='input-collection' class="input" placeholder="add a new Collection"/>
      <button class="btn" on:click={ev => addCollections()}>ADD</button>
    </div>
  </div>

<section class="body">
  {#each collections as collection, i (collection.id)}
    <div class="col" on:drop={handleDrop} on:dragover={handleDragOver}>
      <div class="colHead">
        <div class="title row">
          <h2 class="h2">{collection.val}</h2>
          <button class="btn delete" on:click={ev => removeCol(collection.id)}>X</button>
        </div>
        <div class="row">
          <input id='input-{collection.id}' class="input" placeholder="add a new task"/>
          <button class="btn" on:click={ev => addCard(collection.id)}>ADD</button>
        </div>
      </div>
      <div class="colBody"  id='col-{collection.id}' >
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

</section>
