// src/renderer/audio-player.js wraps Howler so a book can play across one or many audio sections.
const { Howl } = window;

/** Shared numeric clamp used to keep renderer-side playback state in a safe range. */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** Maps local file extensions to the format names Howler expects for HTML5 playback. */
function inferHowlerFormat(src) {
  try {
    const url = new URL(src);
    const extension = url.pathname.split(".").pop()?.toLowerCase();
    if (extension === "m4b") {
      return "mp4";
    }

    return extension || "mp3";
  } catch {
    return "mp3";
  }
}

/**
 * Coordinates audiobook playback across one or many underlying audio files.
 *
 * The renderer treats a book as one continuous timeline, so this class translates global seeks and
 * chapter jumps into the correct file section and local offset.
 */
export class AudiobookPlayer {
  /**
   * @param {object} [options={}] - Playback callbacks used by the renderer.
   * @param {(snapshot: object) => void} [options.onUpdate] - Called whenever the public playback snapshot changes.
   * @param {(message: string) => void} [options.onError] - Called when loading or playback fails.
   * @param {(snapshot: object) => void} [options.onEnd] - Called when the final section finishes.
   */
  constructor({ onUpdate, onError, onEnd } = {}) {
    this.onUpdate = onUpdate;
    this.onError = onError;
    this.onEnd = onEnd;
    this.book = null;
    this.howl = null;
    this.currentSectionIndex = 0;
    this.pendingGlobalSeek = 0;
    this.pendingAutoplay = false;
    this.isPlaying = false;
    this.rate = 1;
    this.volume = 1;
    this.lastKnownGlobalTime = 0;
    this.tickHandle = 0;
    this.audioContext = null;
    this.analyserNode = null;
    this.mediaElementSource = null;
    this.currentMediaElement = null;
    this.frequencyData = null;
    this.timeDomainData = null;
    this.reactiveLevel = 0;
    this.reactivePulse = 0;
    this.reactiveBass = 0;
    this.reactivePresence = 0;
    this.reactiveAir = 0;
    this.previousReactiveEnergy = 0;
  }

  /**
   * Loads a new book and primes playback state without starting automatically.
   *
   * @param {object} book - Normalized audiobook record with sections and chapters.
   * @param {object} [playbackState={}] - Persisted resume state.
   */
  load(book, playbackState = {}) {
    this.disposeHowl();
    this.book = book;
    this.currentSectionIndex = this.findSectionIndex(playbackState.position || 0);
    this.pendingGlobalSeek = clamp(playbackState.position || 0, 0, this.getDuration());
    this.lastKnownGlobalTime = this.pendingGlobalSeek;
    this.pendingAutoplay = false;
    this.rate = Number.isFinite(playbackState.speed) ? clamp(playbackState.speed, 0.75, 2) : 1;
    this.emitUpdate();
    this.loadSection(this.currentSectionIndex, {
      seekTime: this.pendingGlobalSeek,
      autoplay: false
    });
  }

  /** Toggles between play and pause for the currently loaded book. */
  toggle() {
    if (!this.book) {
      return;
    }

    if (this.isPlaying) {
      this.pause();
      return;
    }

    this.play();
  }

  /** Starts or resumes playback from the current pending seek position. */
  play() {
    if (!this.book) {
      return;
    }

    this.pendingAutoplay = true;
    this.tryResumeAudioContext();

    if (!this.howl) {
      this.loadSection(this.findSectionIndex(this.pendingGlobalSeek), {
        seekTime: this.pendingGlobalSeek,
        autoplay: true
      });
      return;
    }

    this.applyPendingSeek(true);
    this.howl.play();
  }

  /** Pauses playback and captures the current global timeline position for resume behavior. */
  pause() {
    this.pendingAutoplay = false;
    this.pendingGlobalSeek = this.getCurrentTime();
    this.lastKnownGlobalTime = this.pendingGlobalSeek;
    if (this.howl) {
      this.howl.pause();
    }

    this.isPlaying = false;
    this.stopTicker();
    this.emitUpdate();
  }

