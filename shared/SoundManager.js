import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { soundAssets, SOUND_VOLUMES, LETTER_SOUND_ASSETS } from './constants';

class SoundManager {
  constructor() {
    this.sounds = {};
    this.loaded = false;
    this.backgroundEnabled = true;
    this.externalSound = null;
    this.letterSounds = {};
    this.letterSoundsLoaded = false;
    this.letterSoundActive = null;
  }

  async loadSounds() {
    if (this.loaded) return;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: false,
      });
      for (const [type, source] of Object.entries(soundAssets)) {
        const { sound } = await Audio.Sound.createAsync(source, {
          shouldPlay: false,
          isLooping: type === 'background',
          volume: SOUND_VOLUMES[type] ?? 0.4,
        });
        this.sounds[type] = sound;
      }
      this.loaded = true;
      await this.ensureBackgroundPlayback();
    } catch (error) {
      console.log('Error loading sounds:', error);
    }
  }

  async ensureBackgroundPlayback() {
    const bg = this.sounds.background;
    if (!bg) return;
    try {
      const status = await bg.getStatusAsync();
      if (!status.isLoaded) return;
      if (this.backgroundEnabled) {
        await bg.setVolumeAsync(SOUND_VOLUMES.background ?? 0.12);
        if (!status.isPlaying) await bg.playAsync();
      } else if (status.isPlaying) {
        await bg.pauseAsync();
      }
    } catch (error) {
      console.log('Error ensuring background playback:', error);
    }
  }

  async setBackgroundEnabled(enabled) {
    this.backgroundEnabled = enabled;
    await this.ensureBackgroundPlayback();
  }

  isBackgroundEnabled() {
    return this.backgroundEnabled;
  }

  async play(type) {
    if (type === 'background') {
      await this.ensureBackgroundPlayback();
      return;
    }
    const sound = this.sounds[type];
    if (!sound) return;
    try {
      await sound.replayAsync();
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  }

  async playClip(source, volume = 0.42, options = {}) {
    const { waitForFinish = false, maxWaitMs = 2400 } = options;
    if (!source) return false;
    try {
      if (this.externalSound) {
        await this.externalSound.unloadAsync();
        this.externalSound = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: false, isLooping: false, volume }
      );
      this.externalSound = sound;
      let finishResolver = null;
      const finishPromise = waitForFinish
        ? new Promise((resolve) => { finishResolver = resolve; })
        : null;
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status?.isLoaded || status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (this.externalSound === sound) this.externalSound = null;
          if (finishResolver) {
            finishResolver(true);
            finishResolver = null;
          }
        }
      });
      if (finishPromise) {
        await Promise.race([
          finishPromise,
          new Promise((resolve) => setTimeout(resolve, maxWaitMs)),
        ]);
      }
      return true;
    } catch (error) {
      console.log('Error playing clip sound:', error);
      if (this.externalSound) {
        try { await this.externalSound.unloadAsync(); } catch {}
        this.externalSound = null;
      }
      return false;
    }
  }

  async stopClip() {
    if (!this.externalSound) return;
    try { await this.externalSound.stopAsync(); } catch {}
    try { await this.externalSound.unloadAsync(); } catch {}
    this.externalSound = null;
  }

  async loadLetterSounds() {
    if (this.letterSoundsLoaded) return;
    try {
      for (const [key, source] of Object.entries(LETTER_SOUND_ASSETS)) {
        const { sound } = await Audio.Sound.createAsync(source, {
          shouldPlay: false,
          isLooping: false,
          volume: 0.88,
        });
        this.letterSounds[key] = sound;
      }
      this.letterSoundsLoaded = true;
    } catch (error) {
      console.log('Error loading letter sounds:', error);
    }
  }

  async unloadLetterSounds() {
    await this.stopLetterSound();
    for (const sound of Object.values(this.letterSounds)) {
      try { await sound.unloadAsync(); } catch {}
    }
    this.letterSounds = {};
    this.letterSoundsLoaded = false;
  }

  async stopLetterSound() {
    if (!this.letterSoundActive) return;
    try { await this.letterSoundActive.stopAsync(); } catch {}
    this.letterSoundActive = null;
  }

  async playLetterSound(letter) {
    const cp = letter.codePointAt(0);
    const key = `u${cp.toString(16).padStart(4, '0')}`;
    const sound = this.letterSounds[key];
    if (!sound) return;
    try {
      if (this.letterSoundActive && this.letterSoundActive !== sound) {
        try { await this.letterSoundActive.stopAsync(); } catch {}
      }
      this.letterSoundActive = sound;
      await sound.replayAsync();
    } catch (error) {
      console.log('Error playing letter sound:', error);
    }
  }

  async unloadSounds() {
    if (this.externalSound) {
      try { await this.externalSound.unloadAsync(); } catch {}
      this.externalSound = null;
    }
    await this.unloadLetterSounds();
    for (const sound of Object.values(this.sounds)) {
      try { await sound.unloadAsync(); } catch {}
    }
    this.sounds = {};
    this.loaded = false;
  }
}

export const soundManager = new SoundManager();
