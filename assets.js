// Asset Management System
class AssetManager {
  constructor(scene, loader) {
    this.scene = scene;
    this.loader = loader;
    this.loadedModels = [];
    this.loadedTextures = [];
    this.placedAssets = [];
    this.selectedPlacedAsset = null;
    this.modelPreview = null;
    this.selectedModel = null;
    this.assetIdCounter = 0;
  }

  async uploadModel(file) {
    try {
      const url = await websim.upload(file);
      const name = file.name;
      this.loadModelFromURL(url, name);
    } catch (error) {
      console.error('Error uploading file:', error);
      debugInfo.lastAction = `Error uploading model: ${error.message}`;
      addActionToHistory(debugInfo.lastAction);
      updateDebugInfo();
    }
  }

  loadModelFromURL(url, name, defaultRotation = { x: 0, y: 0, z: 0 }) {
    if (this.loadedModels.some(model => model.url === url)) {
      return;
    }

    this.loader.load(url, gltf => {
      const model = gltf.scene;
      model.userData.yOffset = new THREE.Box3().setFromObject(model).min.y;
      model.userData.url = url;
      model.userData.name = name;
      model.rotation.set(defaultRotation.x || 0, defaultRotation.y || 0, defaultRotation.z || 0);

      const assetItem = this.createAssetItem(model, url, name);
      document.getElementById('asset-list').appendChild(assetItem);

      this.loadedModels.push({
        model: model,
        preview: assetItem.querySelector('.asset-preview'),
        url: url,
        name: name
      });

      debugInfo.lastAction = `Loaded model: ${name}`;
      addActionToHistory(debugInfo.lastAction);
      updateDebugInfo();
    }, undefined, error => {
      console.error(error);
      debugInfo.lastAction = `Error loading model: ${error.message}`;
      addActionToHistory(debugInfo.lastAction);
      updateDebugInfo();
    });
  }

  createAssetItem(model, url, name) {
    const assetItem = document.createElement('div');
    assetItem.className = 'asset-item';

    const defaultRotationControls = document.createElement('div');
    defaultRotationControls.className = 'default-rotation-controls';
    
    const rotationLabel = document.createElement('div');
    rotationLabel.className = 'rotation-label';
    rotationLabel.textContent = 'Default Rotation';
    defaultRotationControls.appendChild(rotationLabel);

    ['X', 'Y', 'Z'].forEach(axis => {
      const axisControl = document.createElement('div');
      axisControl.className = 'rotation-axis';
      
      const label = document.createElement('span');
      label.textContent = axis;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '360';
      slider.value = model.rotation[axis.toLowerCase()] * 180 / Math.PI % 360;

      const numberInput = document.createElement('input');
      numberInput.type = 'number';
      numberInput.min = '0';
      numberInput.max = '360';
      numberInput.value = slider.value;
      numberInput.step = '1';

      const updateRotation = () => {
        const radians = numberInput.value * Math.PI / 180;
        model.rotation[axis.toLowerCase()] = radians;
        if (this.modelPreview) {
          this.modelPreview.rotation[axis.toLowerCase()] = radians;
        }
      };

      slider.addEventListener('input', e => {
        numberInput.value = e.target.value;
        updateRotation();
      });

      numberInput.addEventListener('input', e => {
        slider.value = e.target.value;
        updateRotation();
      });

      numberInput.addEventListener('change', () => {
        const loadedModel = this.loadedModels.find(m => m.url === model.userData.url);
        if (loadedModel) {
          loadedModel.model.rotation[axis.toLowerCase()] = model.rotation[axis.toLowerCase()];
        }
      });

      axisControl.appendChild(label);
      axisControl.appendChild(slider);
      axisControl.appendChild(numberInput);
      defaultRotationControls.appendChild(axisControl);
    });

    assetItem.innerHTML = `
      <div class="asset-name">${name}</div>
    `;
    assetItem.appendChild(defaultRotationControls);

    assetItem.addEventListener('click', () => {
      if (this.modelPreview) {
        this.scene.remove(this.modelPreview);
        this.modelPreview = null;
      }
      this.selectedModel = model;
      placementPreview.visible = false;
      document.querySelectorAll('.tool-button').forEach(b => b.classList.remove('active'));
      document.getElementById('place-block').classList.add('active');

      if (this.selectedModel) {
        if (!this.modelPreview) {
          this.modelPreview = this.selectedModel.clone();
          this.modelPreview.traverse(child => {
            if (child.material) {
              child.material = child.material.clone();
              child.material.transparent = true;
              child.material.opacity = 0.5;
            }
          });
          this.modelPreview.rotation.copy(this.selectedModel.rotation);
          this.scene.add(this.modelPreview);
        }
      }
    });

    return assetItem;
  }

  // Add getters and setters for key properties
  getSelectedModel() {
    return this.selectedModel;
  }

  getModelPreview() {
    return this.modelPreview;
  }

  getLoadedModels() {
    return this.loadedModels;
  }

  getPlacedAssets() {
    return this.placedAssets;
  }
}

// Export the AssetManager class
window.AssetManager = AssetManager;