  /**
   * Seeks to an absolute position on the book timeline.
   *
   * @param {number} globalTime - Absolute playback time in seconds.
   * @param {{ autoplay?: boolean }} [options] - Whether seeking should leave playback running.
   */
  seek(globalTime, { autoplay = this.isPlaying } = {}) {
    if (!this.book) {
      return;
    }

    const duration = this.getDuration();
    const nextTime = clamp(globalTime, 0, duration);
    const nextSectionIndex = this.findSectionIndex(nextTime);
    const currentSection = this.book.sections[this.currentSectionIndex];

    this.pendingGlobalSeek = nextTime;
    this.lastKnownGlobalTime = nextTime;
    this.pendingAutoplay = autoplay;

    const canSeekInPlace =
      this.howl &&
      currentSection &&
      nextSectionIndex === this.currentSectionIndex &&
      this.howl.state() === "loaded";

    if (canSeekInPlace) {
      this.howl.seek(Math.max(0, nextTime - currentSection.start));
      if (autoplay && !this.howl.playing()) {
        this.howl.play();
      } else if (!autoplay && this.howl.playing()) {
        this.howl.pause();
      }
      this.emitUpdate();
      return;
    }

    this.loadSection(nextSectionIndex, {
      seekTime: nextTime,
      autoplay
    });
  }

  /** Applies a relative seek using the same absolute timeline model as the rest of the player. */
  skip(deltaSeconds) {
    this.seek(this.getCurrentTime() + deltaSeconds, {
      autoplay: this.isPlaying
    });
  }

  /** Updates playback speed for the active and future Howler instances. */
  setRate(rate) {
    this.rate = clamp(rate, 0.75, 2);
    if (this.howl) {
      this.howl.rate(this.rate);
    }
    this.emitUpdate();
  }

  /** Updates volume for the active and future Howler instances. */
  setVolume(volume) {
    this.volume = clamp(volume, 0, 1);
    if (this.howl) {
      this.howl.volume(this.volume);
    }
    this.emitUpdate();
  }

  /** Returns the total duration of the loaded audiobook. */
  getDuration() {
    return Number.isFinite(this.book?.duration) ? this.book.duration : 0;
  }

  /** Returns the current absolute position on the book timeline. */
  getCurrentTime() {
    if (!this.book) {
      return 0;
    }

    const activeSection = this.book.sections[this.currentSectionIndex];
    if (!activeSection) {
      return this.pendingGlobalSeek || this.lastKnownGlobalTime || 0;
    }

    if (!this.isPlaying && Number.isFinite(this.pendingGlobalSeek)) {
      return clamp(this.pendingGlobalSeek, 0, this.getDuration());
    }

    if (this.howl && this.howl.state() === "loaded") {
      const localTime = Number(this.howl.seek());
      const currentTime = clamp(activeSection.start + localTime, 0, this.getDuration());

      if (Number.isFinite(localTime)) {
        this.lastKnownGlobalTime = currentTime;
        if (this.isPlaying) {
          this.pendingGlobalSeek = currentTime;
        }
        return currentTime;
      }
    }

    return clamp(
      this.pendingGlobalSeek || this.lastKnownGlobalTime || activeSection.start || 0,
      0,
      this.getDuration()
    );
  }

  /**
   * Produces the renderer-facing playback snapshot.
   *
   * @returns {object} Current playback state used to render controls, progress, and chapter highlights.
   */
  getSnapshot() {
    const currentTime = this.getCurrentTime();
    return {
      bookId: this.book?.id || "",
      currentTime,
      duration: this.getDuration(),
      isPlaying: this.isPlaying,
      rate: this.rate,
      volume: this.volume,
      reactiveLevel: this.getReactiveLevel(),
      currentSectionIndex: this.currentSectionIndex,
      currentChapterIndex: this.findChapterIndex(currentTime),
      isReady: Boolean(this.howl && this.howl.state() === "loaded")
    };
  }

  /** Tears down the current Howler instance and clears the loaded book. */
  destroy() {
    this.stopTicker();
    this.disposeHowl();
    this.disconnectAnalyser();
    this.closeAudioContext();
    this.book = null;
  }

  /** Emits the latest public snapshot to the renderer callback, if one was provided. */
  emitUpdate() {
    this.updateReactiveLevel();
    this.onUpdate?.(this.getSnapshot());
  }

  /** Returns a smoothed audio energy value suitable for subtle UI reactivity. */
  getReactiveLevel() {
    this.updateReactiveLevel();
    return this.reactiveLevel;
  }

