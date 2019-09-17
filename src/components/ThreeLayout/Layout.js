import React, { Component } from 'react';
import * as THREE from 'three';

import './Layout.css';

//Postprocessing
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
//import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
//import { DotScreenPass } from 'three/examples/jsm/postprocessing/DotScreenPass';
import { ClearMaskPass } from 'three/examples/jsm/postprocessing/MaskPass';
import { TexturePass } from 'three/examples/jsm/postprocessing/TexturePass';

//Shaders
import { BleachBypassShader } from './Shaders/BleachBypassShader';
import { ColorifyShader } from './Shaders/ColorifyShader';
import { HorizontalBlurShader } from './Shaders/HorizontalBlurShader';
import { VerticalBlurShader } from './Shaders/VerticalBlurShader';
import { SepiaShader } from './Shaders/SepiaShader';
import { VignetteShader  } from './Shaders/VignetteShader';

let composerScene;
let composer1;

let cameraOrtho;
let cameraPerspective;
let sceneBG;
let renderer;


let width = window.innerWidth || 2;
let height = window.innerHeight || 2;

let halfWidth = width / 2;
let halfHeight = height / 2;

let quadBG;
let quadMask;
let renderScene;

let delta = 0.01;

class ThreeLayout extends Component {
  componentDidMount(){
    cameraOrtho = new THREE.OrthographicCamera(-halfWidth, halfWidth, halfHeight, -halfHeight, -10000, 10000);
    cameraOrtho.position.z = 100;

    cameraPerspective = new THREE.PerspectiveCamera(50, width / height, 1, 10000);
    cameraPerspective.position.z = 900;

    sceneBG = new THREE.Scene();

    const materialColor = new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load("Textures/871707.png"),
      depthTest: false
    });

    quadBG = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1), materialColor);
    quadBG.position.z = - 500;
    quadBG.scale.set(width, height, 1);
    sceneBG.add(quadBG);

    // const sceneMask = new THREE.Scene();
    // quadMask = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
    // quadMask.position.z = - 300;
    // quadMask.scale.set(width / 2, height / 2, 1);
    // sceneMask.add(quadMask);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.autoClear = false;

    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    this.mount.appendChild(renderer.domElement);

    const shaderBleach = BleachBypassShader;
    const shaderSepia = SepiaShader;
    const shaderVignette = VignetteShader;
    const effectBleach = new ShaderPass(shaderBleach);
    const effectSepia = new ShaderPass(shaderSepia);
    const effectVignette = new ShaderPass(shaderVignette);
    effectBleach.uniforms["opacity"].value = 0.95;
    effectSepia.uniforms["amount"].value = 0.9;
    effectVignette.uniforms["offset"].value = 0.95;
    effectVignette.uniforms["darkness"].value = 1.6;
    const effectFilm = new FilmPass(0.40, 0.026, 648, false);
    //const effectFilmBW = new FilmPass(0.35, 0.5, 2048, true);
    //const effectDotScreen = new DotScreenPass(new THREE.Vector2(0, 0), 0.5, 0.8);
    const effectHBlur = new ShaderPass(HorizontalBlurShader);
    const effectVBlur = new ShaderPass(VerticalBlurShader);
    effectHBlur.uniforms['h'].value = 2 / (width / 2);
    effectVBlur.uniforms['v'].value = 2 / (height / 2);
    const effectColorify1 = new ShaderPass(ColorifyShader);
    const effectColorify2 = new ShaderPass(ColorifyShader);
    effectColorify1.uniforms['color'] = new THREE.Uniform(new THREE.Color(1, 0.8, 0.8));
    effectColorify2.uniforms['color'] = new THREE.Uniform(new THREE.Color(1, 0.75, 0.5));
    const clearMask = new ClearMaskPass();

    const rtParameters = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBFormat,
      stencilBuffer: true
    };
    const rtWidth = width / 2;
    const rtHeight = height / 2;

    const renderBackground = new RenderPass(sceneBG, cameraOrtho);

    composerScene = new EffectComposer(renderer, new THREE.WebGLRenderTarget(rtWidth * 2, rtHeight * 2, rtParameters));
    composerScene.addPass(renderBackground);
    composerScene.addPass(effectHBlur);
    composerScene.addPass(effectVBlur);
    composerScene.addPass(clearMask);
    composerScene.addPass(effectColorify2);

    renderScene = new TexturePass(composerScene.renderTarget2.texture);

    composer1 = new EffectComposer(renderer, new THREE.WebGLRenderTarget(rtWidth, rtHeight, rtParameters));
    composer1.addPass(renderScene);
    composer1.addPass(effectFilm);

    renderScene.uniforms["tDiffuse"].value = composerScene.renderTarget2.texture;

    //Events
    window.addEventListener('resize', this.onWindowResize, false );
    window.addEventListener('mousemove', this.onMouseMove);

    this.start();

    // const width = this.mount.clientWidth;
    // const height = this.mount.clientHeight;
    // //ADD SCENE
    // this.scene = new THREE.Scene();
    // //ADD CAMERA
    // this.camera = new THREE.PerspectiveCamera(
    //   75,
    //   width / height,
    //   0.1,
    //   1000
    // );

    // this.camera.position.z = 4;
    // //ADD RENDERER
    // this.renderer = new THREE.WebGLRenderer({ antialias: true });
    // this.renderer.setClearColor('#000000');
    // this.renderer.setSize(width, height);
    // this.mount.appendChild(this.renderer.domElement);
    // //ADD CUBE
    // const geometry = new THREE.BoxGeometry(1, 1, 1);
    // const material = new THREE.MeshBasicMaterial({ color: '#433F81' });
    // this.cube = new THREE.Mesh(geometry, material);
    // this.scene.add(this.cube);
    // this.start();
  }

  onMouseMove(e) {
    //e.clientX;
    //e.ClientY;
    //Draw pointer#F5F5F5
  }

  onWindowResize() {
    halfWidth = window.innerWidth / 2;
    halfHeight = window.innerHeight / 2;
    cameraPerspective.aspect = window.innerWidth / window.innerHeight;
    cameraPerspective.updateProjectionMatrix();
    cameraOrtho.left = - halfWidth;
    cameraOrtho.right = halfWidth;
    cameraOrtho.top = halfHeight;
    cameraOrtho.bottom = - halfHeight;
    cameraOrtho.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composerScene.setSize(halfWidth * 2, halfHeight * 2);
    composer1.setSize(halfWidth, halfHeight);
    renderScene.uniforms["tDiffuse"].value = composerScene.renderTarget2.texture;
    quadBG.scale.set(window.innerWidth, window.innerHeight, 1);
    quadMask.scale.set(window.innerWidth / 2, window.innerHeight / 2, 1);
  }

  componentWillUnmount(){
    this.stop();
    this.mount.removeChild(renderer.domElement);
  }

  start = () => {
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.animate);
    }
  }

  stop = () => {
    cancelAnimationFrame(this.frameId);
  }

  animate = () => {
    this.renderScenes();
    this.updateCanvas();
    this.frameId = window.requestAnimationFrame(this.animate);
  }

  renderScenes = () => {
    renderer.setViewport(0, 0, width, height);
    composerScene.render(delta);

    renderer.setViewport(0, 0, width, height);
    composer1.render(delta);
  }

  render(){
    return(
      <div
        ref={(mount) => { this.mount = mount }}
      >
        <div className="text">Michael Laguna</div>
      </div>
    )
  }
}

export default ThreeLayout;
