<script>
  import { createEventDispatcher } from 'svelte'
  import { Brain, CheckCircle, XCircle, RotateCcw, Trophy } from '@lucide/svelte'

  export let mood = ''
  export let category = ''

  const dispatch = createEventDispatcher()

  let currentQuestionIndex = 0
  let selectedAnswer = null
  let answers = []
  let showResults = false
  let score = 0

  // Quiz questions based on mood and category
  const quizData = {
    '😊': {
      title: 'Happiness & Joy Quiz',
      description: 'Test your knowledge about maintaining and amplifying positive emotions',
      questions: [
        {
          question: 'What is the most effective way to maintain happiness throughout the day?',
          options: [
            'Avoiding all negative thoughts',
            'Practicing gratitude regularly',
            'Staying busy constantly',
            'Comparing yourself to others'
          ],
          correct: 1,
          explanation: 'Regular gratitude practice has been scientifically proven to increase happiness and life satisfaction.'
        },
        {
          question: 'Which activity is most likely to boost your mood naturally?',
          options: [
            'Scrolling social media',
            'Physical exercise',
            'Watching TV all day',
            'Eating sugary foods'
          ],
          correct: 1,
          explanation: 'Exercise releases endorphins, which are natural mood boosters and stress relievers.'
        },
        {
          question: 'What is the "hedonic treadmill" in psychology?',
          options: [
            'A type of exercise equipment',
            'The tendency to return to baseline happiness despite positive events',
            'A method for measuring joy',
            'A happiness meditation technique'
          ],
          correct: 1,
          explanation: 'The hedonic treadmill explains why we adapt to positive changes and return to our baseline happiness level.'
        }
      ]
    },
    '😌': {
      title: 'Mindfulness & Calm Quiz',
      description: 'Explore your understanding of peace, tranquility, and mindfulness practices',
      questions: [
        {
          question: 'What is the primary goal of mindfulness meditation?',
          options: [
            'To empty your mind completely',
            'To observe thoughts without judgment',
            'To think positive thoughts only',
            'To solve all your problems'
          ],
          correct: 1,
          explanation: 'Mindfulness is about observing thoughts and feelings without getting caught up in them or judging them.'
        },
        {
          question: 'Which breathing technique is most effective for immediate calm?',
          options: [
            'Rapid shallow breathing',
            'Holding your breath',
            'Deep diaphragmatic breathing',
            'Breathing through your mouth only'
          ],
          correct: 2,
          explanation: 'Deep diaphragmatic breathing activates the parasympathetic nervous system, promoting relaxation.'
        },
        {
          question: 'What does "being present" mean in mindfulness?',
          options: [
            'Always being physically present',
            'Focusing attention on the current moment',
            'Never thinking about the future',
            'Avoiding all distractions'
          ],
          correct: 1,
          explanation: 'Being present means focusing your attention on what\'s happening right now, in this moment.'
        }
      ]
    },
    '😢': {
      title: 'Emotional Processing Quiz',
      description: 'Learn healthy ways to process and work through difficult emotions',
      questions: [
        {
          question: 'What is the healthiest way to deal with sadness?',
          options: [
            'Suppress the feeling completely',
            'Acknowledge and allow the emotion',
            'Distract yourself immediately',
            'Blame others for your feelings'
          ],
          correct: 1,
          explanation: 'Acknowledging and allowing emotions helps process them healthily rather than suppressing them.'
        },
        {
          question: 'How long do most emotions typically last if not resisted?',
          options: [
            '90 seconds to 20 minutes',
            'Several hours',
            'Multiple days',
            'Weeks or months'
          ],
          correct: 0,
          explanation: 'Research shows that emotions typically last 90 seconds to 20 minutes when we don\'t resist them.'
        },
        {
          question: 'What is emotional validation?',
          options: [
            'Proving your emotions are right',
            'Accepting emotions as legitimate and understandable',
            'Getting others to agree with your feelings',
            'Justifying emotional reactions'
          ],
          correct: 1,
          explanation: 'Emotional validation means accepting that your emotions are legitimate and understandable responses.'
        }
      ]
    },
    '😠': {
      title: 'Anger Management Quiz',
      description: 'Discover constructive ways to channel and release anger',
      questions: [
        {
          question: 'What is the most effective immediate response to anger?',
          options: [
            'Express it immediately',
            'Take deep breaths and pause',
            'Ignore the feeling',
            'Blame the trigger'
          ],
          correct: 1,
          explanation: 'Taking deep breaths and pausing helps activate your rational mind before reacting.'
        },
        {
          question: 'Which physical activity best helps release anger?',
          options: [
            'Punching a pillow',
            'Vigorous cardio exercise',
            'Sitting still',
            'Eating comfort food'
          ],
          correct: 1,
          explanation: 'Vigorous cardio exercise helps metabolize stress hormones and release tension constructively.'
        },
        {
          question: 'What underlying emotion often drives anger?',
          options: [
            'Happiness',
            'Hurt or fear',
            'Excitement',
            'Boredom'
          ],
          correct: 1,
          explanation: 'Anger is often a secondary emotion that masks underlying hurt, fear, or vulnerability.'
        }
      ]
    },
    '😰': {
      title: 'Anxiety Coping Quiz',
      description: 'Master tools to manage worry and find your center',
      questions: [
        {
          question: 'What is the 5-4-3-2-1 grounding technique?',
          options: [
            'A breathing pattern',
            'Using your 5 senses to stay present',
            'A counting meditation',
            'A time management method'
          ],
          correct: 1,
          explanation: 'The 5-4-3-2-1 technique uses your senses: 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste.'
        },
        {
          question: 'Which thought pattern increases anxiety?',
          options: [
            'Focusing on the present',
            'Catastrophic thinking',
            'Problem-solving',
            'Accepting uncertainty'
          ],
          correct: 1,
          explanation: 'Catastrophic thinking (imagining worst-case scenarios) feeds anxiety and makes it worse.'
        },
        {
          question: 'What is the best way to handle "what if" thoughts?',
          options: [
            'Try to answer every "what if"',
            'Acknowledge them and return to the present',
            'Worry about them more',
            'Ignore them completely'
          ],
          correct: 1,
          explanation: 'Acknowledging "what if" thoughts without engaging with them helps break the anxiety cycle.'
        }
      ]
    }
  }

  $: currentQuiz = quizData[mood] || {
    title: 'General Wellness Quiz',
    description: 'Test your knowledge about mental wellness',
    questions: [
      {
        question: 'What is the most important factor in mental wellness?',
        options: ['Perfect happiness', 'Self-awareness', 'Avoiding problems', 'Being busy'],
        correct: 1,
        explanation: 'Self-awareness is the foundation of mental wellness and emotional intelligence.'
      }
    ]
  }

  $: currentQuestion = currentQuiz.questions[currentQuestionIndex]
  $: isLastQuestion = currentQuestionIndex === currentQuiz.questions.length - 1

  function selectAnswer(index) {
    selectedAnswer = index
  }

  function nextQuestion() {
    if (selectedAnswer === null) return

    answers.push({
      questionIndex: currentQuestionIndex,
      selectedAnswer,
      correct: selectedAnswer === currentQuestion.correct
    })

    if (selectedAnswer === currentQuestion.correct) {
      score++
    }

    if (isLastQuestion) {
      showResults = true
    } else {
      currentQuestionIndex++
      selectedAnswer = null
    }
  }

  function restartQuiz() {
    currentQuestionIndex = 0
    selectedAnswer = null
    answers = []
    showResults = false
    score = 0
  }

  function closeQuiz() {
    dispatch('close')
  }

  function getScoreMessage() {
    const percentage = (score / currentQuiz.questions.length) * 100
    if (percentage >= 80) return 'Excellent! You have great wellness knowledge.'
    if (percentage >= 60) return 'Good job! You understand wellness basics well.'
    if (percentage >= 40) return 'Not bad! There\'s room to learn more.'
    return 'Keep learning! Wellness is a journey of discovery.'
  }

  function getScoreColor() {
    const percentage = (score / currentQuiz.questions.length) * 100
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-blue-600'
    if (percentage >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }
</script>

<div class="wellness-quiz">
  {#if !showResults}
    <!-- Quiz Header -->
    <div class="quiz-header">
      <div class="flex items-center space-x-3 mb-4">
        <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
          <Brain size={24} class="text-white" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">{currentQuiz.title}</h2>
          <p class="text-gray-600 text-sm">{currentQuiz.description}</p>
        </div>
      </div>
      
      <!-- Progress -->
      <div class="flex items-center justify-between mb-6">
        <span class="text-sm text-gray-600">
          Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
        </span>
        <div class="w-32 bg-gray-200 rounded-full h-2">
          <div 
            class="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style="width: {((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%"
          ></div>
        </div>
      </div>
    </div>

    <!-- Question -->
    <div class="question-section">
      <h3 class="text-lg font-semibold text-gray-800 mb-6 leading-relaxed">
        {currentQuestion.question}
      </h3>
      
      <div class="space-y-3 mb-8">
        {#each currentQuestion.options as option, index}
          <button
            on:click={() => selectAnswer(index)}
            class="option-button {selectedAnswer === index ? 'selected' : ''}"
          >
            <div class="option-indicator">
              {#if selectedAnswer === index}
                <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
              {:else}
                <div class="w-3 h-3 border-2 border-gray-300 rounded-full"></div>
              {/if}
            </div>
            <span class="flex-1 text-left">{option}</span>
          </button>
        {/each}
      </div>
      
      <div class="flex justify-between">
        <button
          on:click={closeQuiz}
          class="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Exit Quiz
        </button>
        
        <button
          on:click={nextQuestion}
          disabled={selectedAnswer === null}
          class="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
        </button>
      </div>
    </div>
  {:else}
    <!-- Results -->
    <div class="results-section">
      <div class="text-center mb-8">
        <div class="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy size={40} class="text-white" />
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Quiz Complete!</h2>
        <p class="text-gray-600">{currentQuiz.title}</p>
      </div>
      
      <!-- Score -->
      <div class="score-display">
        <div class="text-center mb-6">
          <div class="text-6xl font-bold {getScoreColor()} mb-2">
            {score}/{currentQuiz.questions.length}
          </div>
          <div class="text-lg text-gray-600 mb-4">
            {Math.round((score / currentQuiz.questions.length) * 100)}% Correct
          </div>
          <p class="text-gray-700 font-medium">{getScoreMessage()}</p>
        </div>
      </div>
      
      <!-- Answer Review -->
      <div class="answer-review">
        <h3 class="font-bold text-gray-800 mb-4">Review Your Answers</h3>
        <div class="space-y-4">
          {#each answers as answer, index}
            <div class="review-item {answer.correct ? 'correct' : 'incorrect'}">
              <div class="flex items-start space-x-3">
                <div class="result-icon">
                  {#if answer.correct}
                    <CheckCircle size={20} class="text-green-500" />
                  {:else}
                    <XCircle size={20} class="text-red-500" />
                  {/if}
                </div>
                <div class="flex-1">
                  <p class="font-medium text-gray-800 mb-2">
                    {currentQuiz.questions[index].question}
                  </p>
                  <p class="text-sm text-gray-600 mb-2">
                    Your answer: {currentQuiz.questions[index].options[answer.selectedAnswer]}
                  </p>
                  {#if !answer.correct}
                    <p class="text-sm text-green-600 mb-2">
                      Correct answer: {currentQuiz.questions[index].options[currentQuiz.questions[index].correct]}
                    </p>
                  {/if}
                  <p class="text-sm text-gray-500 italic">
                    {currentQuiz.questions[index].explanation}
                  </p>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex justify-between mt-8">
        <button
          on:click={closeQuiz}
          class="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Close
        </button>
        
        <button
          on:click={restartQuiz}
          class="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
        >
          <RotateCcw size={18} />
          <span>Retake Quiz</span>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .wellness-quiz {
    @apply bg-white rounded-3xl p-8 shadow-lg border border-gray-200 max-w-2xl mx-auto;
  }

  .option-button {
    @apply w-full flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-all duration-200 text-gray-700;
  }

  .option-button.selected {
    @apply border-blue-500 bg-blue-50 text-blue-800;
  }

  .score-display {
    @apply bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200 mb-6;
  }

  .review-item {
    @apply p-4 rounded-xl border-2;
  }

  .review-item.correct {
    @apply border-green-200 bg-green-50;
  }

  .review-item.incorrect {
    @apply border-red-200 bg-red-50;
  }

  .result-icon {
    @apply flex-shrink-0 mt-1;
  }
</style>