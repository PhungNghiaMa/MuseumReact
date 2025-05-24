import Cropper from "cropperjs";
import { uploadItem } from "../src/services";
import * as THREE from "three";

let cropper;
let file = null;
let cropAspectRatio = 1 / 1;

let uploadProperties = {
  museum: 0,
  img_id: null,
};

export function toastMessage(message) {
    const toastAlert = document.getElementById("toast-alert"); // Get element every time
  
    if (!toastAlert) return; // Failsafe — if element doesn't exist, do nothing
  
    toastAlert.style.display = "flex";
    toastAlert.textContent = message;
  
    setTimeout(() => {
      toastAlert.style.display = "none";
    }, 3000);
  }
  

export function closeUploadModal() {
  const uploadModal = document.getElementById("upload-modal");
  const uploadPreview = document.getElementById("upload-preview");
  const uploadText = document.getElementById("upload-text");
  const uploadInput = document.getElementById("upload-input");
  const uploadTitle = document.getElementById("upload-title");
  const uploadDescription = document.getElementById("upload-description");
  const uploadHandle = document.getElementById("upload-handle");

  uploadModal.style.display = "none";
  uploadPreview.src = "";
  uploadPreview.style.display = "none";
  uploadText.style.display = "block";
  uploadInput.value = null;

  uploadTitle.value = "";
  uploadDescription.value = "";
  uploadHandle.value = "";
}

export function displayUploadModal(cropAspect = 1 / 1, uploadProps) {
  const uploadModal = document.getElementById("upload-modal");
  uploadModal.style.display = "block";
  cropAspectRatio = cropAspect;
  uploadProperties = uploadProps;
}

export function initUploadModal() {
  // Move all these inside here
  const uploadModal = document.getElementById("upload-modal");
  const uploadContainer = document.getElementById("upload-container");
  const uploadInput = document.getElementById("upload-input");
  const uploadText = document.getElementById("upload-text");
  const uploadPreview = document.getElementById("upload-preview");

  const uploadTitle = document.getElementById("upload-title");
  const uploadDescription = document.getElementById("upload-description");
  const uploadHandle = document.getElementById("upload-handle");

  const uploadSpinner = document.getElementById("upload-spinner");
  const uploadSubmit = document.getElementById("upload-btn");

  const cropperContainer = document.getElementById("upload-cropper-container");
  const cropPreview = document.getElementById("crop-preview");
  const cropBtn = document.getElementById("crop-btn");
  const closeBtn = document.getElementById("upload-close");

  const toastAlert = document.getElementById("toast-alert");
  toastAlert.style.display = "none";


  console.log("init upload modal");

  const openInput = () => {
    uploadInput.click();
  };

  const handleFile = (file) => {
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      const reader = new FileReader();
      reader.onload = function (e) {
        cropPreview.src = e.target.result;

        if (cropper) {
          cropper.destroy();
        }

        cropperContainer.style.display = "flex";

        cropper = new Cropper(cropPreview, {
          aspectRatio: cropAspectRatio,
          rotatable: true,
        });
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please upload a PNG or JPG image.");
    }
  };

  const fileChange = (event) => {
    file = event.target.files[0];
    handleFile(file);
  };

  const submitCallback = () => {
    if (!file) {
      return toastMessage("Select an image.");
    }

    cropper.destroy();
    uploadSpinner.style.display = "block";
    uploadSubmit.disabled = true;

    const { img_id, museum } = uploadProperties;

    uploadItem(
      file,
      uploadTitle.value,
      uploadDescription.value,
      uploadHandle.value,
      null,
      img_id,
      museum
    )
      .then((res) => {
        uploadSpinner.style.display = "none";
        uploadSubmit.disabled = false;

        const uploadEvent = new CustomEvent("uploadevent", {
          detail: {
            ...uploadProperties,
            title: uploadTitle.value,
            description: uploadDescription.value,
            name: uploadHandle.value,
            img_url: URL.createObjectURL(file),
          },
        });

        document.body.dispatchEvent(uploadEvent);

        if (res.success) {
          closeUploadModal();
        }
      })
      .catch((error) => {
        toastMessage(`${error.message}`);
        uploadSpinner.style.display = "none";
        uploadSubmit.disabled = false;
      });
  };

  const cropCallback = () => {
    const canvas = cropper.getCroppedCanvas();
    const croppedImageDataURL = canvas?.toDataURL("image/jpeg");

    canvas?.toBlob((blob) => {
      if (blob) {
        file = new File([blob], file.name, { type: file.type });
      }
    }, file.type);

    uploadPreview.src = croppedImageDataURL;
    uploadPreview.style.display = "block";
    uploadText.style.display = "none";

    cropperContainer.style.display = "none";
    cropper.destroy();
  };

  // Attach events
    closeBtn.addEventListener("click", closeUploadModal);
    uploadContainer.addEventListener("click", openInput);
    uploadInput.addEventListener("change", fileChange);
    uploadSubmit.addEventListener("click", submitCallback);
    cropBtn.addEventListener("click", cropCallback);

  // Drag drop handlers
    uploadContainer.addEventListener("dragover", (event) => {
      event.preventDefault();
      uploadContainer.classList.add("dragover");
    });
    
    uploadContainer.addEventListener("dragleave", () => {
      uploadContainer.classList.remove("dragover");
    });

    uploadContainer.addEventListener("drop", (event) => {
      event.preventDefault();
      uploadContainer.classList.remove("dragover");
  
      file = event.dataTransfer.files[0];
      handleFile(file);
    });

    uploadModal.style.display = "none";

}

export function setCropAspectRatio(aspect) {
  cropAspectRatio = aspect;
}

export function getMeshSizeInPixels(mesh, camera, renderer) {
  const vector = new THREE.Vector3();
  const box = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();
  box.getSize(size);

  const corners = [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y, box.max.z),
  ];

  const min = new THREE.Vector2(Infinity, Infinity);
  const max = new THREE.Vector2(-Infinity, -Infinity);

  corners.forEach((corner) => {
    vector.copy(corner).project(camera);

    const x = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
    const y = (vector.y * -0.5 + 0.5) * renderer.domElement.clientHeight;

    min.x = Math.min(min.x, x);
    min.y = Math.min(min.y, y);
    max.x = Math.max(max.x, x);
    max.y = Math.max(max.y, y);
  });

  const width = max.x - min.x;
  const height = max.y - min.y;

  return { width, height };
}
