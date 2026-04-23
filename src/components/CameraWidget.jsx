import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import {
  FACEMESH_TESSELATION,
  HAND_CONNECTIONS,
  Holistic,
  POSE_CONNECTIONS,
} from "@mediapipe/holistic";
import { useEffect, useRef, useState } from "react";
import { useVideoRecognition } from "../hooks/useVideoRecognition";

export const CameraWidget = () => {
  // カメラ起動フラグ
  const [start, setStart] = useState(false);

  const videoElement = useRef();
  const drawCanvas = useRef();

  // videoタグの参照登録用関数
  const setVideoElement = useVideoRecognition((state) => state.setVideoElement);

  // 骨格を描画する(点と線)
  const drawResults = (results) => {
    drawCanvas.current.width = videoElement.current.videoWidth;
    drawCanvas.current.height = videoElement.current.videoHeight;
    let canvasCtx = drawCanvas.current.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(
      0,
      0,
      drawCanvas.current.width,
      drawCanvas.current.height,
    );
    // Use `Mediapipe` drawing functions
    // 体の輪郭(水色)
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: "#00cff7",
      lineWidth: 4,
    });
    // 体の関節(ピンク)
    drawLandmarks(canvasCtx, results.poseLandmarks, {
      color: "#ff0364",
      lineWidth: 2,
    });
    // 顔の輪郭(グレー)
    drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, {
      color: "#C0C0C070",
      lineWidth: 1,
    });
    if (results.faceLandmarks && results.faceLandmarks.length === 478) {
      // 瞳(黄色)
      drawLandmarks(
        canvasCtx,
        [results.faceLandmarks[468], results.faceLandmarks[468 + 5]],
        {
          color: "#ffe603",
          lineWidth: 2,
        },
      );
    }
    // 左手(ピンク)
    drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {
      color: "#eb1064",
      lineWidth: 5,
    });
    drawLandmarks(canvasCtx, results.leftHandLandmarks, {
      color: "#00cff7",
      lineWidth: 2,
    });
    // 右手(青色)
    drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {
      color: "#22c3e3",
      lineWidth: 5,
    });
    drawLandmarks(canvasCtx, results.rightHandLandmarks, {
      color: "#ff0364",
      lineWidth: 2,
    });
  };

  // カメラの映像解析＆プレビューを描画
  useEffect(() => {
    if (!start) {
      setVideoElement(null);
      return;
    }

    // カメラがすでに動作している場合は処理を中断する(二重起動防止)
    if (useVideoRecognition.getState().videoElement) {
      return;
    }
    // videoタグへの参照をGSに登録する
    setVideoElement(videoElement.current);

    // mediapipe(holistic)インスタンスの生成
    const holistic = new Holistic({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1635989137/${file}`;
      },
    });
    // mediapipe(holistic)の検出精度の設定
    holistic.setOptions({
      modelComplexity: 1, // モデルの複雑さ（0〜2、高いほど精度↑・速度↓）
      smoothLandmarks: true, // 骨格がカクカクしないよう滑らかにする
      minDetectionConfidence: 0.7, // この確率以上でないと「検出した」とみなさない
      minTrackingConfidence: 0.7, // この確率以上でないとトラッキングを継続しない
      refineFaceLandmarks: true, // 顔のランドマークをより詳細に検出（瞳など）
    });

    // mediapipe(holistic)の解析結果を描画する処理
    holistic.onResults((results) => {
      drawResults(results);
      // 解析結果をVRMの動きに同期させる
      useVideoRecognition.getState().resultsCallback?.(results);
    });

    //カメラを起動して毎フレーム解析する
    const camera = new Camera(videoElement.current, {
      onFrame: async () => {
        await holistic.send({ image: videoElement.current });
      },
      // kalidokitのサイズとそろえる
      width: 640,
      height: 480,
    });
    camera.start();
  }, [start]);

  return (
    <>
      {/* カメラON/OFFボタン */}
      <button
        onClick={() => setStart((prev) => !prev)}
        className={`fixed bottom-4 right-4 cursor-pointer ${
          start
            ? "bg-red-500 hover:bg-red-700"
            : "bg-indigo-400 hover:bg-indigo-700"
        } transition-colors duration-200 flex items-center justify-center z-20 p-4 rounded-full text-white drop-shadow-sm`}
      >
        {!start ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 0 0-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409"
            />
          </svg>
        )}
      </button>

      {/* カメラのプレビューエリア */}
      <div
        className={`absolute z-[999999] bottom-24 right-4 w-[320px] h-[240px] rounded-[20px] overflow-hidden ${
          !start ? "hidden" : ""
        }`}
        width={640}
        height={480}
      >
        {/* 骨格を描画するCanvas */}
        <canvas
          ref={drawCanvas}
          className="absolute z-10 w-full h-full bg-black/50 top-0 left-0"
        />
        {/* カメラの映像 */}
        <video
          ref={videoElement}
          className="absolute z-0 w-full h-full top-0 left-0"
        />
      </div>
    </>
  );
};
