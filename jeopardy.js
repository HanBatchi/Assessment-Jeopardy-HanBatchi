// categories is the main data structure for the app; it looks like this:

const jserviceUrl = "https://jservice.io/api/";
const numCategories = 6;
const numClues = 5;

//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];

/*
  Get NUM_CATEGORIES random category from API.
  Returns array of category ids
*/

async function getCategoryIds() {
  const resp= await axios.get(`${jserviceUrl}categories?count=100`)
  const cateIds= resp.data.map( c => c.id);
  return _.sampleSize(cateIds, numCategories);
}

/** Return object with data about a category:
 
 *  Returns { title: "Math", clues: clue-array }
 
 * Where clue-array is:
 *    [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
  const resp = await axios.get(`${jserviceUrl}category?id=${catId}`);
  const category = resp.data;
  const allClues = category.clues;
  const randomClue  = _.sampleSize(allClues, numClues);
  const clues = randomClue.map( c =>({
    question : c.question,
    answer : c.answer,
    showing : null,
  }));
  return{title: category.title, clues};
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
  
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
  
 *   each with a question for each category in a <td>
  
 *   (initally, just show a "?" where the question/answer would go.)

 */

async function fillTable() {
  // Add row with headers for categories
  const jeopardyTable = document.getElementById('jeopardy');
  const thead = jeopardyTable.querySelector('thead');
  thead.innerHTML = '';

  const trHeader = document.createElement('tr');
  for (let catIdx = 0; catIdx < numCategories; catIdx++) {
    const th = document.createElement('th');
    th.textContent = categories[catIdx].title;
    trHeader.appendChild(th);
  }
  thead.appendChild(trHeader);

  // Add rows with questions for each category
  const tbody = jeopardyTable.querySelector('tbody');
  tbody.innerHTML = '';
  for (let clueIdx = 0; clueIdx < numClues; clueIdx++) {
    const trRow = document.createElement('tr');
    for (let catIdx = 0; catIdx < numCategories; catIdx++) {
      const td = document.createElement('td');
      td.id = `${catIdx}-${clueIdx}`;
      td.textContent = '?';
      trRow.appendChild(td);
    }
    tbody.appendChild(trRow);
  }
}


/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

async function handleClick(evt) {
  let id = evt.target.id;
  let [catId, clueId] = id.split("-");
  console.log(`catId: ${catId}, clueId: ${clueId}`);
  let clue = categories[catId].clues[clueId];

  let msg;

  if (!clue.showing) {
      msg = clue.question;
      clue.showing = "question";
  } else if (clue.showing === "question") {
      msg = clue.answer;
      clue.showing = "answer";
  } else {
      // already showing answer; ignore
      return;
  }

  // Update text of cell
  const element = document.getElementById(`${catId}-${clueId}`);
  element.textContent = msg;
}


/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

// Function to show the loading spinner and update the button
function showLoadingView() {
  const gameStartBtn = document.getElementById('start');
  const spinContainer = document.getElementById('spin-container');
  const h1 = document.querySelector('h1')

  // Display the spin logo
  spinContainer.style.display = 'block';
  //Change color of title
  h1.style.color = 'white';

  // Change button text to "Loading..."
  gameStartBtn.textContent = 'Loading...';

  // Disable the button during loading
  gameStartBtn.disabled = true;
}


// Function to hide the loading spinner and update the button
function hideLoadingView() {
  const gameStartBtn = document.getElementById('start');
  const spinContainer = document.getElementById('spin-container');
  const h1 = document.querySelector('h1');

  // Hide the spin logo
  spinContainer.style.display = 'none';
  //Change color of title
  h1.style.color = 'black';

  // Change button text to "Restart"
  gameStartBtn.textContent = 'Restart';

  // Enable the button for a new game
  gameStartBtn.disabled = false;
}
/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
  showLoadingView();
  clearGameContent(); // Clear the previous game content

  // Wait for 2 seconds before starting the new game(spin load)
  await new Promise(resolve => setTimeout(resolve, 2000));

  const catIds = await getCategoryIds();
  categories = [];
  for (let catId of catIds) {
    categories.push(await getCategory(catId));
  }
  fillTable();
  hideLoadingView();
}

function clearGameContent() {
  const tbody = document.querySelector('#jeopardy tbody');
  const thead = document.querySelector('#jeopardy thead');
  // Clear the game board
  tbody.innerHTML = ''; 
  // Clear the header
  thead.innerHTML = '';  
  // Clear the previous game's data
  categories = []; 
}



/** On click of start / restart button, set up game. */
const gameStartBtn = document.getElementById('start');
gameStartBtn.addEventListener('click', async () => {
  showLoadingView();
  clearGameContent(); // Clear previous game content
  // Wait for 3 seconds before starting the new game
  setupAndStart().then(()=>{
    hideLoadingView();
  })
});


/** On page load, add event handler for clicking clues */

document.addEventListener("DOMContentLoaded", function () {

  const jpdyTable = document.getElementById('jeopardy');

  jpdyTable.addEventListener("click", function (e) {
    if (e.target.tagName === "TD") {
      handleClick(e);
    }
  });
});

