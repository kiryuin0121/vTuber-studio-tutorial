import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import React, { useEffect } from "react";
import { lerp } from "three/src/math/MathUtils.js";

const VRMAvatar = ({ avatar, ...props }) => {
  // 3dモデル(.vrm)を読み込む(https://github.com/pixiv/three-vrm)
  const { scene, userData } = useGLTF(
    `/models/${avatar}`,
    undefined,
    undefined,
    (loader) => {
      loader.register((parser) => {
        return new VRMLoaderPlugin(parser);
      });
    },
  );
  // 表情アニメーションを有効にする
  useEffect(() => {
    const vrm = userData.vrm; //VRM専用のAPI
    console.log(vrm);
    /* 
      expressionManager：表情制御関連はここら辺を見ればok
    */

    // calling these functions greatly improves the performance
    VRMUtils.removeUnnecessaryVertices(scene); //不要な頂点を削除する
    VRMUtils.combineSkeletons(scene); //スケルトンを統合する
    VRMUtils.combineMorphs(vrm); //モーフターゲットを整理する(似たような表情の動きをまとめるイメージ)

    // Disable frustum culling
    vrm.scene.traverse((obj) => {
      obj.frustumCulled = false; //frustumCulled:カリングを有効にするか否か(カメラに写っていない物体は描画しない)
    });
  }, [scene]);

  // LevaのGUIで表情を切り替える
  const {
    aa,
    ih,
    ee,
    oh,
    ou,
    blinkLeft,
    blinkRight,
    angry,
    sad,
    happy,
    animation,
  } = useControls("VRM", {
    aa: { value: 0, min: 0, max: 1 },
    ih: { value: 0, min: 0, max: 1 },
    ee: { value: 0, min: 0, max: 1 },
    oh: { value: 0, min: 0, max: 1 },
    ou: { value: 0, min: 0, max: 1 },
    blinkLeft: { value: 0, min: 0, max: 1 },
    blinkRight: { value: 0, min: 0, max: 1 },
    angry: { value: 0, min: 0, max: 1 },
    sad: { value: 0, min: 0, max: 1 },
    happy: { value: 0, min: 0, max: 1 },
    // animation: {
    //   options: ["None", "Idle", "Swing Dancing", "Thriller Part 2"],
    //   value: "Idle",
    // },
  });
  // 表情アニメーションを適用する
  const lerpExpression = (name, value, lerpFactor) => {
    userData.vrm.expressionManager.setValue(
      name,
      lerp(userData.vrm.expressionManager.getValue(name), value, lerpFactor),
    );
  };
  useFrame((_, delta) => {
    if (!userData.vrm) {
      return;
    }

    userData.vrm.expressionManager.setValue("angry", angry);
    userData.vrm.expressionManager.setValue("sad", sad);
    userData.vrm.expressionManager.setValue("happy", happy);

    [
      {
        name: "aa",
        value: aa,
      },
      {
        name: "ih",
        value: ih,
      },
      {
        name: "ee",
        value: ee,
      },
      {
        name: "oh",
        value: oh,
      },
      {
        name: "ou",
        value: ou,
      },
      {
        name: "blinkLeft",
        value: blinkLeft,
      },
      {
        name: "blinkRight",
        value: blinkRight,
      },
    ].forEach((item) => {
      lerpExpression(item.name, item.value, delta * 12);
    });
    userData.vrm.update(delta);
  });

  return (
    <group {...props}>
      <primitive
        object={scene}
        rotation-y={avatar !== "3636451243928341470.vrm" ? Math.PI : 0}
      />
    </group>
  );
};

export default VRMAvatar;
