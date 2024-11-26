class Layer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        this.container.appendChild(this.renderer.domElement);
        
        this.setupLighting();
        this.setupResizeHandler();
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x111111);
        this.scene.add(ambientLight);
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera);
    }

    update() {
        // Override in child classes
    }
}

class WellScene extends Layer {
    constructor(containerId) {
        super(containerId);
        
        // Initialize journey state
        this.journeyProgress = 0;
        this.targetProgress = 0;
        this.messages = [
            { text: "At the bottom, only 3.1% of the sky is visible...", height: 0 },
            { text: "As we rise, we begin to see the barriers...", height: 0.2 },
            { text: "Each step up reveals more possibilities...", height: 0.4 },
            { text: "The light grows stronger as we climb...", height: 0.6 },
            { text: "Until finally, we can see the whole sky.", height: 0.8 }
        ];
        this.currentMessage = 0;
        this.lastMessageShown = false;

        this.setupShaders();
        this.setupWell();
        this.setupSky();
        this.setupFrog();
        this.setupFrogLight();
        
        // Position camera at bottom of well
        this.camera.position.set(0, -4, 0);
        this.camera.lookAt(0, 10, 0);
        
        // Start animation
        this.animate();
        
        // Add scroll listener
        window.addEventListener('scroll', () => this.handleScroll());
        
        // Show initial message
        this.updateMessage(0);
    }

    setupShaders() {
        // Custom vertex shader for well walls
        this.wellVertexShader = `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        // Custom fragment shader for well walls
        this.wellFragmentShader = `
            uniform float time;
            uniform vec3 frogPosition;
            uniform float frogIntensity;
            
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                // Create a stone-like texture
                float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
                vec3 baseColor = vec3(0.2 + noise * 0.1);
                
                // Calculate distance from frog light
                float dist = length(vPosition - frogPosition);
                float lightIntensity = frogIntensity / (dist * dist);
                
                // Add vertical gradient
                float gradientIntensity = smoothstep(-10.0, 10.0, vPosition.y) * 0.3;
                
                // Add moisture effect (darker spots)
                float moisture = sin(vUv.y * 20.0 + noise * 5.0) * 0.1;
                moisture += sin(vUv.x * 15.0 + noise * 3.0) * 0.1;
                
                // Combine all effects
                vec3 finalColor = baseColor;
                finalColor += vec3(0.2, 0.4, 0.2) * lightIntensity; // Green tint from frog
                finalColor += vec3(gradientIntensity);
                finalColor -= vec3(moisture * 0.2);
                
                // Add subtle animation
                float pulse = sin(time * 2.0 + vPosition.y) * 0.05;
                finalColor += vec3(pulse);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
    }

