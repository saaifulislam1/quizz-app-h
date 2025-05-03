// DOM Elements
const jsonFileInput = document.getElementById("json-file")
const jsonTextarea = document.getElementById("json-text")
const loadQuizBtn = document.getElementById("load-quiz-btn")
const jsonErrorDiv = document.getElementById("json-error")
const jsonInputSection = document.getElementById("json-input-section")
const quizSection = document.getElementById("quiz-section")
const resultsSection = document.getElementById("results-section")
const quizCategory = document.getElementById("quiz-category")
const questionCount = document.getElementById("question-count")
const questionsContainer = document.getElementById("questions-container")
const submitQuizBtn = document.getElementById("submit-quiz-btn")
const correctCount = document.getElementById("correct-count")
const totalQuestions = document.getElementById("total-questions")
const scorePercentage = document.getElementById("score-percentage")
const takeAnotherBtn = document.getElementById("take-another-btn")
const fileName = document.getElementById("file-name")

// Add these variables to the top with other DOM elements
const progressFill = document.getElementById("progress-fill")
const answeredCount = document.getElementById("answered-count")
const totalCount = document.getElementById("total-count")
const attemptNameInput = document.getElementById("attempt-name")

// Add this to the DOM Elements section at the top
const saveAttemptBtn = document.getElementById("save-attempt-btn")
const saveFeedback = document.getElementById("save-feedback")

// Global variables
let quizData = []
let currentCategory = ""
let userAnswers = []

// Add this at the top with other global variables
let quizResults = []

// Event Listeners
loadQuizBtn.addEventListener("click", loadQuiz)
submitQuizBtn.addEventListener("click", submitQuiz)
takeAnotherBtn.addEventListener("click", resetQuiz)
jsonFileInput.addEventListener("change", handleFileUpload)

// Add this to the Event Listeners section
saveAttemptBtn.addEventListener("click", saveQuizAttempt)

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Update file name display when file is selected
  jsonFileInput.addEventListener("change", function () {
    if (this.files.length > 0) {
      fileName.textContent = this.files[0].name
    } else {
      fileName.textContent = "No file chosen"
    }
  })
})

// Functions
function handleFileUpload(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      jsonTextarea.value = e.target.result
    }
    reader.readAsText(file)
  }
}

function loadQuiz() {
  try {
    // Clear previous error messages
    jsonErrorDiv.textContent = ""

    // Get JSON data from textarea
    const jsonData = jsonTextarea.value.trim()
    if (!jsonData) {
      throw new Error("Please provide JSON quiz data")
    }

    // Parse JSON
    quizData = JSON.parse(jsonData)

    // Validate quiz data
    if (!Array.isArray(quizData) || quizData.length === 0) {
      throw new Error("Invalid quiz data format. Expected a non-empty array.")
    }

    // Check if each question has required fields
    for (const question of quizData) {
      if (
        !question.id ||
        !question.question ||
        !question.options ||
        !Array.isArray(question.options) ||
        question.options.length === 0 ||
        !question.correctAnswer === undefined ||
        !question.explanation
      ) {
        throw new Error(
          "Invalid question format. Each question must have id, question, options array, correctAnswer, and explanation.",
        )
      }
    }

    // Set category (use the first question's category or 'General' if not available)
    currentCategory = quizData[0].category || "General"
    quizCategory.textContent = `Category: ${currentCategory}`
    questionCount.textContent = `${quizData.length} Questions`

    // Initialize user answers array
    userAnswers = Array(quizData.length).fill(null)

    // Display questions
    displayQuestions()

    // Show quiz section, hide input section
    jsonInputSection.classList.add("hidden")
    quizSection.classList.remove("hidden")
    resultsSection.classList.add("hidden")

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" })
  } catch (error) {
    jsonErrorDiv.textContent = error.message
  }
}

function displayQuestions() {
  questionsContainer.innerHTML = ""

  quizData.forEach((question, index) => {
    const questionCard = document.createElement("div")
    questionCard.className = "question-card"
    questionCard.dataset.id = question.id
    questionCard.dataset.index = index

    const questionText = document.createElement("div")
    questionText.className = "question-text"
    questionText.textContent = `${index + 1}. ${question.question}`

    const optionsList = document.createElement("ul")
    optionsList.className = "options-list"

    question.options.forEach((option, optionIndex) => {
      const optionItem = document.createElement("li")
      optionItem.className = "option-item"

      const optionLabel = document.createElement("label")
      optionLabel.className = "option-label"

      const optionInput = document.createElement("input")
      optionInput.type = "radio"
      optionInput.name = `question-${question.id}`
      optionInput.value = optionIndex
      optionInput.className = "option-input"
      optionInput.addEventListener("change", () => {
        userAnswers[index] = optionIndex
        updateProgress()
      })

      const optionText = document.createTextNode(option)

      optionLabel.appendChild(optionInput)
      optionLabel.appendChild(optionText)
      optionItem.appendChild(optionLabel)
      optionsList.appendChild(optionItem)
    })

    // Create explanation div (hidden initially)
    const explanationDiv = document.createElement("div")
    explanationDiv.className = "explanation hidden"
    explanationDiv.textContent = question.explanation

    questionCard.appendChild(questionText)
    questionCard.appendChild(optionsList)
    questionCard.appendChild(explanationDiv)
    questionsContainer.appendChild(questionCard)
  })
  updateProgress()
}

