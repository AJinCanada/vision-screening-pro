// Speech Recognition Manager - Advanced Speech Recognition for Reading Tests
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
    this.timerInterval = null; // ADD: Store timer reference
    this.silenceTimeout = null; // ADD: Detect when user stops speaking
    
    // Initialize Speech Recognition
    this.initRecognition();
  }

  initRecognition() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported in this browser');
      return false;
    }

    this.recognition = new SpeechRecognition();
    
    // Configuration
    this.recognition.continuous = true; // Keep listening until stopped
    this.recognition.interimResults = true; // Get interim results for real-time feedback
    this.recognition.lang = 'en-US'; // Language
    this.recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy

    // Event handlers
    this.recognition.onstart = () => this.handleStart();
    this.recognition.onresult = (event) => this.handleResult(event);
    this.recognition.onerror = (event) => this.handleError(event);
    this.recognition.onend = () => this.handleEnd();
    this.recognition.onspeechstart = () => this.handleSpeechStart();
    this.recognition.onspeechend = () => this.handleSpeechEnd();

    return true;
  }

  // Start listening for a specific sentence
  startListening(sentence, callbacks = {}) {
    if (!this.recognition) {
      alert('Speech recognition not supported in your browser. Please use Chrome, Edge, or Safari.');
      return false;
    }

    // Clear any existing timers
    this.clearTimers();

    this.currentSentence = sentence;
    this.targetWords = this.extractWords(sentence);
    this.recognizedWords = [];
    this.callbacks = callbacks;
    this.startTime = Date.now();
    this.isListening = true;

    try {
      this.recognition.start();
      console.log('Speech recognition started');
      return true;
    } catch (error) {
      console.error('Failed to start recognition:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      return false;
    }
  }

  // Stop listening
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.endTime = Date.now();
      this.clearTimers(); // CRITICAL: Clear all timers
    }
  }

  // NEW: Clear all active timers
  clearTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }

  // Extract words from sentence (normalize)
  extractWords(sentence) {
    return sentence
      .toLowerCase()
      .replace(/[.,!?;:]/g, '') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 0);
  }

  // Handle recognition start
  handleStart() {
    console.log('Recognition started');
    if (this.callbacks.onStart) {
      this.callbacks.onStart();
    }
  }

  // Handle speech detection start
  handleSpeechStart() {
    console.log('Speech detected');
    
    // Clear silence timeout when speech starts
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    
    if (this.callbacks.onSpeechStart) {
      this.callbacks.onSpeechStart();
    }
  }

  // Handle speech detection end
  handleSpeechEnd() {
    console.log('Speech ended');
    
    // Set timeout to auto-stop after 2 seconds of silence
    this.silenceTimeout = setTimeout(() => {
      if (this.isListening) {
        console.log('Auto-stopping after silence');
        const progress = this.calculateProgress();
        
        // Only auto-stop if we've recognized some words
        if (progress.percentage >= 50) {
          this.stopListening();
          this.finalizeSentence();
        }
      }
    }, 2000); // 2 seconds of silence
    
    if (this.callbacks.onSpeechEnd) {
      this.callbacks.onSpeechEnd();
    }
  }

  // Handle recognition results
  handleResult(event) {
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

    // Update recognized words
    if (finalTranscript) {
      const newWords = this.extractWords(finalTranscript);
      this.recognizedWords = [...new Set([...this.recognizedWords, ...newWords])]; // Remove duplicates
      
      console.log('Final transcript:', finalTranscript);
      console.log('Recognized words:', this.recognizedWords);
    }

    // Real-time feedback with interim results
    if (this.callbacks.onInterim) {
      this.callbacks.onInterim({
        interim: interimTranscript,
        final: finalTranscript,
        recognizedWords: this.recognizedWords,
        progress: this.calculateProgress()
      });
    }

    // Check if sentence is complete
    if (this.isSentenceComplete()) {
      this.stopListening();
      this.finalizeSentence();
    }
  }

  // Calculate reading progress
  calculateProgress() {
    const totalWords = this.targetWords.length;
    const matchedWords = this.countMatchedWords();
    return {
      matched: matchedWords,
      total: totalWords,
      percentage: Math.round((matchedWords / totalWords) * 100)
    };
  }

  // Count how many target words were recognized
  countMatchedWords() {
    let matchCount = 0;
    
    for (const targetWord of this.targetWords) {
      // Check for exact match or similar match (Levenshtein distance)
      const found = this.recognizedWords.some(recognizedWord => {
        return this.isSimilar(targetWord, recognizedWord);
      });
      
      if (found) {
        matchCount++;
      }
    }
    
    return matchCount;
  }

  // Check if two words are similar (handles minor speech recognition errors)
  isSimilar(word1, word2) {
    // Exact match
    if (word1 === word2) return true;
    
    // Check if one word contains the other (e.g., "reading" vs "read")
    if (word1.includes(word2) || word2.includes(word1)) return true;
    
    // Levenshtein distance for minor spelling differences
    const distance = this.levenshteinDistance(word1, word2);
    const maxLength = Math.max(word1.length, word2.length);
    const similarity = 1 - (distance / maxLength);
    
    return similarity >= 0.75; // Reduced threshold to 75% for better matching
  }

  // Calculate Levenshtein distance (edit distance between strings)
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
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Check if sentence is complete
  isSentenceComplete() {
    const progress = this.calculateProgress();
    
    // Consider complete if 85% of words are recognized (reduced from 90% for better UX)
    // This accounts for minor speech recognition errors
    return progress.percentage >= 85;
  }

  // Finalize sentence reading
  finalizeSentence() {
    // Ensure we have end time
    if (!this.endTime) {
      this.endTime = Date.now();
    }
    
    const readingTime = (this.endTime - this.startTime) / 1000; // seconds
    const progress = this.calculateProgress();
    
    // Calculate errors (words not recognized)
    const errors = this.targetWords.length - progress.matched;
    
    // Calculate words per minute (WPM)
    const wordsPerMinute = readingTime > 0 ? Math.round((progress.matched / readingTime) * 60) : 0;
    
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

    console.log('Sentence reading complete:', result);

    if (this.callbacks.onComplete) {
      this.callbacks.onComplete(result);
    }
  }

  // Handle errors
  handleError(event) {
    console.error('Speech recognition error:', event.error);
    
    // Clear timers on error
    this.clearTimers();
    
    let errorMessage = 'Speech recognition error: ';
    
    switch (event.error) {
      case 'no-speech':
        errorMessage += 'No speech detected. Please speak clearly.';
        break;
      case 'audio-capture':
        errorMessage += 'No microphone found.';
        break;
      case 'not-allowed':
        errorMessage += 'Microphone access denied.';
        break;
      case 'network':
        errorMessage += 'Network error. Check internet connection.';
        break;
      case 'aborted':
        // Don't show error for intentional stops
        return;
      default:
        errorMessage += event.error;
    }

    if (this.callbacks.onError) {
      this.callbacks.onError({ error: event.error, message: errorMessage });
    }
  }

  // Handle recognition end
  handleEnd() {
    console.log('Recognition ended');
    this.isListening = false;
    this.clearTimers(); // CRITICAL: Clear timers when recognition ends
    
    if (this.callbacks.onEnd) {
      this.callbacks.onEnd();
    }
  }

  // Check if speech recognition is supported
  static isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  // Request microphone permission
  static async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop immediately after permission
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }
}

// Initialize global speech recognition manager
const speechRecognition = new SpeechRecognitionManager();

