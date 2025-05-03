// DOM Elements
const historyContainer = document.getElementById("history-container");
const noHistoryMessage = document.getElementById("no-history");
const quizDetailsSection = document.getElementById("quiz-details");
const quizDetailsTitle = document.getElementById("quiz-details-title");
const quizDetailsMeta = document.getElementById("quiz-details-meta");
const quizDetailsContent = document.getElementById("quiz-details-content");
const backToHistoryBtn = document.getElementById("back-to-history");
const paginationControls = document.getElementById("pagination-controls");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");

// Pagination settings
const ITEMS_PER_PAGE = 5;
let currentPage = 1;
let filteredHistory = [];

// Event Listeners
backToHistoryBtn.addEventListener("click", showHistoryList);
searchInput.addEventListener("input", filterAndDisplayHistory);
categoryFilter.addEventListener("change", filterAndDisplayHistory);

// Load and display quiz history
function loadQuizHistory() {
  // Get quiz history from localStorage
  const quizHistory = JSON.parse(localStorage.getItem("quizHistory")) || [];

  if (quizHistory.length === 0) {
    // Show no history message
    noHistoryMessage.classList.remove("hidden");
    paginationControls.classList.add("hidden");
    return;
  }

  // Sort history by date (newest first)
  quizHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Populate category filter
  populateCategoryFilter(quizHistory);

  // Set filtered history to all history initially
  filteredHistory = [...quizHistory];

  // Display history with pagination
  displayHistoryPage(currentPage);
}

function populateCategoryFilter(quizHistory) {
  // Get unique categories
  const categories = [
    ...new Set(quizHistory.map((attempt) => attempt.category)),
  ];

  // Clear existing options except "All Categories"
  while (categoryFilter.options.length > 1) {
    categoryFilter.remove(1);
  }

  // Add category options
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

function filterAndDisplayHistory() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const categoryValue = categoryFilter.value;

  // Get quiz history from localStorage
  const quizHistory = JSON.parse(localStorage.getItem("quizHistory")) || [];

  // Filter history based on search term and category
  filteredHistory = quizHistory.filter((attempt) => {
    const nameMatch = (attempt.name || `${attempt.category} Quiz`)
      .toLowerCase()
      .includes(searchTerm);
    const categoryMatch =
      categoryValue === "all" || attempt.category === categoryValue;
    return nameMatch && categoryMatch;
  });

  // Reset to first page when filtering
  currentPage = 1;

  // Display filtered history
  displayHistoryPage(currentPage);
}

function displayHistoryPage(page) {
  // Clear history container
  historyContainer.innerHTML = "";

  if (filteredHistory.length === 0) {
    historyContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <p>No quiz attempts match your search criteria.</p>
        <button class="secondary-btn" onclick="resetFilters()">
          <i class="fas fa-undo"></i> Reset Filters
        </button>
      </div>
    `;
    paginationControls.classList.add("hidden");
    return;
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredHistory.length
  );

  // Get current page items
  const currentPageItems = filteredHistory.slice(startIndex, endIndex);

  // Display each history item
  currentPageItems.forEach((attempt, index) => {
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";

    const formattedDate = new Date(attempt.date).toLocaleString();
    const attemptName = attempt.name || `${attempt.category} Quiz`;

    // Store a unique ID for each attempt (using timestamp if available, or generate one)
    const attemptId = attempt.date
      ? new Date(attempt.date).getTime().toString()
      : `attempt-${index}-${Date.now()}`;

    // Calculate the actual index in the filteredHistory array
    const actualIndex = startIndex + index;

    historyItem.innerHTML = `
      <div class="history-details">
        <div class="history-category">${attemptName}</div>
        <div class="history-meta">
          <span class="history-category-label">${attempt.category}</span>
          <span class="history-date">${formattedDate}</span>
        </div>
      </div>
      <div class="history-actions">
        <div class="history-score">
          ${attempt.correct}/${attempt.total} (${attempt.percentage}%)
        </div>
        <div class="action-buttons">
          <button class="view-details-btn" data-id="${attemptId}" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button class="delete-attempt-btn" data-index="${actualIndex}" title="Delete Attempt">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;

    historyContainer.appendChild(historyItem);

    // Add event listener to view details button
    const viewDetailsBtn = historyItem.querySelector(".view-details-btn");
    viewDetailsBtn.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      console.log("Viewing details for attempt ID:", id);

      // Find the attempt with this ID
      const attemptIndex = filteredHistory.findIndex((a) => {
        const aId = a.date ? new Date(a.date).getTime().toString() : "";
        return aId === id;
      });

      if (attemptIndex !== -1) {
        showQuizDetails(attemptIndex, filteredHistory[attemptIndex]);
      } else {
        console.error("Could not find attempt with ID:", id);
      }
    });

    // Add event listener to delete button
    const deleteBtn = historyItem.querySelector(".delete-attempt-btn");
    deleteBtn.addEventListener("click", function () {
      const index = Number.parseInt(this.getAttribute("data-index"));
      deleteQuizAttempt(index);
    });
  });

  // Update pagination controls
  updatePaginationControls(page, totalPages);
}

