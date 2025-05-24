// src/components/MuseumViewer.jsx
import { useEffect, useRef } from 'react';
import '../index.css';

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import { Capsule } from 'three/examples/jsm/Addons.js';

import FirstPersonPlayer from '../control';
import AnnotationDiv from '../annotationDiv';
import { displayUploadModal, getMeshSizeInPixels, initUploadModal, toastMessage } from '../utils';
import { getMuseumList } from '../services';
import { Museum } from '../constants';

const ModelPaths = {
  [Museum.ART_GALLERY]: 'art_gallery/RoomTest.gltf',
  [Museum.LOUVRE]: 'art_hallway/MuseumTemplate.gltf',
};

const STEPS_PER_FRAME = 5;

const MuseumViewer = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    // === THREE setup ===
    const clock = new THREE.Clock();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f0f0f0');
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ';
    camera.position.set(0, 0, 0);

    const cssRenderer = new CSS2DRenderer();
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.top = '0';

    const css3dRenderer = new CSS3DRenderer();
    css3dRenderer.domElement.style.position = 'absolute';
    css3dRenderer.domElement.style.top = '0';

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const container = containerRef.current;
    container.appendChild(cssRenderer.domElement);
    container.appendChild(css3dRenderer.domElement);
    container.appendChild(renderer.domElement);
    let clipToPlay = [];

    const loader = new GLTFLoader().setPath('/assets/');
    let fpView, mixer, model, annotationMesh = {}, animation = null;
    let currentMuseumId = Museum.ART_GALLERY;
    let menuOpen = false;
    let isDoorOpen = false;
    let doorOpenAction = null;
    let hasLoadPlayer = false;
    let hasEnteredNewScene = false;
    let doorBoundingBox = null;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    initUploadModal();

    const onWindowResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      cssRenderer.setSize(width, height);
      css3dRenderer.setSize(width, height);
    };

    window.addEventListener('resize', onWindowResize);
    onWindowResize();

    // === Menu (optional to refactor later) ===
    const openMenu = () => {
      document.getElementById('menu-container').style.display = 'flex';
      menuOpen = true;
    };
    const closeMenu = () => {
      document.getElementById('menu-container').style.display = 'none';
      menuOpen = false;
    };

    const initMenu = () => {
      const menuContainer = document.getElementById('menu-container');
      if(menuContainer){
        document.getElementById('menu-close').addEventListener('click', closeMenu);
      }

      const menuList = document.getElementById('menu-selection-list');
      menuList.innerHTML = '';

      const createMenuItem = (label, id) => {
        const item = document.createElement('div');
        item.textContent = label;
        item.classList.add('menu-item');
        item.addEventListener('click', () => setMuseumModel(id));
        if(menuList){
           menuList.appendChild(item);
        }
       
      };

      createMenuItem('Art Gallery', Museum.ART_GALLERY);
      createMenuItem('Louvre Art Museum', Museum.LOUVRE);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          menuOpen ? closeMenu() : openMenu();
        }
      });

      document.addEventListener('click', (e) => {
        if (!menuContainer.contains(e.target)) {
          closeMenu();
        }
      });
    };


    

    /**
 * Function to check if the player is near the door and trigger the scene transition.
 */
function checkPlayerPosition() {

    if (currentMuseumId == Museum.LOUVRE && doorBoundingBox && !hasEnteredNewScene && hasLoadPlayer) {
        const playerPosition = fpView.getPlayerPosition(); // Get the player's position
        const distanceToDoor = doorBoundingBox.distanceToPoint(playerPosition); // Calculate distance to the door
        // Trigger scene transition if the player is within a certain distance from the door
        if (distanceToDoor < 3 && isDoorOpen) { // Adjust the distance threshold as needed
            console.log("Player is near the door! Transitioning to the next scene...");
            hasEnteredNewScene = true;
            setMuseumModel(Museum.ART_GALLERY); // Change to the desired museum ID
        }
    }else if (currentMuseumId == Museum.ART_GALLERY && doorBoundingBox && !hasEnteredNewScene && hasLoadPlayer){
        const playerPosition = fpView.getPlayerPosition(); // Get the player's position
        const distanceToDoor = doorBoundingBox.distanceToPoint(playerPosition); // Calculate distance to the door
        if (distanceToDoor < 3 && isDoorOpen) { // Adjust the distance threshold as needed
            console.log("Player is near the door! Transitioning to the next scene...");
            hasEnteredNewScene = true;
            setMuseumModel(Museum.LOUVRE); // Change to the desired museum ID
        }
    }
}


