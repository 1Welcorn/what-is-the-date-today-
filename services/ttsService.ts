
import { GoogleGenAI, Modality } from "@google/genai";

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export async function speakText(text: string): Promise<void> {
  // Use VITE_ env var for client-side access
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });

  // Use a softer, more natural voice. 'Aoede' is generally very smooth.
  // 'Fenrir' is good for deep male voice.
  const preferredVoice = 'Aoede';
  console.log(`Attempting to speak with Gemini voice: ${preferredVoice}`);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      // Adjusted prompt for a more natural, less robotic delivery
      contents: [{ parts: [{ text: `Generate audio speaking this text. Use a warm, natural, and conversational English accent. Avoid being overly formal or robotic. Text: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: preferredVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data received from Gemini");

    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(
      decodeBase64(base64Audio),
      outputAudioContext,
      24000,
      1
    );

    const source = outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputAudioContext.destination);
    source.start();
  } catch (error) {
    console.warn("Gemini TTS failed or API key missing, falling back to browser TTS.", error);

    // Improved Fallback to browser's native TTS
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';

    // Wait for voices to load if they haven't (Chrome issue)
    let voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      await new Promise<void>(resolve => {
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          resolve();
        };
        // Timeout just in case
        setTimeout(resolve, 1000);
      });
    }

    // Smart voice selection algorithm
    // 1. Look for "Natural" voices (often provided by Edge/Windows online)
    // 2. Look for "Google US English" (Chrome standard, decent)
    // 3. Look for "Premium" voices
    // 4. Fallback to any 'en-US'
    const bestVoice =
      voices.find(v => v.name.includes("Natural") && v.lang.includes("en")) ||
      voices.find(v => v.name.includes("Google US English")) ||
      voices.find(v => v.name.includes("Premium") && v.lang.includes("en")) ||
      voices.find(v => v.lang.includes("en-US")) ||
      voices.find(v => v.lang.includes("en"));

    if (bestVoice) {
      console.log(`Using fallback voice: ${bestVoice.name}`);
      utterance.voice = bestVoice;
      // Adjust settings for slightly more natural sound if possible
      utterance.rate = 0.9; // Slightly slower can be clearer
      utterance.pitch = 1.0;
    }

    window.speechSynthesis.speak(utterance);
  }
}