    setupWell() {
        const wellGeometry = new THREE.CylinderGeometry(2, 2, 20, 32, 32);
        const wellMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                frogPosition: { value: new THREE.Vector3(0, -4, 0) },
                frogIntensity: { value: 1.0 }
            },
            vertexShader: this.wellVertexShader,
            fragmentShader: this.wellFragmentShader,
            side: THREE.BackSide
        });
        
        this.well = new THREE.Mesh(wellGeometry, wellMaterial);
        this.well.position.y = 5;
        this.scene.add(this.well);
    }

    setupSky() {
        // Create sky circle
        const skyGeometry = new THREE.CircleGeometry(2, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.1
        });
        this.sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.sky.position.y = 15; // Position at top of well
        this.sky.rotation.x = -Math.PI / 2;
        this.scene.add(this.sky);
        
        // Add subtle glow around sky
        const skyGlowGeometry = new THREE.CircleGeometry(2.2, 32);
        const skyGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.05
        });
        this.skyGlow = new THREE.Mesh(skyGlowGeometry, skyGlowMaterial);
        this.skyGlow.position.y = 14.9;
        this.skyGlow.rotation.x = -Math.PI / 2;
        this.scene.add(this.skyGlow);
    }

    setupFrog() {
        const frogGeometry = new THREE.SphereGeometry(0.2, 32, 32);
        const frogMaterial = new THREE.MeshStandardMaterial({
            color: 0x2ecc71,
            emissive: 0x2ecc71,
            emissiveIntensity: 0.5
        });
        this.frog = new THREE.Mesh(frogGeometry, frogMaterial);
        this.scene.add(this.frog);
    }

    setupFrogLight() {
        // Add point light to frog
        this.frogLight = new THREE.PointLight(0x2ecc71, 2, 5);
        this.frog.add(this.frogLight);
        
        // Add larger, softer light for ambient illumination
        this.frogAmbientLight = new THREE.PointLight(0x2ecc71, 1, 8);
        this.frog.add(this.frogAmbientLight);
    }

    updateMessage(progress) {
        // Find the appropriate message for the current height
        const messageIndex = this.messages.findIndex(msg => msg.height > progress);
        const currentIndex = messageIndex === -1 ? this.messages.length - 1 : messageIndex - 1;
        
        if (currentIndex !== this.currentMessage) {
            this.currentMessage = currentIndex;
            const messageElement = document.querySelector('.message');
            
            gsap.to(messageElement, {
                opacity: 0,
                y: -20,
                duration: 0.5,
                onComplete: () => {
                    messageElement.textContent = this.messages[currentIndex].text;
                    gsap.to(messageElement, {
                        opacity: 1,
                        y: 0,
                        duration: 0.5
                    });

                    // Check if this is the last message
                    if (currentIndex === this.messages.length - 1 && !this.lastMessageShown) {
                        this.lastMessageShown = true;
                        this.createTransitionButton();
                    }
                }
            });
        }
    }

    createTransitionButton() {
        // Create bird container
        const birdContainer = document.createElement('div');
        birdContainer.className = 'bird-container';
        
        // Create bird SVG
        const birdSVG = `
            <svg class="bird" viewBox="0 0 100 100">
                <path d="M50,35 C55,25 70,25 75,35 C80,45 70,55 50,45 C30,55 20,45 25,35 C30,25 45,25 50,35" />
                <circle class="eye" cx="45" cy="32" r="2" />
            </svg>
        `;
        birdContainer.innerHTML = birdSVG;
        
        // Create button text
        const buttonText = document.createElement('span');
        buttonText.className = 'button-text';
        buttonText.textContent = 'Explore Media Coverage';
        buttonText.style.opacity = '0';
        birdContainer.appendChild(buttonText);
        
        document.body.appendChild(birdContainer);

        // Animate bird entrance
        gsap.timeline()
            .from('.bird-container', {
                y: -100,
                opacity: 0,
                duration: 1,
                ease: 'power2.out'
            })
            .to('.bird', {
                scale: 1.2,
                yoyo: true,
                repeat: 2,
                duration: 0.3,
                ease: 'power1.inOut'
            })
            .to('.bird', {
                y: -10,
                yoyo: true,
                repeat: -1,
                duration: 1,
                ease: 'power1.inOut'
            }, '-=0.3')
            .to('.button-text', {
                opacity: 1,
                duration: 0.5,
                delay: 0.5
            });

        // Add hover and click effects
        birdContainer.addEventListener('mouseenter', () => {
            gsap.to('.bird', {
                scale: 1.1,
                duration: 0.3
            });
            gsap.to('.button-text', {
                scale: 1.1,
                duration: 0.3
            });
        });

        birdContainer.addEventListener('mouseleave', () => {
            gsap.to('.bird', {
                scale: 1,
                duration: 0.3
            });
            gsap.to('.button-text', {
                scale: 1,
                duration: 0.3
            });
        });

        birdContainer.addEventListener('click', () => {
            // Animate bird flying away
            gsap.timeline()
                .to('.bird', {
                    scale: 0.8,
                    duration: 0.2
                })
                .to('.bird-container', {
                    x: window.innerWidth,
                    y: -100,
                    rotate: 15,
                    duration: 1,
                    ease: 'power2.in',
                    onComplete: () => {
                        window.location.href = 'ripples.html';
                    }
                });
        });
    }

    handleScroll() {
        // Calculate target progress based on scroll
        this.targetProgress = Math.min(1, window.scrollY / (document.documentElement.scrollHeight - window.innerHeight));
    }

    update() {
        // Smoothly interpolate journey progress
        this.journeyProgress += (this.targetProgress - this.journeyProgress) * 0.05;
        
        // Update camera position (moving up the well)
        this.camera.position.y = -4 + (this.journeyProgress * 18);
        
        // Keep frog following below camera
        this.frog.position.y = this.camera.position.y - 1;
        
        // Update well shader uniforms
        const time = Date.now() * 0.001;
        this.well.material.uniforms.time.value = time;
        this.well.material.uniforms.frogPosition.value.copy(this.frog.position);
        
        // Animate frog glow
        const glowIntensity = 0.5 + Math.sin(time * 2) * 0.1;
        this.frog.material.emissiveIntensity = glowIntensity;
        this.frogLight.intensity = 2 + Math.sin(time * 2) * 0.5;
        this.well.material.uniforms.frogIntensity.value = this.frogLight.intensity;
        
        // Update sky appearance
        const skyProgress = Math.max(0, (this.journeyProgress - 0.5) * 2);
        this.sky.material.opacity = 0.1 + skyProgress * 0.9;
        this.skyGlow.material.opacity = 0.05 + skyProgress * 0.3;

        // Update narrative text
        this.updateMessage(this.journeyProgress);
    }
}

// Initialize the first layer
document.addEventListener('DOMContentLoaded', () => {
    const wellScene = new WellScene('well-scene');
    
    // Fade in the well scene after a short delay
    setTimeout(() => {
        document.getElementById('well-scene').style.opacity = '1';
    }, 500);

    // Handle intro overlay click
    const introOverlay = document.querySelector('.intro-overlay');
    const introText = document.querySelector('.intro-text');
    const scrollInstruction = document.querySelector('.scroll-instruction');
    
    if (introText) {
        introText.addEventListener('click', () => {
            // Fade out the entire overlay
            introOverlay.style.opacity = '0';
            
            // Remove the overlay after fade out
            setTimeout(() => {
                introOverlay.style.display = 'none';
                
                // Show scroll instruction
                scrollInstruction.style.display = 'block';
                // Reset the animation by removing and re-adding the element
                const parent = scrollInstruction.parentNode;
                const clone = scrollInstruction.cloneNode(true);
                parent.removeChild(scrollInstruction);
                parent.appendChild(clone);
            }, 1000);
        });
    }
});
