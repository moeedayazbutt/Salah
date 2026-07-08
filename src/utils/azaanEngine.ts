const AZAAN_URLS: Record<string, { standard: string; fajr: string }> = {
  makkah: {
    standard: 'https://www.islamcan.com/audio/adhan/azan1.mp3',
    fajr: 'https://www.islamcan.com/audio/adhan/azan15.mp3',
  },
  madinah: {
    standard: 'https://www.islamcan.com/audio/adhan/azan20.mp3',
    fajr: 'https://www.islamcan.com/audio/adhan/azan15.mp3',
  },
  cairo: {
    standard: 'https://www.islamcan.com/audio/adhan/azan16.mp3',
    fajr: 'https://www.islamcan.com/audio/adhan/azan15.mp3',
  },
  alaqsa: {
    standard: 'https://www.islamcan.com/audio/adhan/azan3.mp3',
    fajr: 'https://www.islamcan.com/audio/adhan/azan15.mp3',
  },
  istanbul: {
    standard: 'https://www.islamcan.com/audio/adhan/azan2.mp3',
    fajr: 'https://www.islamcan.com/audio/adhan/azan15.mp3',
  },
  pakistan: {
    standard: 'https://www.islamcan.com/audio/adhan/azan12.mp3',
    fajr: 'https://www.islamcan.com/audio/adhan/azan15.mp3',
  },
  uae: {
    standard: 'https://www.islamcan.com/audio/adhan/azan5.mp3',
    fajr: 'https://www.islamcan.com/audio/adhan/azan15.mp3',
  },
  indonesia: {
    standard: 'https://www.islamcan.com/audio/adhan/azan18.mp3',
    fajr: 'https://www.islamcan.com/audio/adhan/azan15.mp3',
  },
  iran: {
    standard: 'https://www.islamcan.com/audio/adhan/azan9.mp3',
    fajr: 'https://www.islamcan.com/audio/adhan/azan15.mp3',
  },
  iraq: {
    standard: 'https://www.islamcan.com/audio/adhan/azan7.mp3',
    fajr: 'https://www.islamcan.com/audio/adhan/azan15.mp3',
  },
  syria: {
    standard: 'https://www.islamcan.com/audio/adhan/azan4.mp3',
    fajr: 'https://www.islamcan.com/audio/adhan/azan15.mp3',
  },
  yemen: {
    standard: 'https://www.islamcan.com/audio/adhan/azan13.mp3',
    fajr: 'https://www.islamcan.com/audio/adhan/azan15.mp3',
  },
  morocco: {
    standard: 'https://www.islamcan.com/audio/adhan/azan11.mp3',
    fajr: 'https://www.islamcan.com/audio/adhan/azan15.mp3',
  },
  somalia: {
    standard: 'https://www.islamcan.com/audio/adhan/azan19.mp3',
    fajr: 'https://www.islamcan.com/audio/adhan/azan15.mp3',
  },
};

let currentAudio: HTMLAudioElement | null = null;
let currentOnEndCallback: (() => void) | null = null;

export const MUAZZIN_OPTIONS = [
  { value: 'makkah', label: 'Makkah - Sheikh Ali Mulla' },
  { value: 'madinah', label: 'Madinah - Sheikh Abdul Majid Shuraim' },
  { value: 'cairo', label: 'Cairo - Sheikh Mustafa Ismail' },
  { value: 'alaqsa', label: 'Al-Aqsa - Sheikh Naji al-Qazzaz' },
  { value: 'istanbul', label: 'Istanbul - Turkey Style' },
  { value: 'pakistan', label: 'Pakistan - Faisal Mosque' },
  { value: 'uae', label: 'UAE - Sheikh Zayed Mosque' },
  { value: 'indonesia', label: 'Indonesia - Nusantara Style' },
  { value: 'iran', label: 'Iran - Persian Melody' },
  { value: 'iraq', label: 'Iraq - Baghdad Maqam' },
  { value: 'syria', label: 'Syria - Umayyad Mosque' },
  { value: 'yemen', label: 'Yemen - Sana\'a Style' },
  { value: 'morocco', label: 'Morocco - Maghreb Style' },
  { value: 'somalia', label: 'Somalia - East Africa Style' },
];

export function playAzaan(
  muazzinKey: string,
  isFajr: boolean,
  onPlay: () => void,
  onEnd: () => void
) {
  stopAzaan();

  const urls = AZAAN_URLS[muazzinKey] || AZAAN_URLS.makkah;
  const audioUrl = isFajr ? urls.fajr : urls.standard;

  const audio = new Audio(audioUrl);
  currentAudio = audio;
  currentOnEndCallback = onEnd;

  audio.addEventListener('play', () => {
    onPlay();
  });

  audio.addEventListener('ended', () => {
    onEnd();
    currentAudio = null;
    currentOnEndCallback = null;
  });

  audio.addEventListener('error', (e) => {
    console.error('Adhan audio playback error:', e);
    onEnd();
    currentAudio = null;
    currentOnEndCallback = null;
  });

  audio.play().catch((err) => {
    console.error('Adhan play failed:', err);
    onEnd();
  });
}

export function stopAzaan() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (currentOnEndCallback) {
    currentOnEndCallback();
    currentOnEndCallback = null;
  }
}

export function isAudioPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}
