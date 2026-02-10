class PlacedAssets {
  constructor(scene, loader) {
    this.scene = scene;
    this.loader = loader;
    this.placedAssets = [];
    this.selectedPlacedAsset = null;
    this.assetIdCounter = 0;
  }

  addPlacedAssetToList(assetData) {
    const placedAssetsList = document.getElementById('placed-assets-list');
    const assetItem = document.createElement('div');
    assetItem.className = 'asset-item';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-asset-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.onclick = e => {
      e.stopPropagation();
      this.deletePlacedAsset(assetData.id, true);
    };

    const typeSelect = document.createElement('select');
    typeSelect.className = 'asset-type-select';
    ['scene object', 'player', 'npc', 'texture'].forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      typeSelect.appendChild(option);
    });

    typeSelect.value = assetData.type || 'scene object';
    typeSelect.addEventListener('change', e => {
      const newType = e.target.value;
      const oldType = assetData.type || 'scene object';
      assetData.type = newType;
      window.debugInfo.lastAction = `Changed asset ${assetData.id} type from ${oldType} to ${newType}`;
      window.addActionToHistory(window.debugInfo.lastAction, {
        type: 'changeAssetType',
        assetId: assetData.id,
        previousType: oldType,
        newType: newType
      });
      window.updateDebugInfo();
    });

    assetItem.innerHTML = `
      <div class="asset-name">${assetData.name} (ID: ${assetData.id})</div>
    `;
    assetItem.appendChild(typeSelect);
    assetItem.appendChild(deleteBtn);
    placedAssetsList.appendChild(assetItem);

    assetItem.querySelector('.asset-name').addEventListener('click', () => {
      this.selectPlacedAsset(assetData.id);
    });

    assetData.assetItem = assetItem;
    assetData.typeSelect = typeSelect;
  }

  getPlacedAssetById(assetId) {
    return this.placedAssets.find(asset => asset.id === assetId);
  }

  selectPlacedAsset(assetId) {
    const asset = this.getPlacedAssetById(assetId);
    if (asset) {
      if (this.selectedPlacedAsset) {
        this.deselectPlacedAsset();
      }
      this.selectedPlacedAsset = asset;
      const helper = new THREE.BoxHelper(asset.model, 0xffff00);
      helper.name = 'selectionHelper';
      this.scene.add(helper);
      asset.helper = helper;
      asset.assetItem.classList.add('selected-asset');
      this.showRotationUI(asset);
    }
  }

  deselectPlacedAsset() {
    if (this.selectedPlacedAsset) {
      if (this.selectedPlacedAsset.helper) {
        this.scene.remove(this.selectedPlacedAsset.helper);
        this.selectedPlacedAsset.helper = null;
      }
      this.hideRotationUI(this.selectedPlacedAsset);
      this.selectedPlacedAsset.assetItem.classList.remove('selected-asset');
      this.selectedPlacedAsset = null;
    }
  }

  deletePlacedAsset(assetId, recordAction = true) {
    const asset = this.getPlacedAssetById(assetId);
    if (asset) {
      if (asset.helper) {
        this.scene.remove(asset.helper);
      }
      this.scene.remove(asset.model);
      asset.assetItem.parentNode.removeChild(asset.assetItem);
      
      const index = this.placedAssets.findIndex(a => a.id === assetId);
      if (index !== -1) {
        this.placedAssets.splice(index, 1);
      }

      if (this.selectedPlacedAsset && this.selectedPlacedAsset.id === assetId) {
        this.deselectPlacedAsset();
      }

      window.debugInfo.lastAction = `Deleted asset ${assetId}`;
      if (recordAction) {
        window.addActionToHistory(window.debugInfo.lastAction, {
          type: 'deleteAsset',
          assetData: {
            id: asset.id,
            url: asset.url,
            name: asset.name,
            position: {
              x: asset.model.position.x,
              y: asset.model.position.y,
              z: asset.model.position.z
            },
            rotation: {
              x: asset.model.rotation.x,
              y: asset.model.rotation.y,
              z: asset.model.rotation.z
            },
            scale: {
              x: asset.model.scale.x,
              y: asset.model.scale.y,
              z: asset.model.scale.z
            }
          }
        });
      }
      window.updateDebugInfo();
    }
  }

  showRotationUI(asset) {
    const rotationUI = document.createElement('div');
    rotationUI.className = 'rotation-ui';
    
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    angles.forEach(angle => {
      const button = document.createElement('button');
      button.className = 'rotation-button';
      button.innerHTML = this.getRotationArrowIcon(angle);
      button.addEventListener('click', event => {
        event.stopPropagation();
        this.rotatePlacedAssetToAngle(asset.id, angle);
      });
      rotationUI.appendChild(button);
    });
    const rotationControls = document.createElement('div');
    rotationControls.className = 'rotation-controls';
    const axes = ['X', 'Y', 'Z'];
    axes.forEach(axis => {
      const axisControl = document.createElement('div');
      axisControl.className = 'rotation-axis';
      
      const label = document.createElement('span');
      label.textContent = axis;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '360';
      slider.value = asset.model.rotation[axis.toLowerCase()] * 180 / Math.PI % 360;

      const numberInput = document.createElement('input');
      numberInput.type = 'number';
      numberInput.min = '0';
      numberInput.max = '360';
      numberInput.value = slider.value;
      numberInput.step = '1';

      const updateRotation = e => {
        const radians = e.target.value * Math.PI / 180;
        const axis = axis.toLowerCase();
        const previousRotation = asset.model.rotation[axis];
        window.debugInfo.lastAction = `Rotated asset ${asset.id} ${axis}-axis to ${e.target.value} degrees`;
        window.addActionToHistory(window.debugInfo.lastAction, {
          type: 'rotateAssetAxis',
          assetId: asset.id,
          axis: axis,
          previousRotation: previousRotation,
          newRotation: radians
        });
        window.updateDebugInfo();
      };

      slider.addEventListener('input', e => {
        numberInput.value = e.target.value;
        updateRotation(e);
      });

      numberInput.addEventListener('input', e => {
        slider.value = e.target.value;
        updateRotation(e);
      });

      axisControl.appendChild(label);
      axisControl.appendChild(slider);
      axisControl.appendChild(numberInput);
      rotationControls.appendChild(axisControl);
    });
    rotationUI.appendChild(rotationControls);
    asset.assetItem.appendChild(rotationUI);
    asset.rotationUI = rotationUI;
  }

  hideRotationUI(asset) {
    if (asset.rotationUI) {
      asset.assetItem.removeChild(asset.rotationUI);
      asset.rotationUI = null;
    }
  }

  getRotationArrowIcon(angle) {
    return `<span class="arrow-icon" style="transform: rotate(${angle}deg);">&#9650;</span>`;
  }

  rotatePlacedAssetToAngle(assetId, angle) {
    const asset = this.getPlacedAssetById(assetId);
    if (asset) {
      const previousRotation = asset.model.rotation.y;
      asset.model.rotation.y = THREE.Math.degToRad(angle);
      if (asset.helper) {
        asset.helper.update();
      }

      window.debugInfo.lastAction = `Rotated asset ${assetId} to ${angle} degrees`;
      window.addActionToHistory(window.debugInfo.lastAction, {
        type: 'rotateAsset',
        assetId: assetId,
        previousRotation: previousRotation,
        newRotation: asset.model.rotation.y
      });
      window.updateDebugInfo();
    }
  }
}

// Make PlacedAssets available globally
window.PlacedAssets = PlacedAssets;