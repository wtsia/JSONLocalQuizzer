let quizData = [];              // Holds question objects
let currentQuestionIndex = 0;   // Current question index
const reviewInterval = 3;       // After every 3 questions, display review for that batch
let userAnswers = [];           // Stores user's answers and details

// DOM Elements
const fileInput = document.getElementById('fileInput');
const startQuizButton = document.getElementById('startQuizButton');
const quizContainer = document.getElementById('quizSection');
const questionContainer = document.getElementById('questionContainer');
const nextButton = document.getElementById('nextButton');
const splashPage = document.getElementById('splashPage');
const sidebarToggle = document.getElementById('sidebarToggle');
const reviewList = document.getElementById('reviewList');
const darkModeToggle = document.getElementById('darkModeToggle');

// Event Listeners
fileInput.addEventListener('change', handleFileUpload);
startQuizButton.addEventListener('click', startQuiz);
nextButton.addEventListener('click', showNextQuestion);
sidebarToggle.addEventListener('click', toggleSidebar);
darkModeToggle.addEventListener('click', toggleDarkMode);

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        // Expected format: { "questions": [ ... ] }
        if (!data.questions || !Array.isArray(data.questions)) {
          alert("Invalid JSON format. Expected an object with a 'questions' array.");
          return;
        }
        quizData = data.questions;
      } catch (err) {
        alert("Error parsing JSON file: " + err);
      }
    };
    reader.readAsText(file);
  }
}

function startQuiz() {
  if (quizData.length === 0) {
    alert("Please upload a valid quiz JSON file.");
    return;
  }
  splashPage.style.display = 'none';
  quizContainer.style.display = 'block';
  currentQuestionIndex = 0;
  userAnswers = [];
  // Do not clear sidebar here; running list should accumulate.
  showQuestion();
}

function showQuestion() {
  questionContainer.innerHTML = '';
  nextButton.style.display = 'block';

  if (currentQuestionIndex < quizData.length) {
    const q = quizData[currentQuestionIndex];
    const questionEl = document.createElement('div');
    questionEl.className = 'question';
    questionEl.innerHTML = `<h2>Question ${currentQuestionIndex + 1}:</h2>
                            <p>${q.question}</p>`;
    questionContainer.appendChild(questionEl);

    let choices = q.incorrectAnswers.slice();
    choices.push(q.correctAnswer);
    choices = shuffleArray(choices);

    const ul = document.createElement('ul');
    ul.className = 'choices';
    choices.forEach(choice => {
      const li = document.createElement('li');
      li.className = 'choice';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'choice';
      radio.value = choice;
      li.appendChild(radio);
      li.appendChild(document.createTextNode(' ' + choice));
      ul.appendChild(li);
    });
    questionContainer.appendChild(ul);
  } else {
    showFinalReview();
  }
}

function showNextQuestion() {
  const selected = document.querySelector('input[name="choice"]:checked');
  if (!selected) {
    alert("Please select an answer before continuing.");
    return;
  }
  const answer = selected.value;
  const q = quizData[currentQuestionIndex];
  const isCorrect = (answer === q.correctAnswer);
  const result = {
    question: q.question,
    selected: answer,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    isCorrect: isCorrect
  };
  userAnswers.push(result);

  // Instead of updating the sidebar after each question, we will update it when the review happens.
  // But now we want the sidebar to be a running list. So, for every review batch, append only the new batch entries.
  // We'll determine the current batch in showReview.

  if ((currentQuestionIndex + 1) % reviewInterval === 0 || (currentQuestionIndex + 1) === quizData.length) {
    showReview();
  } else {
    currentQuestionIndex++;
    showQuestion();
  }
}

function showReview() {
  // Clear main question area and hide the next button.
  questionContainer.innerHTML = '';
  nextButton.style.display = 'none';

  let batchStart = Math.floor(currentQuestionIndex / reviewInterval) * reviewInterval;
  let batchEnd = currentQuestionIndex + 1;
  const reviewBatch = userAnswers.slice(batchStart, batchEnd);

  const reviewEl = document.createElement('div');
  reviewEl.className = 'review-section';
  reviewEl.innerHTML = '<h2>Review (Current Batch)</h2>';

  reviewBatch.forEach((ua, idx) => {
    const div = document.createElement('div');
    div.innerHTML = `<p><strong>Q${batchStart + idx + 1}:</strong> ${ua.question}</p>
                     <p>Your answer: <span class="${ua.isCorrect ? 'correct' : 'incorrect'}">${ua.selected}</span>
                     (Correct: ${ua.correctAnswer})</p>
                     <p>Explanation: ${ua.explanation}</p><hr>`;
    reviewEl.appendChild(div);
  });

  // Append new batch entries to the sidebar running list.
  reviewBatch.forEach(ua => {
    const entry = document.createElement('div');
    entry.className = 'sidebar-entry';
    entry.innerHTML = `<p><strong>${userAnswers.indexOf(ua)+1}:</strong> ${ua.question}</p>
                       <p>Your answer: <span class="${ua.isCorrect ? 'correct' : 'incorrect'}">${ua.selected}</span></p>
                       <p>Explanation: ${ua.explanation}</p>`;
    reviewList.appendChild(entry);
  });

  // Continue Quiz button
  const continueButton = document.createElement('button');
  continueButton.textContent = 'Continue Quiz';
  continueButton.className = 'next-btn';
  continueButton.addEventListener('click', function(){
    currentQuestionIndex++;
    showQuestion();
  });
  reviewEl.appendChild(continueButton);

  questionContainer.appendChild(reviewEl);
}

function showFinalReview() {
  questionContainer.innerHTML = '<h2>Final Review</h2>';
  userAnswers.forEach((ua, idx) => {
    const div = document.createElement('div');
    div.innerHTML = `<p><strong>Q${idx+1}:</strong> ${ua.question}</p>
                     <p>Your answer: <span class="${ua.isCorrect ? 'correct' : 'incorrect'}">${ua.selected}</span>
                     (Correct: ${ua.correctAnswer})</p>
                     <p>Explanation: ${ua.explanation}</p><hr>`;
    questionContainer.appendChild(div);
  });
  nextButton.style.display = 'none';
}

function toggleSidebar() {
  if (reviewList.style.display === 'none') {
    reviewList.style.display = 'block';
  } else {
    reviewList.style.display = 'none';
  }
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
