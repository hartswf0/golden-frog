class LettersScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.fontLoader = new THREE.FontLoader();
        this.font = null;
        this.letterStreams = [];
        this.collectedFragments = new Set();
        this.fragmentsNeeded = 12;
        this.isPaused = false;
        this.keys = { left: false, right: false, up: false, down: false };
        
        // Positive fragments that need to be collected
        this.storyFragments = [
            "women directors", "equal pay", "diverse voices",
            "representation", "breaking barriers", "inclusivity",
            "female leads", "women writers", "gender equality",
            "fair coverage", "media diversity", "equal opportunity"
        ];
        
        // Negative fragments that reduce progress
        this.negativeFragments = [
            "bias", "silence", "limit", "exclude",
            "restrict", "dismiss"
        ];
        
        this.bottleSpeed = 0.2;
        this.setup();
    }

    setup() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('letters-scene').appendChild(this.renderer.domElement);
        this.camera.position.z = 15;
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 0.8);
        pointLight.position.set(10, 10, 10);
        this.scene.add(pointLight);
        
        this.fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            this.font = font;
            this.createBottle();
            this.initLetterStreams();
            this.setupEventListeners();
            this.animate();
        });
        
        this.setupProgressTracker();
        this.setupReconstitutionArea();
    }

    setupProgressTracker() {
        this.progressElement = document.createElement('div');
        this.progressElement.className = 'letter-progress';
        this.progressElement.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <div class="progress-text">0/${this.fragmentsNeeded} Fragments</div>
        `;
        document.body.appendChild(this.progressElement);
    }

    setupReconstitutionArea() {
        this.reconstitutionArea = document.createElement('div');
        this.reconstitutionArea.className = 'reconstitution-area';
        document.body.appendChild(this.reconstitutionArea);
    }

    updateProgress() {
        const progress = (this.collectedFragments.size / this.fragmentsNeeded) * 100;
        const progressFill = this.progressElement.querySelector('.progress-fill');
        const progressText = this.progressElement.querySelector('.progress-text');
        
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${this.collectedFragments.size}/${this.fragmentsNeeded} Fragments`;
        
        if (this.bottle.children[0]) {
            this.bottle.children[0].material.uniforms.fillLevel.value = 
                this.collectedFragments.size / this.fragmentsNeeded;
        }
        
        if (this.collectedFragments.size > 0) {
            const fragment = Array.from(this.collectedFragments).slice(-1)[0];
            const fragmentElement = document.createElement('div');
            fragmentElement.className = 'floating-fragment';
            fragmentElement.textContent = fragment;
            this.reconstitutionArea.appendChild(fragmentElement);
            
            gsap.to(fragmentElement, {
                opacity: 0,
                y: -50,
                duration: 2,
                ease: "power2.out",
                onComplete: () => fragmentElement.remove()
            });
        }
        
        if (this.collectedFragments.size >= this.fragmentsNeeded && !this.isPaused) {
            this.showLetterMessage();
        }
    }

    showLetterMessage() {
        this.pauseGame();
        
        const modal = document.createElement('div');
        modal.className = 'letter-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Letter Reconstituted!</h2>
                <div class="success-message">
                    <p class="success-icon">✨</p>
                    <p class="message">You've successfully collected enough fragments to reveal the story.</p>
                </div>
                <div class="letter-content">
                    <p>Dear Media Industry,</p>
                    <p>We write to address the persistent underrepresentation of women in media. The numbers tell a clear story: women remain significantly underrepresented in key creative and leadership roles.</p>
                    <p>Change begins with awareness.</p>
                </div>
                <button class="continue-journey-btn">Continue Journey</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        gsap.from(modal, {
            opacity: 0,
            scale: 0.9,
            duration: 0.5,
            ease: "back.out(1.7)"
        });
        
        const button = modal.querySelector('button');
        button.addEventListener('click', () => {
            gsap.to(modal, {
                opacity: 0,
                scale: 0.9,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => {
                    modal.remove();
                    window.location.href = 'final.html';
                }
            });
        });
    }

    pauseGame() {
        this.isPaused = true;
        this.letterStreams.forEach(stream => {
            stream.fragments.forEach(fragment => {
                fragment.originalVelocity = fragment.velocity.clone();
                fragment.velocity.set(0, 0, 0);
            });
        });
    }

    resumeGame() {
        this.isPaused = false;
        this.letterStreams.forEach(stream => {
            stream.fragments.forEach(fragment => {
                if (fragment.originalVelocity) {
                    fragment.velocity.copy(fragment.originalVelocity);
                }
            });
        });
    }

    checkFragmentCollision(fragment) {
        if (!this.bottle || fragment.collected || this.isPaused) return false;
        
        const bottleBox = new THREE.Box3().setFromObject(this.bottle);
        const fragmentBox = new THREE.Box3().setFromObject(fragment.mesh);
        
        if (bottleBox.intersectsBox(fragmentBox)) {
            if (fragment.isNegative) {
                const fragments = Array.from(this.collectedFragments);
                if (fragments.length > 0) {
                    const removedFragment = fragments[Math.floor(Math.random() * fragments.length)];
                    this.collectedFragments.delete(removedFragment);
                    this.showNegativeEffect();
                }
            } else {
                this.collectedFragments.add(fragment.text);
            }
            this.updateProgress();
            return true;
        }
        return false;
    }

    showNegativeEffect() {
        const overlay = document.createElement('div');
        overlay.className = 'negative-overlay';
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.remove();
        }, 200);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (!this.isPaused) {
            this.updateBottlePosition();
            
            // Update letter streams and check collisions
            this.letterStreams.forEach(stream => {
                stream.update();
                stream.fragments.forEach(fragment => {
                    if (!fragment.collected && this.checkFragmentCollision(fragment)) {
                        fragment.collected = true;
                        
                        // Animate fragment disappearing
                        gsap.to(fragment.mesh.scale, {
                            x: 0,
                            y: 0,
                            z: 0,
                            duration: 0.3,
                            onComplete: () => {
                                stream.removeFragment(fragment);
                            }
                        });
                    }
                });
            });
        }
        
        // Update bottle glow
        if (this.bottle && this.bottle.children[0]) {
            this.bottle.children[0].material.uniforms.time.value += 0.016;
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    updateBottlePosition() {
        if (this.keys.left) this.bottle.position.x -= this.bottleSpeed;
        if (this.keys.right) this.bottle.position.x += this.bottleSpeed;
        if (this.keys.up) this.bottle.position.y += this.bottleSpeed;
        if (this.keys.down) this.bottle.position.y -= this.bottleSpeed;
        
        this.bottle.position.x = Math.max(-10, Math.min(10, this.bottle.position.x));
        this.bottle.position.y = Math.max(-10, Math.min(0, this.bottle.position.y));
    }

    createBottle() {
        const bottleGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2.5, 32);
        const bottleMaterial = new THREE.MeshPhongMaterial({
            color: 0x3498db,
            transparent: true,
            opacity: 0.6
        });
        this.bottle = new THREE.Mesh(bottleGeometry, bottleMaterial);
        this.bottle.position.set(0, -8, 0);
        
        // Add glow effect
        const glowGeometry = new THREE.CylinderGeometry(1, 1, 2.7, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                fillLevel: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float fillLevel;
                varying vec2 vUv;
                void main() {
                    float glow = sin(time * 2.0) * 0.2 + 0.8;
                    float fill = smoothstep(fillLevel - 0.1, fillLevel + 0.1, vUv.y);
                    vec3 color = vec3(0.2, 0.5, 1.0);
                    gl_FragColor = vec4(color, (1.0 - fill) * glow * 0.3);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.bottle.add(glow);
        
        this.scene.add(this.bottle);
    }

    initLetterStreams() {
        const streamCount = 15;
        for (let i = 0; i < streamCount; i++) {
            const xPos = (Math.random() - 0.5) * 20;
            const stream = new LetterStream(this.scene, xPos, this.font, this.storyFragments, this.negativeFragments);
            this.letterStreams.push(stream);
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft': this.keys.left = true; break;
                case 'ArrowRight': this.keys.right = true; break;
                case 'ArrowUp': this.keys.up = true; break;
                case 'ArrowDown': this.keys.down = true; break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowLeft': this.keys.left = false; break;
                case 'ArrowRight': this.keys.right = false; break;
                case 'ArrowUp': this.keys.up = false; break;
                case 'ArrowDown': this.keys.down = false; break;
            }
        });

        // Show tooltip for controls
        const tooltip = document.createElement('div');
        tooltip.className = 'controls-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <h3>Controls</h3>
                <p>Use arrow keys to move the bottle</p>
                <p>Collect positive words (white)</p>
                <p>Avoid negative words (red)</p>
            </div>
        `;
        document.body.appendChild(tooltip);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

class LetterStream {
    constructor(scene, xPosition, font, storyFragments, negativeFragments) {
        this.scene = scene;
        this.xPosition = xPosition;
        this.font = font;
        this.storyFragments = storyFragments;
        this.negativeFragments = negativeFragments;
        this.fragments = [];
        this.spawnTimer = 0;
        this.spawnInterval = Math.random() * 2 + 1;
    }

    createFragment() {
        const isNegative = Math.random() < 0.2;
        const fragmentText = isNegative ? 
            this.negativeFragments[Math.floor(Math.random() * this.negativeFragments.length)] :
            this.storyFragments[Math.floor(Math.random() * this.storyFragments.length)];
        
        const geometry = new THREE.TextGeometry(fragmentText, {
            font: this.font,
            size: 0.3,
            height: 0.05,
            curveSegments: 12
        });
        
        const material = new THREE.MeshPhongMaterial({
            color: isNegative ? 0xff4444 : 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        geometry.computeBoundingBox();
        const width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
        
        mesh.position.set(
            this.xPosition - width/2 + (Math.random() - 0.5) * 2,
            12,
            0
        );
        
        const fragment = {
            mesh,
            text: fragmentText,
            velocity: new THREE.Vector3(0, -0.03 - Math.random() * 0.02, 0),
            collected: false,
            isNegative
        };
        
        this.scene.add(mesh);
        this.fragments.push(fragment);
    }

    update() {
        this.spawnTimer += 0.016;
        if (this.spawnTimer >= this.spawnInterval) {
            this.createFragment();
            this.spawnTimer = 0;
            this.spawnInterval = Math.random() * 2 + 1;
        }
        
        for (let i = this.fragments.length - 1; i >= 0; i--) {
            const fragment = this.fragments[i];
            if (!fragment.collected) {
                // Add some horizontal movement
                fragment.mesh.position.x += Math.sin(Date.now() * 0.001 + fragment.mesh.position.y) * 0.01;
                
                // Apply gravity and velocity
                fragment.velocity.y += -0.0005;
                fragment.mesh.position.add(fragment.velocity);
                
                // Remove if below screen
                if (fragment.mesh.position.y < -12) {
                    this.removeFragment(fragment);
                    this.fragments.splice(i, 1);
                }
            }
        }
    }

    removeFragment(fragment) {
        this.scene.remove(fragment.mesh);
        fragment.mesh.geometry.dispose();
        fragment.mesh.material.dispose();
    }
}

window.addEventListener('load', () => {
    const lettersScene = new LettersScene();
});