  /** Returns richer analyser-derived motion metrics for immersive player visuals. */
  getReactiveMetrics() {
    this.updateReactiveLevel();
    return {
      level: this.reactiveLevel,
      pulse: this.reactivePulse,
      bass: this.reactiveBass,
      presence: this.reactivePresence,
      air: this.reactiveAir
    };
  }

  /** Converts a global timeline position into a local offset within one audio section. */
  getSectionLocalSeek(globalTime = this.pendingGlobalSeek, sectionIndex = this.currentSectionIndex) {
    const section = this.book?.sections?.[sectionIndex];
    if (!section) {
      return 0;
    }

    const sectionDuration = Number.isFinite(section.duration)
      ? section.duration
      : Math.max(0, (section.end || 0) - (section.start || 0));
    return clamp(Math.max(0, globalTime - section.start), 0, sectionDuration || Number.MAX_SAFE_INTEGER);
  }

  /** Applies any pending seek to the live Howler instance once it is safe to do so. */
  applyPendingSeek(force = false) {
    if (!this.howl || this.howl.state() !== "loaded") {
      return;
    }

    const desiredSeek = this.getSectionLocalSeek();
    const currentSeek = Number(this.howl.seek());
    if (!force && Number.isFinite(currentSeek) && Math.abs(currentSeek - desiredSeek) < 0.35) {
      return;
    }

    this.howl.seek(desiredSeek);
  }

  /**
   * Loads the requested section and aligns it with the global timeline state.
   *
   * @param {number} sectionIndex - Section index to load.
   * @param {{ seekTime?: number, autoplay?: boolean }} [options] - Initial seek target and autoplay behavior.
   */
  loadSection(sectionIndex, { seekTime = 0, autoplay = false } = {}) {
    if (!this.book?.sections?.length) {
      return;
    }

    const normalizedIndex = clamp(sectionIndex, 0, this.book.sections.length - 1);
    const section = this.book.sections[normalizedIndex];
    const nextHowl = new Howl({
      src: [section.src],
      format: [inferHowlerFormat(section.src)],
      html5: true,
      preload: true,
      rate: this.rate,
      volume: this.volume,
      onload: () => {
        if (this.howl !== nextHowl) {
          return;
        }

        this.attachAnalyserToHowl(nextHowl);
        nextHowl.rate(this.rate);
        nextHowl.volume(this.volume);
        this.pendingGlobalSeek = seekTime;
        this.lastKnownGlobalTime = seekTime;
        this.applyPendingSeek(true);

        if (this.pendingAutoplay) {
          nextHowl.play();
        } else {
          this.emitUpdate();
        }
      },
      onplay: () => {
        if (this.howl !== nextHowl) {
          return;
        }

        this.tryResumeAudioContext();
        this.applyPendingSeek(true);
        this.isPlaying = true;
        this.startTicker();
        this.emitUpdate();
      },
      onpause: () => {
        if (this.howl !== nextHowl) {
          return;
        }

        this.isPlaying = false;
        this.stopTicker();
        this.emitUpdate();
      },
      onstop: () => {
        if (this.howl !== nextHowl) {
          return;
        }

        this.isPlaying = false;
        this.stopTicker();
        this.emitUpdate();
      },
      onend: () => {
        if (this.howl !== nextHowl) {
          return;
        }

        this.handleSectionEnd();
      },
      onloaderror: (_soundId, message) => {
        if (this.howl !== nextHowl) {
          return;
        }

        this.isPlaying = false;
        this.stopTicker();
        this.onError?.(`Unable to load this audiobook file. ${message}`);
        this.emitUpdate();
      },
      onplayerror: (_soundId, message) => {
        if (this.howl !== nextHowl) {
          return;
        }

        this.onError?.(`Playback failed. ${message}`);
      }
    });

    this.disposeHowl();
    this.howl = nextHowl;
    this.currentSectionIndex = normalizedIndex;
    this.pendingGlobalSeek = seekTime;
    this.lastKnownGlobalTime = seekTime;
    this.pendingAutoplay = autoplay;
    this.emitUpdate();
  }

