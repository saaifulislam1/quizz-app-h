// DOM Elements
const historyContainer = document.getElementById("history-container");
const noHistoryMessage = document.getElementById("no-history");
const quizDetailsSection = document.getElementById("quiz-details");
const quizDetailsTitle = document.getElementById("quiz-details-title");
const quizDetailsMeta = document.getElementById("quiz-details-meta");
const quizDetailsContent = document.getElementById("quiz-details-content");
const backToHistoryBtn = document.getElementById("back-to-history");

// Event Listeners
backToHistoryBtn.addEventListener("click", showHistoryList);

// Load and display quiz history
function loadQuizHistory() {
  // Get quiz history from localStorage
  const quizHistory = JSON.parse(localStorage.getItem("quizHistory")) || [];

  if (quizHistory.length === 0) {
    // Show no history message
    noHistoryMessage.classList.remove("hidden");
    return;
  }

  // Sort history by date (newest first)
  quizHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Display each history item
  historyContainer.innerHTML = "";

  quizHistory.forEach((attempt, index) => {
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";

    const formattedDate = new Date(attempt.date).toLocaleString();

    const attemptName = attempt.name || `${attempt.category} Quiz`;

    // Store a unique ID for each attempt (using timestamp if available, or generate one)
    const attemptId = attempt.date
      ? new Date(attempt.date).getTime().toString()
      : `attempt-${index}-${Date.now()}`;

    historyItem.innerHTML = `
      <div class="history-details">
        <div class="history-category">${attemptName}</div>
        <div class="history-meta">
          <span class="history-category-label">${attempt.category}</span>
          <span class="history-date">${formattedDate}</span>
        </div>
      </div>
      <div class="history-score">
        ${attempt.correct}/${attempt.total} (${attempt.percentage}%)
        <button class="view-details-btn" data-id="${attemptId}">
          <i class="fas fa-eye"></i> View Details
        </button>
      </div>
    `;

    historyContainer.appendChild(historyItem);

    // Add event listener directly to the button we just created
    const viewDetailsBtn = historyItem.querySelector(".view-details-btn");
    viewDetailsBtn.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      console.log("Viewing details for attempt ID:", id);

      // Find the attempt with this ID
      const attemptIndex = quizHistory.findIndex((a) => {
        const aId = a.date ? new Date(a.date).getTime().toString() : "";
        return aId === id;
      });

      if (attemptIndex !== -1) {
        showQuizDetails(attemptIndex, quizHistory[attemptIndex]);
      } else {
        console.error("Could not find attempt with ID:", id);
      }
    });
  });
}

function showQuizDetails(index, attempt) {
  // If attempt is not provided, get it from localStorage
  if (!attempt) {
    const quizHistory = JSON.parse(localStorage.getItem("quizHistory")) || [];
    if (index >= quizHistory.length) {
      console.error("Invalid attempt index:", index);
      return;
    }
    attempt = quizHistory[index];
  }

  console.log("Showing details for attempt:", attempt.name || attempt.category);

  // Set quiz details title and meta
  const attemptName = attempt.name || `${attempt.category} Quiz`;
  quizDetailsTitle.textContent = attemptName;

  const formattedDate = new Date(attempt.date).toLocaleString();
  quizDetailsMeta.innerHTML = `
    <div>Date: ${formattedDate}</div>
    <div>Score: ${attempt.correct}/${attempt.total} (${attempt.percentage}%)</div>
  `;

  // Generate quiz details content
  quizDetailsContent.innerHTML = "";

  // Check if results exist and have valid data
  if (
    !attempt.results ||
    attempt.results.length === 0 ||
    !attempt.results[0].question
  ) {
    quizDetailsContent.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Detailed results are not available for this quiz attempt.</p>
        <p class="empty-state-note">This may be because the quiz was taken before detailed results were implemented, or there was an error saving the data.</p>
        <button id="delete-attempt-btn" class="secondary-btn" data-index="${index}">
          <i class="fas fa-trash"></i> Delete This Attempt
        </button>
      </div>
    `;

    // Add event listener to delete button
    const deleteBtn = quizDetailsContent.querySelector("#delete-attempt-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", function () {
        const attemptIndex = Number.parseInt(this.getAttribute("data-index"));
        deleteQuizAttempt(attemptIndex);
      });
    }

    return;
  }

  attempt.results.forEach((result, resultIndex) => {
    const questionCard = document.createElement("div");
    questionCard.className = `question-card ${
      result.isCorrect ? "correct" : "incorrect"
    }`;

    const questionText = document.createElement("div");
    questionText.className = "question-text";
    questionText.textContent = `${resultIndex + 1}. ${result.question}`;

    const optionsList = document.createElement("ul");
    optionsList.className = "options-list";

    result.options.forEach((option, optionIndex) => {
      const optionItem = document.createElement("li");
      optionItem.className = "option-item";

      const optionLabel = document.createElement("label");

      // Determine the class for this option
      if (optionIndex === result.correctAnswer) {
        optionLabel.className = "option-label correct";
      } else if (result.userAnswer === optionIndex) {
        optionLabel.className = "option-label incorrect";
      } else {
        optionLabel.className = "option-label";
      }

      // Add result icon
      const resultIcon = document.createElement("span");
      resultIcon.className = "result-icon";

      if (optionIndex === result.correctAnswer) {
        resultIcon.classList.add("correct");
        resultIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
      } else if (result.userAnswer === optionIndex) {
        resultIcon.classList.add("incorrect");
        resultIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
      }

      const optionText = document.createTextNode(option);

      optionLabel.appendChild(optionText);
      if (resultIcon.innerHTML) {
        optionLabel.appendChild(resultIcon);
      }

      optionItem.appendChild(optionLabel);
      optionsList.appendChild(optionItem);
    });

    // Create explanation div
    const explanationDiv = document.createElement("div");
    explanationDiv.className = "explanation";
    explanationDiv.textContent = result.explanation;

    questionCard.appendChild(questionText);
    questionCard.appendChild(optionsList);
    questionCard.appendChild(explanationDiv);
    quizDetailsContent.appendChild(questionCard);
  });

  // Show quiz details, hide history list
  historyContainer.classList.add("hidden");
  quizDetailsSection.classList.remove("hidden");

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showHistoryList() {
  // Show history list, hide quiz details
  historyContainer.classList.remove("hidden");
  quizDetailsSection.classList.add("hidden");
}

// Add this new function to delete quiz attempts
function deleteQuizAttempt(index) {
  if (
    confirm(
      "Are you sure you want to delete this quiz attempt? This action cannot be undone."
    )
  ) {
    // Get quiz history
    const quizHistory = JSON.parse(localStorage.getItem("quizHistory")) || [];

    // Remove the attempt at the specified index
    if (index >= 0 && index < quizHistory.length) {
      quizHistory.splice(index, 1);

      // Save updated history back to localStorage
      localStorage.setItem("quizHistory", JSON.stringify(quizHistory));

      // Return to history list and refresh it
      showHistoryList();
      loadQuizHistory();
    }
  }
}

// Load history when page loads
document.addEventListener("DOMContentLoaded", loadQuizHistory);