// FUNCTION TO ALLOW PLAYER TO CLICK AND OPEN DOOR 
document.addEventListener('click', (event) => {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    pointer.x = (event.clientX / container.clientWidth) * 2 - 1;
    pointer.y = -(event.clientY / container.clientHeight) * 2 + 1;
    // const clipToPlay = ["DoorAction", "HandleAction", "Latch.001Action"];
    if (mixer !== null){
        console.info('Mixer already existed !')
    }else{
        console.warn("Mixer is no initialized !")
    }

    // Update the raycaster with the camera and pointer position
    raycaster.setFromCamera(pointer, camera);

    // Check for intersections with objects in the scene
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        let clickedObject = intersects[0].object;
        console.log('Clicked object:', clickedObject.parent.name);

        // Check if the clicked object is part of the door
        if (clickedObject.isMesh && clickedObject.parent.name === "Door001") {
            console.log('Found Door object! Trying to play animation...');
            if (animation && animation.length > 0) {
                console.log("Found animation in gltf file!");
                animation.forEach((clip) => {
                    // if (clipToPlay.includes(clip.name)) {
                        if (!isDoorOpen) {
                            doorOpenAction = mixer.clipAction(clip);
                            doorOpenAction.clampWhenFinished = true;
                            doorOpenAction.loop = THREE.LoopOnce;
                            doorOpenAction.timeScale = 1; // Play forward
                            doorOpenAction.reset().play();
                            isDoorOpen = true;
                        } else {
                            doorOpenAction = mixer.clipAction(clip);
                            doorOpenAction.clampWhenFinished = true;
                            doorOpenAction.loop = THREE.LoopOnce;
                            doorOpenAction.reset();
                            doorOpenAction.timeScale = -1; // Play backward
                            doorOpenAction.time = doorOpenAction.getClip().duration; // Start from the end
                            doorOpenAction.play();
                            isDoorOpen = false;

                            // Update the Octree and bounding box
                        // }
                    }
                });
            } else {
                console.log("Animation not found in gltf file");
            }
        }
    } else {
        console.warn("No intersects found!");
    }
});

    const clearSceneObjects = (obj) => {
      while (obj.children.length > 0) {
        clearSceneObjects(obj.children[0]);
        obj.remove(obj.children[0]);
      }
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((material) => {
          if (material) {
            Object.keys(material).forEach((prop) => {
              if (material[prop] && material[prop].isTexture) {
                material[prop].dispose();
              }
            });
            material.dispose();
          }
        });
      }
      isDoorOpen = false;
      // clipToPlay = []
    };

    const setImageToMesh = (mesh, imgUrl) => {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(imgUrl, (loadedTexture) => {
        loadedTexture.flipY = true;
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.minFilter = THREE.LinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.generateMipmaps = false;
        loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
        loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
        loadedTexture.needsUpdate = true;

        const material = new THREE.MeshBasicMaterial({
          map: loadedTexture,
          side: THREE.DoubleSide,
          transparent: false,
          toneMapped: false,
        });
        mesh.material = material;
        mesh.material.needsUpdate = true;
        renderer.render(scene, camera);
      });
    };

    const setMuseumModel = (modelId) => {
      currentMuseumId = modelId;
      loadModel();
    };

    const loadModel = ()=> {
      document.getElementById('loading-container').style.display = 'flex';
          // Dispose of the old FirstPersonPlayer and its Octree if they exist
          if (fpView) {
              hasLoadPlayer = false;
              fpView.dispose(); // Assuming you add a dispose method to FirstPersonPlayer
              fpView = null;
          }
      
          // Reset annotationMesh
          annotationMesh = {};
  
      clearSceneObjects(scene);
      const light = new THREE.AmbientLight("#ffffff", 5);
      scene.add(light);
  
      loader.load(
          ModelPaths[currentMuseumId],
          (gltf) => {
              model = gltf;
              scene.add(gltf.scene);
              gltf.scene.updateMatrixWorld(true);
              let count = 0;
  
              // Find the largest floor mesh by bounding box area
              let floorMesh = null;
              let maxArea = 0;
              let fallbackY = Infinity;
              let fallbackX = 0, fallbackZ = 0;
              let floorBoxMaxY = null;
              animation = gltf.animations;
              animation.forEach(ani =>{
                // clipToPlay.push(ani.name);
                console.log(`ANIMATION: ${ani.name}`);
              })
              mixer = new THREE.AnimationMixer(gltf.scene);
  
              gltf.scene.traverse((child) => {
                  if (child.isMesh) {
                      console.log(`CHILD: ${child.parent.name} - IS MESH: ${child.isMesh}`);
  
                      const pos = new THREE.Vector3();
                      child.getWorldPosition(pos);
                      // Fallback for lowest mesh
                      if (pos.y < fallbackY) {
                          fallbackY = pos.y;
                          fallbackX = pos.x;
                          fallbackZ = pos.z;
                      }
                      // Floor mesh detection
                      if (child.name.toLowerCase().includes("floor")) {
                          const box = new THREE.Box3().setFromObject(child);
                          const size = new THREE.Vector3();
                          box.getSize(size);
                          const area = size.x * size.z;
                          if (area > maxArea) {
                              maxArea = area;
                              floorMesh = { box, center: box.getCenter(new THREE.Vector3()) };
                              floorBoxMaxY = box.max.y;
                          }
                      }
  
                      // Update the door bounding box and Octree
                      if (child.parent.name === "Door001") {
                          doorBoundingBox = new THREE.Box3().setFromObject(child);
                          console.log("DOOR BOUNDING BOX FOR ANIMATED DOOR HAS BEEN SET UP !")
                      }
                  }
  
                  // Match Picture Frame meshes directly
                  if (child.isMesh && /^ImageMesh\d+$/.test(child.name)) {
                      console.log("Processing Image Mesh:", child.name);
  
                      // The image plane is the mesh itself
                      const imagePlane = child;
                      console.log("Found image plane:", imagePlane.name);
  
                      // Create new material for the image plane
                      const material = new THREE.MeshBasicMaterial({
                          color: 0xffffff,
                          side: THREE.DoubleSide,
                          transparent: false,
                          map: null, // Set to null initially
                          opacity: 1.0,
                          toneMapped: false,
                          depthTest: true,
                          depthWrite: true
                      });
  
                      // Apply material and ensure proper rendering
                      imagePlane.material = material;
                      imagePlane.material.needsUpdate = true;
  
                      // Log UV coordinates for debugging
                      if (imagePlane.geometry && imagePlane.geometry.attributes.uv) {
                          console.log("UV coordinates for", imagePlane.name, ":", imagePlane.geometry.attributes.uv.array);
                          imagePlane.geometry.attributes.uv.needsUpdate = true;
                      }
  
                      // Create annotation
                      const box = new THREE.Box3().setFromObject(imagePlane);
                      const center = new THREE.Vector3();
                      box.getCenter(center);
  
                      const annotationDiv = new AnnotationDiv(count, imagePlane);
                      const label = new CSS2DObject(annotationDiv.getElement());
                      label.position.set(center.x, center.y, center.z);
  
                      // Store mesh reference
                      annotationMesh[child.name] = { label, annotationDiv, mesh: imagePlane };
  
                      annotationDiv.onAnnotationClick = ({ event, id }) => {
                          const { width, height } = getMeshSizeInPixels(imagePlane, camera, renderer);
                          const aspectRatio = width / height;
                          console.log("Frame dimensions:", { width, height, aspectRatio });
                          displayUploadModal(aspectRatio, { img_id: child.name, museum: currentMuseumId });
                      };
                      scene.add(label);
                  }
              });
  
              let playerStart = { x: 0, y: 1, z: 0 };
              if (floorMesh) {
                  playerStart.x = floorMesh.center.x;
                  playerStart.y = floorBoxMaxY !== null ? floorBoxMaxY + 1 : floorMesh.center.y + 1; // Ensure player starts slightly above the floor
                  playerStart.z = floorMesh.center.z;
                  console.log(`Using floor mesh at (${playerStart.x}, ${playerStart.y}, ${playerStart.z})`);
              } else {
                  playerStart.x = fallbackX;
                  playerStart.y = fallbackY === Infinity ? 1 : fallbackY + 0.1; // Fallback to lowest mesh
                  playerStart.z = fallbackZ;
                  console.warn("No floor mesh found, using lowest mesh position as fallback.");
              }
  
              onWindowResize();
              const playerHeight = 1;
              const playerRadius = 0.35;
  
              // Place player just above the floor
              const playerStartY = playerStart.y + playerRadius + 0.01;
              const playerCollider = new Capsule(
                  new THREE.Vector3(playerStart.x, playerStartY, playerStart.z),
                  new THREE.Vector3(playerStart.x, playerStartY + playerHeight - playerRadius, playerStart.z),
                  playerRadius
              );
  
              if (currentMuseumId === Museum.ART_GALLERY) {
                  fpView = new FirstPersonPlayer(camera, scene, document, playerCollider);
                  fpView.updatePlayer(0.01, 0, 1.8, 0);
              } else {
                  const playerCollider = new Capsule(
                      new THREE.Vector3(0, 0.1, 0),
                      new THREE.Vector3(0, 1, 0), 0.1
                  );
                  camera.position.set(0, 10, 0);
                  fpView = new FirstPersonPlayer(camera, scene, document, playerCollider);
                  fpView.updatePlayer(0.01, 0, 1.6, 0);
              }
              hasLoadPlayer = true;
  
              console.log("Loading Octree from scene:", gltf.scene);
              fpView.loadOctaTree(gltf.scene); // Ensure the octree includes the floor mesh
  
              document.getElementById('loading-container').style.display = 'none';
  
              getMuseumList(currentMuseumId).then(data => {
                  console.log("museum data: ", data);
                  data.data.forEach(data => {
                      const { img_id, title, description, img_cid, price, name } = data;
  
                      if (!(img_id in annotationMesh)) {
                          return;
                      }
  
                      annotationMesh[img_id].annotationDiv.setAnnotationDetails(title, description, name);
  
                      setImageToMesh(annotationMesh[img_id].mesh, `https://gateway.pinata.cloud/ipfs/${img_cid}`);
                  });
              });
  
              // Reset the scene transition flag
              hasEnteredNewScene = false;
          },
          (xhr) => {
              const progress = xhr.total > 0 ? (xhr.loaded / xhr.total) * 100 : (xhr.loaded / 60000);
              document.getElementById('progress').style.width = progress + '%';
          },
          (error) => {
              console.error('An error occurred while loading the model:', error);
              toastMessage("An error occurred loading the model. Please check the console for details.");
              document.getElementById('loading-container').style.display = 'none';
          }
      );
  }
  

    const animate = () => {
      const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;

      for (let i = 0; i < STEPS_PER_FRAME; i++) {
          fpView?.update(deltaTime)
      }
      if (mixer){
          if (isDoorOpen){
              mixer.update(deltaTime*4)
          }else{
              mixer.update(deltaTime*4);
          }
          
      }

      checkPlayerPosition(); // Check if the player is near the door

      cssRenderer.render(scene, camera);
      css3dRenderer.render(scene, camera);
      renderer.render(scene, camera);

      requestAnimationFrame(animate)
    };

    initMenu();
    loadModel();
    animate();

    return () => {
      window.removeEventListener('resize', onWindowResize);
      renderer.dispose();
      cssRenderer.dispose?.();
      css3dRenderer.dispose?.();
      container.innerHTML = '';
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default MuseumViewer;