  /** Advances into the next section, or finalizes playback when the book is finished. */
  handleSectionEnd() {
    if (!this.book) {
      return;
    }

    const hasNextSection = this.currentSectionIndex + 1 < this.book.sections.length;
    if (hasNextSection) {
      const nextSection = this.book.sections[this.currentSectionIndex + 1];
      this.loadSection(this.currentSectionIndex + 1, {
        seekTime: nextSection.start,
        autoplay: true
      });
      return;
    }

    this.isPlaying = false;
    this.pendingAutoplay = false;
    this.pendingGlobalSeek = this.getDuration();
    this.lastKnownGlobalTime = this.pendingGlobalSeek;
    this.stopTicker();
    this.emitUpdate();
    this.onEnd?.(this.getSnapshot());
  }

  /** Finds which section owns a given absolute book position. */
  findSectionIndex(globalTime) {
    if (!this.book?.sections?.length) {
      return 0;
    }

    const clampedTime = clamp(globalTime, 0, this.getDuration());
    const index = this.book.sections.findIndex((section, sectionIndex) => {
      const isLast = sectionIndex === this.book.sections.length - 1;
      return clampedTime >= section.start && (clampedTime < section.end || isLast);
    });

    return index >= 0 ? index : 0;
  }

  /** Finds which chapter owns a given absolute book position. */
  findChapterIndex(globalTime) {
    if (!Array.isArray(this.book?.chapters) || this.book.chapters.length === 0) {
      return -1;
    }

    const clampedTime = clamp(globalTime, 0, this.getDuration());
    return this.book.chapters.findIndex((chapter, chapterIndex) => {
      const isLast = chapterIndex === this.book.chapters.length - 1;
      return clampedTime >= chapter.start && (clampedTime < chapter.end || isLast);
    });
  }

  /** Starts the lightweight polling loop that keeps the renderer progress UI fresh during playback. */
  startTicker() {
    if (this.tickHandle) {
      return;
    }

    this.tickHandle = window.setInterval(() => {
      this.emitUpdate();
    }, 250);
  }

  /** Stops the progress polling loop. */
  stopTicker() {
    if (!this.tickHandle) {
      return;
    }

    window.clearInterval(this.tickHandle);
    this.tickHandle = 0;
  }

  /** Disposes the active Howler instance while tolerating teardown races during section changes. */
  disposeHowl() {
    if (!this.howl) {
      return;
    }

    try {
      this.howl.unload();
    } catch {
      // Howler can throw if unload races with another state change; ignore and continue replacing it.
    }

    this.howl = null;
  }

  /** Lazily creates the shared analyser graph used by the fullscreen visuals. */
  ensureAudioContext() {
    if (this.audioContext || !window.AudioContext) {
      return this.audioContext;
    }

    try {
      this.audioContext = new window.AudioContext();
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 512;
      this.analyserNode.smoothingTimeConstant = 0.72;
      this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
      this.timeDomainData = new Uint8Array(this.analyserNode.fftSize);
    } catch {
      this.audioContext = null;
      this.analyserNode = null;
      this.frequencyData = null;
      this.timeDomainData = null;
    }

    return this.audioContext;
  }

  /** Attempts to resume the browser audio graph once the user has interacted with playback controls. */
  tryResumeAudioContext() {
    const audioContext = this.ensureAudioContext();
    if (!audioContext || audioContext.state !== "suspended") {
      return;
    }

    void audioContext.resume().catch(() => {});
  }

  /** Reads the live HTML media element created by Howler's html5 mode. */
  getMediaElementFromHowl(howl = this.howl) {
    const sound = howl?._sounds?.[0];
    return sound?._node || null;
  }

  /** Connects the active Howler media element into a shared analyser graph. */
  attachAnalyserToHowl(howl = this.howl) {
    const audioContext = this.ensureAudioContext();
    const mediaElement = this.getMediaElementFromHowl(howl);
    if (!audioContext || !this.analyserNode || !mediaElement || this.currentMediaElement === mediaElement) {
      return;
    }

    this.disconnectAnalyser();

    try {
      this.mediaElementSource = audioContext.createMediaElementSource(mediaElement);
      this.mediaElementSource.connect(this.analyserNode);
      this.analyserNode.connect(audioContext.destination);
      this.currentMediaElement = mediaElement;
    } catch {
      this.mediaElementSource = null;
      this.currentMediaElement = null;
    }
  }

  /** Disconnects the current analyser graph so section changes do not leak nodes. */
  disconnectAnalyser() {
    if (this.mediaElementSource) {
      try {
        this.mediaElementSource.disconnect();
      } catch {
        // Disconnect can race with unload on section changes; ignore and continue.
      }
    }

    if (this.analyserNode) {
      try {
        this.analyserNode.disconnect();
      } catch {
        // The analyser may already be detached during teardown.
      }
    }

    this.mediaElementSource = null;
    this.currentMediaElement = null;
  }

