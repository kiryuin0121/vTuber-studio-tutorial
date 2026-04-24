import { create } from "zustand";

export const useVideoRecognition = create((set) => ({
  videoElement: null,
  setVideoElement: (videoElement) => set({ videoElement }),
  resultsCallback: null, //mediapipeの解析結果を受け取るためのコールバック関数
  setResultsCallback: (resultsCallback) => set({ resultsCallback }),
}));