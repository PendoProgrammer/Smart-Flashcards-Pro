// script.js

class FlashcardApp {
    constructor() {
        this.flashcards = JSON.parse(localStorage.getItem('flashcards')) || [];
        this.currentCardIndex = 0;
        this.isFlipped = false;
        this.studySession = {
            total: 0,
            correct: 0,
            studied: 0
        };
        
        this.initializeApp();
        this.attachEventListeners();
        this.updateStats();
        this.updateManageView();
    }

    initializeApp() {
        // Set default tab
        this.showTab('study');
        this.updateCategoryFilter();
        this.updatePreview();
    }

    attachEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showTab(e.target.dataset.tab);
            });
        });

        // Study controls
        document.getElementById('startStudy').addEventListener('click', () => this.startStudy());
        document.getElementById('flipCard').addEventListener('click', () => this.flipCard());
        document.getElementById('correctBtn').addEventListener('click', () => this.markAnswer(true));
        document.getElementById('incorrectBtn').addEventListener('click', () => this.markAnswer(false));
        document.getElementById('nextCard').addEventListener('click', () => this.nextCard());

        // Create form
        document.getElementById('addCard').addEventListener('click', () => this.addFlashcard());
        
        // Preview inputs
        document.getElementById('questionInput').addEventListener('input', () => this.updatePreview());
        document.getElementById('answerInput').addEventListener('input', () => this.updatePreview());
        document.getElementById('previewFlip').addEventListener('click', () => this.flipPreview());

        // Manage controls
        document.getElementById('categoryFilter').addEventListener('change', () => this.updateManageView());
        document.getElementById('clearAll').addEventListener('click', () => this.confirmClearAll());

        // Modal controls
        document.getElementById('modalCancel').addEventListener('click', () => this.hideModal());
        document.getElementById('modalConfirm').addEventListener('click', () => this.executeModalAction());
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modalOverlay')) {
                this.hideModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    showTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });
    }

    startStudy() {
        if (this.flashcards.length === 0) {
            this.showMessage('No flashcards available! Create some first.', 'error');
            return;
        }

        this.currentCardIndex = 0;
        this.isFlipped = false;
        this.studySession = {
            total: this.flashcards.length,
            correct: 0,
            studied: 0
        };

        // Shuffle cards for study
        this.shuffleArray(this.flashcards);

        this.showCard();
        this.updateStudyControls('studying');
        this.showMessage('Study session started! Good luck!');
    }

    showCard() {
        if (this.currentCardIndex >= this.flashcards.length) {
            this.endStudy();
            return;
        }

        const card = this.flashcards[this.currentCardIndex];
        const flashcard = document.getElementById('flashcard');
        
        // Reset flip
        flashcard.classList.remove('flipped');
        this.isFlipped = false;

        // Update content
        document.getElementById('questionText').textContent = card.question;
        document.getElementById('answerText').textContent = card.answer;
        
        // Update counters
        const counter = `${this.currentCardIndex + 1} / ${this.flashcards.length}`;
        document.getElementById('cardCounter').textContent = counter;
        document.getElementById('cardCounterBack').textContent = counter;

        // Update controls
        this.updateStudyControls('question');
    }

    flipCard() {
        const flashcard = document.getElementById('flashcard');
        flashcard.classList.toggle('flipped');
        this.isFlipped = !this.isFlipped;
        
        if (this.isFlipped) {
            this.updateStudyControls('answer');
        }
    }

    markAnswer(isCorrect) {
        if (isCorrect) {
            this.studySession.correct++;
        }
        this.studySession.studied++;
        this.updateStats();
        this.updateStudyControls('answered');
    }

    nextCard() {
        this.currentCardIndex++;
        this.showCard();
    }

    endStudy() {
        const accuracy = Math.round((this.studySession.correct / this.studySession.studied) * 100) || 0;
        this.showMessage(`Study session completed! Accuracy: ${accuracy}%`);
        this.updateStudyControls('ended');
        
        // Reset card display
        document.getElementById('questionText').textContent = 'Great job! Click "Start Study" to practice again.';
        document.getElementById('cardCounter').textContent = '0 / 0';
        const flashcard = document.getElementById('flashcard');
        flashcard.classList.remove('flipped');
    }

    updateStudyControls(state) {
        const buttons = {
            startStudy: document.getElementById('startStudy'),
            flipCard: document.getElementById('flipCard'),
            correctBtn: document.getElementById('correctBtn'),
            incorrectBtn: document.getElementById('incorrectBtn'),
            nextCard: document.getElementById('nextCard')
        };

        // Hide all buttons first
        Object.values(buttons).forEach(btn => btn.classList.add('hidden'));

        switch (state) {
            case 'studying':
            case 'question':
                buttons.flipCard.classList.remove('hidden');
                break;
            case 'answer':
                buttons.correctBtn.classList.remove('hidden');
                buttons.incorrectBtn.classList.remove('hidden');
                break;
            case 'answered':
                buttons.nextCard.classList.remove('hidden');
                break;
            case 'ended':
                buttons.startStudy.classList.remove('hidden');
                break;
        }
    }

    addFlashcard() {
        const question = document.getElementById('questionInput').value.trim();
        const answer = document.getElementById('answerInput').value.trim();
        const category = document.getElementById('categoryInput').value.trim() || 'General';
        const difficulty = document.getElementById('difficultySelect').value;

        if (!question || !answer) {
            this.showMessage('Please fill in both question and answer!', 'error');
            return;
        }

        const newCard = {
            id: Date.now(),
            question,
            answer,
            category,
            difficulty,
            created: new Date().toISOString()
        };

        this.flashcards.push(newCard);
        this.saveToStorage();
        this.clearCreateForm();
        this.updateStats();
        this.updateManageView();
        this.updateCategoryFilter();
        this.showMessage('Flashcard added successfully!');
    }

    clearCreateForm() {
        document.getElementById('questionInput').value = '';
        document.getElementById('answerInput').value = '';
        document.getElementById('categoryInput').value = '';
        document.getElementById('difficultySelect').value = 'medium';
        this.updatePreview();
    }

    updatePreview() {
        const question = document.getElementById('questionInput').value.trim() || 'Question will appear here...';
        const answer = document.getElementById('answerInput').value.trim() || 'Answer will appear here...';
        
        document.getElementById('previewQuestion').textContent = question;
        document.getElementById('previewAnswer').textContent = answer;
    }

    flipPreview() {
        const front = document.querySelector('.preview-front');
        const back = document.querySelector('.preview-back');
        
        if (front.classList.contains('hidden')) {
            front.classList.remove('hidden');
            back.classList.add('hidden');
        } else {
            front.classList.add('hidden');
            back.classList.remove('hidden');
        }
    }

    updateStats() {
        document.getElementById('totalCards').textContent = this.flashcards.length;
        document.getElementById('studiedCards').textContent = this.studySession.studied;
        
        const accuracy = this.studySession.studied > 0 
            ? Math.round((this.studySession.correct / this.studySession.studied) * 100)
            : 0;
        document.getElementById('accuracy').textContent = `${accuracy}%`;
    }

    updateManageView() {
        const grid = document.getElementById('cardsGrid');
        const filter = document.getElementById('categoryFilter').value;
        
        if (this.flashcards.length === 0) {
            grid.innerHTML = `
                <div class="no-cards">
                    <i class="fas fa-folder-open"></i>
                    <p>No flashcards created yet. Go to Create tab to add some!</p>
                </div>
            `;
            return;
        }

        const filteredCards = filter === 'all' 
            ? this.flashcards 
            : this.flashcards.filter(card => card.category === filter);

        if (filteredCards.length === 0) {
            grid.innerHTML = `
                <div class="no-cards">
                    <i class="fas fa-search"></i>
                    <p>No flashcards found for the selected category.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredCards.map(card => `
            <div class="card-item">
                <div class="card-category">${card.category}</div>
                <div class="card-difficulty difficulty-${card.difficulty}">${card.difficulty}</div>
                <div class="card-question">${card.question}</div>
                <div class="card-answer">${card.answer}</div>
                <div class="card-actions">
                    <button class="btn btn-small btn-danger" onclick="app.deleteCard(${card.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateCategoryFilter() {
        const select = document.getElementById('categoryFilter');
        const categories = [...new Set(this.flashcards.map(card => card.category))];
        
        const currentValue = select.value;
        select.innerHTML = '<option value="all">All Categories</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
        
        // Restore previous selection if it still exists
        if (categories.includes(currentValue)) {
            select.value = currentValue;
        }
    }

    deleteCard(cardId) {
        this.showModal(
            'Delete Flashcard',
            'Are you sure you want to delete this flashcard? This action cannot be undone.',
            () => {
                this.flashcards = this.flashcards.filter(card => card.id !== cardId);
                this.saveToStorage();
                this.updateStats();
                this.updateManageView();
                this.updateCategoryFilter();
                this.showMessage('Flashcard deleted successfully!');
                this.hideModal();
            }
        );
    }

    confirmClearAll() {
        if (this.flashcards.length === 0) {
            this.showMessage('No flashcards to delete!', 'error');
            return;
        }

        this.showModal(
            'Clear All Flashcards',
            'Are you sure you want to delete ALL flashcards? This action cannot be undone.',
            () => {
                this.flashcards = [];
                this.saveToStorage();
                this.updateStats();
                this.updateManageView();
                this.updateCategoryFilter();
                this.showMessage('All flashcards cleared successfully!');
                this.hideModal();
            }
        );
    }

    showModal(title, message, confirmAction) {
        document.querySelector('.modal h3').textContent = title;
        document.getElementById('modalText').textContent = message;
        this.modalConfirmAction = confirmAction;
        document.getElementById('modalOverlay').classList.remove('hidden');
    }

    hideModal() {
        document.getElementById('modalOverlay').classList.add('hidden');
        this.modalConfirmAction = null;
    }

    executeModalAction() {
        if (this.modalConfirmAction) {
            this.modalConfirmAction();
        }
    }

    showMessage(message, type = 'success') {
        const messageEl = document.getElementById('successMessage');
        const span = messageEl.querySelector('span');
        
        span.textContent = message;
        messageEl.className = `success-message ${type === 'error' ? 'error' : ''}`;
        messageEl.classList.remove('hidden');

        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 3000);
    }

    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (e.key) {
            case ' ':
            case 'Enter':
                e.preventDefault();
                if (!document.getElementById('flipCard').classList.contains('hidden')) {
                    this.flipCard();
                }
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (!document.getElementById('correctBtn').classList.contains('hidden')) {
                    this.markAnswer(true);
                } else if (!document.getElementById('nextCard').classList.contains('hidden')) {
                    this.nextCard();
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (!document.getElementById('incorrectBtn').classList.contains('hidden')) {
                    this.markAnswer(false);
                }
                break;
            case 's':
                e.preventDefault();
                if (!document.getElementById('startStudy').classList.contains('hidden')) {
                    this.startStudy();
                }
                break;
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    saveToStorage() {
        localStorage.setItem('flashcards', JSON.stringify(this.flashcards));
    }

    // Sample data for demonstration
    loadSampleData() {
        if (this.flashcards.length === 0) {
            this.flashcards = [
                {
                    id: 1,
                    question: "What is the capital of France?",
                    answer: "Paris",
                    category: "Geography",
                    difficulty: "easy",
                    created: new Date().toISOString()
                },
                {
                    id: 2,
                    question: "What is 2 + 2?",
                    answer: "4",
                    category: "Math",
                    difficulty: "easy",
                    created: new Date().toISOString()
                },
                {
                    id: 3,
                    question: "Who wrote 'Romeo and Juliet'?",
                    answer: "William Shakespeare",
                    category: "Literature",
                    difficulty: "medium",
                    created: new Date().toISOString()
                },
                {
                    id: 4,
                    question: "What is the chemical symbol for gold?",
                    answer: "Au",
                    category: "Science",
                    difficulty: "medium",
                    created: new Date().toISOString()
                },
                {
                    id: 5,
                    question: "In which year did World War II end?",
                    answer: "1945",
                    category: "History",
                    difficulty: "medium",
                    created: new Date().toISOString()
                }
            ];
            this.saveToStorage();
            this.updateStats();
            this.updateManageView();
            this.updateCategoryFilter();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FlashcardApp();
    
    // Load sample data if no flashcards exist
    app.loadSampleData();
});

// Add some additional CSS for error messages
const style = document.createElement('style');
style.textContent = `
    .success-message.error {
        background: #dc3545 !important;
    }
`;
document.head.appendChild(style);