  /** Closes the optional AudioContext created for fullscreen visualization support. */
  closeAudioContext() {
    if (!this.audioContext) {
      return;
    }

    try {
      void this.audioContext.close();
    } catch {
      // Browsers may reject close during shutdown; the renderer is already tearing down.
    }

    this.audioContext = null;
    this.analyserNode = null;
    this.frequencyData = null;
    this.timeDomainData = null;
    this.reactiveLevel = 0;
    this.reactivePulse = 0;
    this.reactiveBass = 0;
    this.reactivePresence = 0;
    this.reactiveAir = 0;
    this.previousReactiveEnergy = 0;
  }

  /** Samples the analyser and smooths it down into one calm energy value for the fullscreen background. */
  updateReactiveLevel() {
    if (!this.analyserNode || !this.frequencyData || !this.timeDomainData || !this.currentMediaElement) {
      this.reactiveLevel *= 0.93;
      this.reactivePulse *= 0.86;
      this.reactiveBass *= 0.91;
      this.reactivePresence *= 0.91;
      this.reactiveAir *= 0.91;
      return this.reactiveLevel;
    }

    try {
      this.analyserNode.getByteFrequencyData(this.frequencyData);
      this.analyserNode.getByteTimeDomainData(this.timeDomainData);

      let lowTotal = 0;
      let midTotal = 0;
      let highTotal = 0;
      let lowCount = 0;
      let midCount = 0;
      let highCount = 0;
      const nyquist = this.audioContext?.sampleRate
        ? this.audioContext.sampleRate / 2
        : 22050;
      const binWidth = this.frequencyData.length > 0 ? nyquist / this.frequencyData.length : 0;

      for (let index = 0; index < this.frequencyData.length; index += 1) {
        const value = this.frequencyData[index];
        const frequency = binWidth * index;

        if (frequency < 220) {
          lowTotal += value;
          lowCount += 1;
        } else if (frequency < 2200) {
          midTotal += value;
          midCount += 1;
        } else {
          highTotal += value;
          highCount += 1;
        }
      }

      let waveformDeltaTotal = 0;
      let waveformPeak = 0;
      for (const sample of this.timeDomainData) {
        const centered = Math.abs(sample - 128) / 128;
        waveformDeltaTotal += centered;
        waveformPeak = Math.max(waveformPeak, centered);
      }

      const low = clamp((lowCount ? lowTotal / lowCount : 0) / 255, 0, 1);
      const mid = clamp((midCount ? midTotal / midCount : 0) / 255, 0, 1);
      const high = clamp((highCount ? highTotal / highCount : 0) / 255, 0, 1);
      const waveformAverage = clamp(
        this.timeDomainData.length > 0 ? waveformDeltaTotal / this.timeDomainData.length : 0,
        0,
        1
      );

      const weightedEnergy = clamp(
        low * 0.3 + mid * 0.44 + high * 0.18 + waveformAverage * 0.46 + waveformPeak * 0.22,
        0,
        1
      );
      const transient = clamp(weightedEnergy - this.previousReactiveEnergy, 0, 1);
      this.previousReactiveEnergy += (weightedEnergy - this.previousReactiveEnergy) * 0.18;

      this.reactiveBass += (low - this.reactiveBass) * 0.18;
      this.reactivePresence += (mid - this.reactivePresence) * 0.16;
      this.reactiveAir += (high - this.reactiveAir) * 0.14;
      this.reactivePulse = Math.max(
        transient * 1.45 + waveformPeak * 0.1,
        this.reactivePulse * 0.9
      );
      const targetLevel = clamp(
        weightedEnergy * 0.72 + this.reactivePulse * 0.16 + this.reactivePresence * 0.12,
        0,
        1
      );
      this.reactiveLevel += (targetLevel - this.reactiveLevel) * 0.16;
    } catch {
      this.reactiveLevel *= 0.94;
      this.reactivePulse *= 0.88;
      this.reactiveBass *= 0.92;
      this.reactivePresence *= 0.92;
      this.reactiveAir *= 0.92;
    }

    return this.reactiveLevel;
  }
}