// Add this function after displayQuestions()
function updateProgress() {
  const answered = userAnswers.filter((answer) => answer !== null).length
  const total = userAnswers.length

  // Update progress bar
  const percentage = total > 0 ? (answered / total) * 100 : 0
  progressFill.style.width = `${percentage}%`

  // Update text
  answeredCount.textContent = answered
  totalCount.textContent = total
}

function submitQuiz() {
  let correctAnswers = 0
  const questionCards = document.querySelectorAll(".question-card")

  // Store quiz results for later saving
  quizResults = []
  questionCards.forEach((card, cardIndex) => {
    const questionId = Number.parseInt(card.dataset.id)
    const questionIndex = Number.parseInt(card.dataset.index)
    const question = quizData.find((q) => q.id === questionId)
    const selectedOption = card.querySelector('input[type="radio"]:checked')
    const explanationDiv = card.querySelector(".explanation")
    const optionLabels = card.querySelectorAll(".option-label")

    // Show explanation
    explanationDiv.classList.remove("hidden")

    let isCorrect = false
    let selectedIndex = null

    if (selectedOption) {
      selectedIndex = Number.parseInt(selectedOption.value)
      isCorrect = selectedIndex === question.correctAnswer
    }

    // Store result for this question
    quizResults.push({
      questionId,
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      userAnswer: selectedIndex,
      isCorrect,
      explanation: question.explanation,
    })

    // Highlight correct and incorrect options
    optionLabels.forEach((label, index) => {
      // Add result icon
      const resultIcon = document.createElement("span")
      resultIcon.className = "result-icon"

      if (index === question.correctAnswer) {
        // This is the correct answer
        label.classList.add("correct")
        resultIcon.classList.add("correct")
        resultIcon.innerHTML = '<i class="fas fa-check-circle"></i>'
        label.appendChild(resultIcon)
      } else if (selectedIndex === index) {
        // This is the selected wrong answer
        label.classList.add("incorrect")
        resultIcon.classList.add("incorrect")
        resultIcon.innerHTML = '<i class="fas fa-times-circle"></i>'
        label.appendChild(resultIcon)
      }
    })

    if (isCorrect) {
      correctAnswers++
      card.classList.add("correct")
    } else {
      card.classList.add("incorrect")
    }
  })

  // Update and show results
  const total = quizData.length
  const percentage = Math.round((correctAnswers / total) * 100)

  correctCount.textContent = correctAnswers
  totalQuestions.textContent = total
  scorePercentage.textContent = percentage

  // Save quiz attempt to localStorage
  // Remove this line from the submitQuiz function:
  // saveQuizAttempt(currentCategory, correctAnswers, total, percentage, quizResults)

  // Show results section
  quizSection.classList.add("hidden")
  resultsSection.classList.remove("hidden")

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" })
}

// Replace the saveQuizAttempt function with this updated version
function saveQuizAttempt() {
  // Get attempt name or use default
  const attemptName = attemptNameInput.value.trim() || `${currentCategory} Quiz`

  const attempt = {
    name: attemptName,
    category: currentCategory,
    date: new Date().toISOString(),
    correct: Number.parseInt(correctCount.textContent),
    total: Number.parseInt(totalQuestions.textContent),
    percentage: Number.parseInt(scorePercentage.textContent),
    results: quizResults,
  }

  // Get existing history or initialize empty array
  const quizHistory = JSON.parse(localStorage.getItem("quizHistory")) || []

  // Add new attempt
  quizHistory.push(attempt)

  // Save back to localStorage
  localStorage.setItem("quizHistory", JSON.stringify(quizHistory))

  // Show feedback message
  saveFeedback.textContent = "Quiz attempt saved successfully!"
  saveFeedback.classList.remove("hidden")
  saveFeedback.classList.add("success-message")

  // Disable save button to prevent duplicate saves
  saveAttemptBtn.disabled = true
  saveAttemptBtn.classList.add("disabled")

  // Enable view history button
  setTimeout(() => {
    saveFeedback.innerHTML += '<br>You can now view this attempt in your <a href="history.html">Quiz History</a>.'
  }, 1000)
}

function resetQuiz() {
  // Clear form and go back to input section
  jsonTextarea.value = ""
  jsonFileInput.value = ""
  fileName.textContent = "No file chosen"
  jsonErrorDiv.textContent = ""

  // Reset quiz data
  quizData = []
  userAnswers = []

  // Show input section, hide others
  jsonInputSection.classList.remove("hidden")
  quizSection.classList.add("hidden")
  resultsSection.classList.add("hidden")

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" })
}
