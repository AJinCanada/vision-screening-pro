// Speech Recognition Manager - Production-Ready Version
// Fixes: Auto-stop, timer display, Chrome 15s timeout, continuous listening
class SpeechRecognitionManager {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.currentSentence = '';
    this.targetWords = [];
    this.recognizedWords = [];
    this.startTime = null;
    this.endTime = null;
    this.callbacks = {};
    this.restartTimeout = null;
    this.checkCompletionInterval = null;
    this.hasReceivedResults = false;
    this.consecutiveNoSpeechCount = 0;
    this.isManualStop = false;
    
    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported');
      return false;
    }

    this.recognition = new SpeechRecognition();
    
    // CRITICAL CONFIGURATION
    this.recognition.continuous = false; // FALSE! We'll manually restart
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 3;

    // Event handlers
    this.recognition.onstart = () => this.handleStart();
    this.recognition.onresult = (event) => this.handleResult(event);
    this.recognition.onerror = (event) => this.handleError(event);
    this.recognition.onend = () => this.handleEnd();

    return true;
  }

  startListening(sentence, callbacks = {}) {
    if (!this.recognition) {
      alert('Speech recognition not supported. Please use Chrome, Edge, or Safari.');
      return false;
    }

    // Reset state
    this.currentSentence = sentence;
    this.targetWords = this.extractWords(sentence);
    this.recognizedWords = [];
    this.callbacks = callbacks;
    this.startTime = Date.now();
    this.endTime = null;
    this.isListening = true;
    this.hasReceivedResults = false;
    this.consecutiveNoSpeechCount = 0;
    this.isManualStop = false;

    // Clear any existing timers
    this.clearAllTimers();

    console.log('🎤 Starting recognition...');
    console.log('Target:', this.targetWords);

    // Start recognition
    this.startRecognitionService();

    // Start periodic completion check (every 500ms)
    this.checkCompletionInterval = setInterval(() => {
      this.checkForCompletion();
    }, 500);

    return true;
  }

  startRecognitionService() {
    try {
      this.recognition.start();
      console.log('✓ Recognition service started');
    } catch (error) {
      console.error('Failed to start:', error);
      
      // If already started, ignore error
      if (error.message && error.message.includes('already started')) {
        console.log('Recognition already running');
        return;
      }
      
      if (this.callbacks.onError) {
        this.callbacks.onError({ error: 'start-failed', message: error.message });
      }
    }
  }

  stopListening() {
    console.log('⏹ Manual stop requested');
    
    this.isManualStop = true;
    this.isListening = false;
    
    // Capture end time
    if (!this.endTime) {
      this.endTime = Date.now();
    }
    
    // Clear all timers
    this.clearAllTimers();
    
    // Stop recognition
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping:', error);
    }
  }

  clearAllTimers() {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    
    if (this.checkCompletionInterval) {
      clearInterval(this.checkCompletionInterval);
      this.checkCompletionInterval = null;
    }
  }

  extractWords(sentence) {
    return sentence
      .toLowerCase()
      .replace(/[.,!?;:]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  handleStart() {
    console.log('🎤 Recognition started');
    
    if (this.callbacks.onStart) {
      this.callbacks.onStart();
    }
  }

  handleResult(event) {
    this.hasReceivedResults = true;
    this.consecutiveNoSpeechCount = 0;
    
    let interimTranscript = '';
    let finalTranscript = '';

    // Process all results
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    // Update recognized words from final results
    if (finalTranscript.trim()) {
      const newWords = this.extractWords(finalTranscript);
      
      newWords.forEach(word => {
        if (!this.recognizedWords.includes(word)) {
          this.recognizedWords.push(word);
        }
      });
      
      console.log('✓ Final:', finalTranscript.trim());
      console.log('📝 Recognized:', this.recognizedWords);
    }

    // Real-time feedback
    if (this.callbacks.onInterim) {
      const progress = this.calculateProgress();
      
      this.callbacks.onInterim({
        interim: interimTranscript,
        final: finalTranscript,
        recognizedWords: this.recognizedWords,
        progress: progress
      });
    }
  }

  checkForCompletion() {
    if (!this.isListening || this.isManualStop) {
      return;
    }

    const progress = this.calculateProgress();
    
    // Check if we have enough words recognized
    if (progress.percentage >= 80 && this.hasReceivedResults) {
      console.log(`✅ COMPLETE! ${progress.percentage}% recognized`);
      this.completeRecognition();
    }
  }

  completeRecognition() {
    this.isListening = false;
    
    if (!this.endTime) {
      this.endTime = Date.now();
    }
    
    this.clearAllTimers();
    
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping:', error);
    }
    
    this.finalizeSentence();
  }

  calculateProgress() {
    const totalWords = this.targetWords.length;
    const matchedWords = this.countMatchedWords();
    return {
      matched: matchedWords,
      total: totalWords,
      percentage: totalWords > 0 ? Math.round((matchedWords / totalWords) * 100) : 0
    };
  }

  countMatchedWords() {
    let matchCount = 0;
    
    for (const targetWord of this.targetWords) {
      const found = this.recognizedWords.some(recognizedWord => {
        return this.isSimilar(targetWord, recognizedWord);
      });
      
      if (found) matchCount++;
    }
    
    return matchCount;
  }

  isSimilar(word1, word2) {
    if (word1 === word2) return true;
    if (word1.includes(word2) || word2.includes(word1)) return true;
    
    const distance = this.levenshteinDistance(word1, word2);
    const maxLength = Math.max(word1.length, word2.length);
    const similarity = 1 - (distance / maxLength);
    
    return similarity >= 0.7;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  finalizeSentence() {
    if (!this.endTime) {
      this.endTime = Date.now();
    }
    
    const readingTime = (this.endTime - this.startTime) / 1000;
    const progress = this.calculateProgress();
    const errors = this.targetWords.length - progress.matched;
    const wordsPerMinute = progress.matched > 0 
      ? Math.round((progress.matched / readingTime) * 60) 
      : 0;
    
    const result = {
      sentence: this.currentSentence,
      targetWords: this.targetWords,
      recognizedWords: this.recognizedWords,
      readingTime: readingTime,
      wordsPerMinute: wordsPerMinute,
      errors: errors,
      accuracy: progress.percentage,
      completed: true
    };

    console.log('📊 FINAL RESULT:', result);

    if (this.callbacks.onComplete) {
      this.callbacks.onComplete(result);
    }
  }

  handleError(event) {
    console.error('❌ Error:', event.error);
    
    // Handle specific errors
    if (event.error === 'no-speech') {
      this.consecutiveNoSpeechCount++;
      
      // If we've had multiple no-speech errors and have some results, complete
      if (this.consecutiveNoSpeechCount >= 2 && this.hasReceivedResults) {
        console.log('Multiple no-speech, completing...');
        this.completeRecognition();
        return;
      }
      
      // Otherwise restart after brief delay
      if (this.isListening && !this.isManualStop) {
        console.log('No speech detected, restarting...');
        this.restartTimeout = setTimeout(() => {
          if (this.isListening) {
            this.startRecognitionService();
          }
        }, 100);
      }
      return;
    }
    
    if (event.error === 'aborted' && this.isManualStop) {
      // Normal manual stop, don't show error
      return;
    }
    
    // Show error for other cases
    let errorMessage = 'Speech recognition error: ';
    
    switch (event.error) {
      case 'audio-capture':
        errorMessage += 'No microphone found.';
        break;
      case 'not-allowed':
        errorMessage += 'Microphone permission denied.';
        break;
      case 'network':
        errorMessage += 'Network error.';
        break;
      default:
        errorMessage += event.error;
    }

    if (this.callbacks.onError) {
      this.callbacks.onError({ error: event.error, message: errorMessage });
    }
  }

  handleEnd() {
    console.log('🛑 Recognition ended');
    
    // If we're still supposed to be listening and it wasn't a manual stop, restart
    if (this.isListening && !this.isManualStop) {
      console.log('Auto-restarting recognition...');
      
      this.restartTimeout = setTimeout(() => {
        if (this.isListening) {
          this.startRecognitionService();
        }
      }, 100);
    } else {
      this.clearAllTimers();
    }
    
    if (this.callbacks.onEnd) {
      this.callbacks.onEnd();
    }
  }

  getCurrentReadingTime() {
    if (!this.startTime) return 0;
    const endTime = this.endTime || Date.now();
    return (endTime - this.startTime) / 1000;
  }

  static isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  static async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }
}

// Initialize global speech recognition manager
const speechRecognition = new SpeechRecognitionManager();
