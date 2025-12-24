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
    this.timerInterval = null;
    this.silenceTimeout = null;
    this.autoStopEnabled = true;
    this.lastResultTime = null;
    
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
    
    // Configuration - OPTIMIZED
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 5; // Increased for better accuracy

    // Event handlers
    this.recognition.onstart = () => this.handleStart();
    this.recognition.onresult = (event) => this.handleResult(event);
    this.recognition.onerror = (event) => this.handleError(event);
    this.recognition.onend = () => this.handleEnd();
    this.recognition.onspeechstart = () => this.handleSpeechStart();
    this.recognition.onspeechend = () => this.handleSpeechEnd();
    this.recognition.onaudiostart = () => this.handleAudioStart();
    this.recognition.onaudioend = () => this.handleAudioEnd();

    return true;
  }

  // Start listening for a specific sentence
  startListening(sentence, callbacks = {}) {
    if (!this.recognition) {
      alert('Speech recognition not supported in your browser. Please use Chrome, Edge, or Safari.');
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
    this.autoStopEnabled = true;
    this.lastResultTime = Date.now();

    // Clear any existing silence timeout
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    try {
      this.recognition.start();
      console.log('✓ Speech recognition started');
      console.log('Target words:', this.targetWords);
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
    console.log('⏹ Stopping speech recognition...');
    
    if (this.recognition && this.isListening) {
      this.autoStopEnabled = false; // Prevent auto-stop during manual stop
      this.isListening = false;
      
      // CRITICAL: Capture end time BEFORE stopping recognition
      if (!this.endTime) {
        this.endTime = Date.now();
      }
      
      // Clear silence timeout
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
        this.silenceTimeout = null;
      }
      
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
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
    console.log('🎤 Recognition started - microphone active');
    if (this.callbacks.onStart) {
      this.callbacks.onStart();
    }
  }

  handleAudioStart() {
    console.log('🔊 Audio capture started');
  }

  handleAudioEnd() {
    console.log('🔇 Audio capture ended');
  }

  // Handle speech detection start
  handleSpeechStart() {
    console.log('🗣 Speech detected - user is speaking');
    
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
    console.log('⏸ Speech ended - checking for completion');
    
    // Don't set timeout if manually stopped
    if (!this.autoStopEnabled) {
      return;
    }
    
    // Set timeout to check if sentence is complete after 1.5 seconds of silence
    this.silenceTimeout = setTimeout(() => {
      if (this.isListening && this.autoStopEnabled) {
        console.log('⏱ Checking if sentence complete after silence...');
        
        const progress = this.calculateProgress();
        console.log(`Progress: ${progress.percentage}% (${progress.matched}/${progress.total} words)`);
        
        // Auto-stop if we've recognized enough words (80% threshold)
        if (progress.percentage >= 80) {
          console.log('✓ Auto-stopping - sentence complete!');
          this.stopListening();
          this.finalizeSentence();
        } else if (progress.matched > 0) {
          // Some words recognized but not enough - give more time
          console.log('⏳ Partial progress - continuing to listen...');
        }
      }
    }, 1500); // 1.5 seconds of silence
    
    if (this.callbacks.onSpeechEnd) {
      this.callbacks.onSpeechEnd();
    }
  }

  // Handle recognition results
  handleResult(event) {
    this.lastResultTime = Date.now();
    
    let interimTranscript = '';
    let finalTranscript = '';
    let hasNewFinal = false;

    // Process all results
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      const confidence = event.results[i][0].confidence;
      
      console.log(`Result ${i}: "${transcript}" (${event.results[i].isFinal ? 'FINAL' : 'interim'}, confidence: ${confidence})`);
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
        hasNewFinal = true;
      } else {
        interimTranscript += transcript;
      }
    }

    // Update recognized words from final results
    if (hasNewFinal && finalTranscript.trim()) {
      const newWords = this.extractWords(finalTranscript);
      
      // Add new words (avoid duplicates)
      newWords.forEach(word => {
        if (!this.recognizedWords.includes(word)) {
          this.recognizedWords.push(word);
        }
      });
      
      console.log('📝 Final transcript:', finalTranscript.trim());
      console.log('✓ Recognized words:', this.recognizedWords);
    }

    // Real-time feedback with interim results
    if (this.callbacks.onInterim) {
      const progress = this.calculateProgress();
      
      this.callbacks.onInterim({
        interim: interimTranscript,
        final: finalTranscript,
        recognizedWords: this.recognizedWords,
        progress: progress
      });
      
      console.log(`📊 Progress: ${progress.percentage}% (${progress.matched}/${progress.total} words)`);
    }

    // Check if sentence is complete (only after final results)
    if (hasNewFinal && this.autoStopEnabled && this.isSentenceComplete()) {
      console.log('✅ Sentence complete! Auto-stopping...');
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
      percentage: totalWords > 0 ? Math.round((matchedWords / totalWords) * 100) : 0
    };
  }

  // Count how many target words were recognized
  countMatchedWords() {
    let matchCount = 0;
    const matchedTargets = [];
    
    for (const targetWord of this.targetWords) {
      const found = this.recognizedWords.some(recognizedWord => {
        return this.isSimilar(targetWord, recognizedWord);
      });
      
      if (found) {
        matchCount++;
        matchedTargets.push(targetWord);
      }
    }
    
    console.log('Matched words:', matchedTargets);
    return matchCount;
  }

  // Check if two words are similar (handles minor speech recognition errors)
  isSimilar(word1, word2) {
    // Exact match
    if (word1 === word2) return true;
    
    // Check if one contains the other
    if (word1.includes(word2) || word2.includes(word1)) return true;
    
    // Levenshtein distance for typos
    const distance = this.levenshteinDistance(word1, word2);
    const maxLength = Math.max(word1.length, word2.length);
    const similarity = 1 - (distance / maxLength);
    
    // 70% similarity threshold
    return similarity >= 0.7;
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
    // 80% threshold for auto-stop
    return progress.percentage >= 80;
  }

  // Finalize sentence reading
  finalizeSentence() {
    // CRITICAL: Ensure we have end time
    if (!this.endTime) {
      this.endTime = Date.now();
      console.log('⚠️ End time not set, using current time');
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

    console.log('📋 Final result:', result);

    if (this.callbacks.onComplete) {
      this.callbacks.onComplete(result);
    }
  }

  // Handle errors
  handleError(event) {
    console.error('❌ Speech recognition error:', event.error);
    
    // Clear timeout
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    
    let errorMessage = 'Speech recognition error: ';
    
    switch (event.error) {
      case 'no-speech':
        errorMessage += 'No speech detected. Please speak louder and clearer.';
        break;
      case 'audio-capture':
        errorMessage += 'No microphone found. Please check your microphone.';
        break;
      case 'not-allowed':
        errorMessage += 'Microphone access denied. Please allow microphone access in browser settings.';
        break;
      case 'network':
        errorMessage += 'Network error. Please check your internet connection.';
        break;
      case 'aborted':
        // Don't show error for intentional stops
        console.log('Recognition aborted (normal stop)');
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
    console.log('🛑 Recognition ended');
    this.isListening = false;
    
    // Clear timeout
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    
    if (this.callbacks.onEnd) {
      this.callbacks.onEnd();
    }
  }

  // Get current reading time (for display while reading)
  getCurrentReadingTime() {
    if (!this.startTime) return 0;
    const endTime = this.endTime || Date.now();
    return (endTime - this.startTime) / 1000;
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

