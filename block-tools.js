class BlockTools {
  constructor(scene, gridBlocks, debugInfo) {
    this.scene = scene;
    this.gridBlocks = gridBlocks;
    this.debugInfo = debugInfo;
    this.selectedBlock = null;
    this.initialBlockColor = null;
  }

  addBlock(position, blockType = document.getElementById('block-type').value) {
    let geometry;
    const orientation = document.getElementById('block-orientation').value;
    let rotation = 0;
    
    switch (orientation) {
      case 'east':
        rotation = Math.PI / 2;
        break;
      case 'south':
        rotation = Math.PI;
        break;
      case 'west':
        rotation = -Math.PI / 2;
        break;
    }

    switch (blockType) {
      case 'full':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'stair':
        geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
          -0.5, 0.0, 0.5,   0.5, 0.0, 0.5,   0.5, 0.25, 0.5,  -0.5, 0.25, 0.5,
          -0.5, 0.0, -0.5,  0.5, 0.0, -0.5,  0.5, 0.25, -0.5, -0.5, 0.25, -0.5,
          -0.5, 0.25, 0.5,  0.0, 0.25, 0.5,  0.0, 0.5, 0.5,   -0.5, 0.5, 0.5,
          -0.5, 0.25, -0.5, 0.0, 0.25, -0.5, 0.0, 0.5, -0.5,  -0.5, 0.5, -0.5
        ]);
        const indices = new Uint16Array([
          0, 1, 2,    0, 2, 3,    4, 5, 6,    4, 6, 7,
          0, 4, 7,    0, 7, 3,    1, 5, 6,    1, 6, 2,
          3, 2, 6,    3, 6, 7,    0, 1, 5,    0, 5, 4,
          8, 9, 10,   8, 10, 11,  12, 13, 14, 12, 14, 15,
          8, 12, 15,  8, 15, 11,  9, 13, 14,  9, 14, 10,
          11, 10, 14, 11, 14, 15, 8, 9, 13,   8, 13, 12
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry.computeVertexNormals();
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 0.5, 1);
    }

    const material = new THREE.MeshPhongMaterial({
      color: document.getElementById('block-color').value
    });

    const block = new THREE.Mesh(geometry, material);
    block.userData.initialColor = material.color.getHexString();
    block.userData.blockType = blockType;
    block.userData.orientation = orientation;

    const adjustedX = position.x + 0.5;
    const adjustedY = position.y + (blockType === 'full' ? 0.5 : 
                                  blockType === 'half' ? 0.25 : 
                                  blockType === 'stair' ? 0.0 : 0.25);
    const adjustedZ = position.z + 0.5;

    block.position.set(adjustedX, adjustedY, adjustedZ);
    block.rotation.y = rotation;
    block.userData.key = `${position.x},${position.y},${position.z}`;
    
    this.scene.add(block);

    if (!this.selectedBlock) {
      this.selectedBlock = block;
      document.getElementById('block-color').value = '#' + block.material.color.getHexString();
      this.updateBlocksList();
    }

    return block;
  }

  removeBlock(key) {
    this.scene.children.forEach(child => {
      if (child.userData.key === key) {
        if (child.userData.outline) {
          this.scene.remove(child.userData.outline);
        }
        this.scene.remove(child);
        delete this.gridBlocks[key];
        
        if (this.selectedBlock && this.selectedBlock.userData.key === key) {
          this.selectBlock(null);
        }
      }
    });
    this.updateBlocksList();
  }

  selectBlock(block) {
    if (this.selectedBlock === block) return;
    
    if (this.selectedBlock) {
      this.removeBlockOutline(this.selectedBlock);
    }
    
    this.selectedBlock = block;
    
    if (this.selectedBlock && document.getElementById('select-tool').classList.contains('active')) {
      document.getElementById('block-color').value = '#' + this.selectedBlock.material.color.getHexString();
      document.getElementById('block-orientation').value = this.selectedBlock.userData.orientation || 'north';
      this.addBlockOutline(this.selectedBlock);
    }
    
    this.updateBlocksList();
  }

  addBlockOutline(block) {
    if (block.userData.outline) {
      this.removeBlockOutline(block);
    }

    let geometry;
    switch (block.userData.blockType) {
      case 'full':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'stair':
        geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
          -0.5, 0.0, 0.5,   0.5, 0.0, 0.5,   0.5, 0.25, 0.5,  -0.5, 0.25, 0.5,
          -0.5, 0.0, -0.5,  0.5, 0.0, -0.5,  0.5, 0.25, -0.5, -0.5, 0.25, -0.5,
          -0.5, 0.25, 0.5,  0.0, 0.25, 0.5,  0.0, 0.5, 0.5,   -0.5, 0.5, 0.5,
          -0.5, 0.25, -0.5, 0.0, 0.25, -0.5, 0.0, 0.5, -0.5,  -0.5, 0.5, -0.5
        ]);
        const indices = new Uint16Array([
          0, 1, 2,    0, 2, 3,    4, 5, 6,    4, 6, 7,
          0, 4, 7,    0, 7, 3,    1, 5, 6,    1, 6, 2,
          3, 2, 6,    3, 6, 7,    0, 1, 5,    0, 5, 4,
          8, 9, 10,   8, 10, 11,  12, 13, 14, 12, 14, 15,
          8, 12, 15,  8, 15, 11,  9, 13, 14,  9, 14, 10,
          11, 10, 14, 11, 14, 15, 8, 9, 13,   8, 13, 12
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry.computeVertexNormals();
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 0.5, 1);
    }

    const edges = new THREE.EdgesGeometry(geometry);
    const outline = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x0088ff, linewidth: 2 })
    );

    outline.position.copy(block.position);
    outline.rotation.copy(block.rotation);
    outline.scale.set(1.02, 1.02, 1.02);
    
    this.scene.add(outline);
    block.userData.outline = outline;
  }

  removeBlockOutline(block) {
    if (block.userData.outline) {
      this.scene.remove(block.userData.outline);
      block.userData.outline = null;
    }
  }

  updateBlocksList() {
    if (this.selectedBlock) {
      this.initialBlockColor = null;
    }

    const blocksList = document.getElementById('placed-blocks-list');
    const scrollTop = blocksList.scrollTop;
    blocksList.innerHTML = '';

    Object.entries(this.gridBlocks).forEach(([key, block]) => {
      const blockItem = document.createElement('div');
      blockItem.className = 'block-item';
      
      if (this.selectedBlock && this.selectedBlock.userData.key === key) {
        blockItem.classList.add('selected-block');
      }

      const [x, y, z] = key.split(',').map(Number);
      blockItem.textContent = `${block.userData.blockType || 'half'} Block at (${x}, ${y}, ${z}) facing ${block.userData.orientation || 'north'}`;
      
      blockItem.addEventListener('click', () => {
        this.selectBlock(block);
      });

      blocksList.appendChild(blockItem);
    });

    blocksList.scrollTop = scrollTop;
  }

  getSelectedBlock() {
    return this.selectedBlock;
  }

  setSelectedBlock(block) {
    this.selectedBlock = block;
  }

  getInitialBlockColor() {
    return this.initialBlockColor;
  }

  setInitialBlockColor(color) {
    this.initialBlockColor = color;
  }
}

// Make BlockTools available globally
window.BlockTools = BlockTools;