function updatePaginationControls(currentPage, totalPages) {
  if (totalPages <= 1) {
    paginationControls.classList.add("hidden");
    return;
  }

  paginationControls.classList.remove("hidden");
  paginationControls.innerHTML = "";

  // Previous button
  const prevButton = document.createElement("button");
  prevButton.className = `pagination-btn ${
    currentPage === 1 ? "disabled" : ""
  }`;
  prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      displayHistoryPage(currentPage - 1);
    }
  });
  paginationControls.appendChild(prevButton);

  // Page numbers
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // Adjust start page if we're near the end
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  // First page button if not visible
  if (startPage > 1) {
    const firstPageBtn = document.createElement("button");
    firstPageBtn.className = "pagination-btn";
    firstPageBtn.textContent = "1";
    firstPageBtn.addEventListener("click", () => displayHistoryPage(1));
    paginationControls.appendChild(firstPageBtn);

    if (startPage > 2) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination-ellipsis";
      ellipsis.textContent = "...";
      paginationControls.appendChild(ellipsis);
    }
  }

  // Page number buttons
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = `pagination-btn ${i === currentPage ? "active" : ""}`;
    pageBtn.textContent = i.toString();
    pageBtn.addEventListener("click", () => {
      currentPage = i;
      displayHistoryPage(currentPage);
    });
    paginationControls.appendChild(pageBtn);
  }

  // Last page button if not visible
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination-ellipsis";
      ellipsis.textContent = "...";
      paginationControls.appendChild(ellipsis);
    }

    const lastPageBtn = document.createElement("button");
    lastPageBtn.className = "pagination-btn";
    lastPageBtn.textContent = totalPages.toString();
    lastPageBtn.addEventListener("click", () => displayHistoryPage(totalPages));
    paginationControls.appendChild(lastPageBtn);
  }

  // Next button
  const nextButton = document.createElement("button");
  nextButton.className = `pagination-btn ${
    currentPage === totalPages ? "disabled" : ""
  }`;
  nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      displayHistoryPage(currentPage);
    }
  });
  paginationControls.appendChild(nextButton);
}

function resetFilters() {
  searchInput.value = "";
  categoryFilter.value = "all";
  filterAndDisplayHistory();
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
  paginationControls.classList.add("hidden");
  quizDetailsSection.classList.remove("hidden");

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showHistoryList() {
  // Show history list, hide quiz details
  historyContainer.classList.remove("hidden");
  paginationControls.classList.remove("hidden");
  quizDetailsSection.classList.add("hidden");
}

// Function to delete quiz attempts
function deleteQuizAttempt(index) {
  if (
    confirm(
      "Are you sure you want to delete this quiz attempt? This action cannot be undone."
    )
  ) {
    // Get quiz history
    const quizHistory = JSON.parse(localStorage.getItem("quizHistory")) || [];

    // Get the attempt to delete
    const attemptToDelete = filteredHistory[index];

    // Find the actual index in the full history
    const actualIndex = quizHistory.findIndex((attempt) => {
      return (
        attempt.date === attemptToDelete.date &&
        attempt.name === attemptToDelete.name &&
        attempt.category === attemptToDelete.category
      );
    });

    // Remove the attempt from the full history
    if (actualIndex >= 0) {
      quizHistory.splice(actualIndex, 1);

      // Save updated history back to localStorage
      localStorage.setItem("quizHistory", JSON.stringify(quizHistory));

      // Update filtered history
      filteredHistory.splice(index, 1);

      // Show success message
      const toast = document.createElement("div");
      toast.className = "toast success-toast";
      toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>Quiz attempt deleted successfully</span>
      `;
      document.body.appendChild(toast);

      // Remove toast after 3 seconds
      setTimeout(() => {
        toast.classList.add("hide-toast");
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);

      // If we're in details view, go back to history list
      if (!quizDetailsSection.classList.contains("hidden")) {
        showHistoryList();
      }

      // Refresh the current page
      displayHistoryPage(currentPage);
    }
  }
}

// Load history when page loads
document.addEventListener("DOMContentLoaded", loadQuizHistory);
