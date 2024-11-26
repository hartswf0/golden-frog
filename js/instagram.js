class InstagramScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000020); // Match ripples background
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.bubbles = [];
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.clock = new THREE.Clock();
        
        // Track popped negative sentiment bubbles
        this.poppedNegativeBubbles = 0;
        this.requiredNegativePops = 5; // Number of negative bubbles to pop

        // Sample Instagram posts with engagement metrics
        this.posts = [
            {
                content: "Celebrating the unsung heroes of cinematography.",
                sentiment: "positive",
                likes: 420,
                shares: 32,
                date: "2024-11-18",
                author: "@cinemainsider"
            },
            {
                content: "Why so few women in cinematography?",
                sentiment: "negative",
                likes: 3400,
                shares: 1100,
                date: "2024-11-19",
                author: "@filmequity"
            },
            {
                content: "The future is bright for female directors and cinematographers!",
                sentiment: "positive",
                likes: 1200,
                shares: 300,
                date: "2024-11-20",
                author: "@womeninfilm"
            },
            {
                content: "Still waiting for an inclusive awards season in 2024.",
                sentiment: "negative",
                likes: 2900,
                shares: 500,
                date: "2024-11-21",
                author: "@diversitymatters"
            },
            {
                content: "Shoutout to all the women behind the camera this year!",
                sentiment: "positive",
                likes: 620,
                shares: 95,
                date: "2024-11-22",
                author: "@filmcrew"
            },
            {
                content: "Do women in cinematography still face barriers? The numbers say yes.",
                sentiment: "neutral",
                likes: 3000,
                shares: 1000,
                date: "2024-11-23",
                author: "@industrywatch"
            },
            {
                content: "Another year, another male-dominated awards show.",
                sentiment: "negative",
                likes: 4200,
                shares: 2300,
                date: "2024-11-24",
                author: "@awardsobserver"
            },
            {
                content: "Support diversity behind the camera in 2025!",
                sentiment: "positive",
                likes: 800,
                shares: 125,
                date: "2024-11-25",
                author: "@diversityfilm"
            },
            {
                content: "These female cinematographers are breaking the mold.",
                sentiment: "positive",
                likes: 1750,
                shares: 450,
                date: "2024-11-26",
                author: "@cinematalent"
            },
            {
                content: "Disappointed by the lack of diversity in this year's nominees.",
                sentiment: "negative",
                likes: 5000,
                shares: 3200,
                date: "2024-11-27",
                author: "@filmcritic"
            }
        ];

        this.init();
        this.animate();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('instagram-scene').appendChild(this.renderer.domElement);

        // Position camera
        this.camera.position.z = 50;

        // Add progress counter for negative bubbles
        const counter = document.createElement('div');
        counter.className = 'bubble-counter';
        counter.innerHTML = `
            <span class="count">0</span>/<span class="total">${this.requiredNegativePops}</span>
            <div class="counter-label">Barriers Broken</div>
        `;
        document.body.appendChild(counter);

        // Create hover tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'bubble-tooltip';
        document.body.appendChild(tooltip);
        this.tooltip = tooltip;

        // Event listeners
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('click', this.onClick.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Create initial bubbles
        this.createInitialBubbles();
    }

    getSentimentColor(sentiment) {
        switch(sentiment) {
            case 'positive':
                return new THREE.Color(0x2ecc71).multiplyScalar(1.5); // Lighter green
            case 'negative':
                return new THREE.Color(0xe74c3c).multiplyScalar(1.5); // Lighter red
            default:
                return new THREE.Color(0xf1c40f).multiplyScalar(1.5); // Lighter yellow
        }
    }

    createBubble(post) {
        // Size based on likes (normalized)
        const maxLikes = Math.max(...this.posts.map(p => p.likes));
        const size = (post.likes / maxLikes) * 3 + 1;

        // Create bubble geometry
        const geometry = new THREE.SphereGeometry(size, 32, 32);
        
        // Create material based on sentiment
        const color = this.getSentimentColor(post.sentiment);
        const material = new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: 0.4,
            shininess: 100,
            specular: new THREE.Color(0xffffff)
        });

        const bubble = new THREE.Mesh(geometry, material);

        // Random position within bounds
        bubble.position.x = (Math.random() - 0.5) * 40;
        bubble.position.y = (Math.random() - 0.5) * 30;
        bubble.position.z = (Math.random() - 0.5) * 30;

        // Very slow, calm movement
        bubble.userData = {
            post: post,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.02, // Slower horizontal
                (Math.random() - 0.5) * 0.02, // Slower vertical
                (Math.random() - 0.5) * 0.02  // Slower depth
            ),
            originalScale: size,
            popped: false
        };

        this.scene.add(bubble);
        this.bubbles.push(bubble);
    }

    createInitialBubbles() {
        // Create ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Create point light for shine effect
        const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(10, 10, 10);
        this.scene.add(pointLight);

        // Create bubbles
        this.posts.forEach(post => {
            this.createBubble(post);
        });
    }

    createBurstParticles(position, color) {
        const particleCount = 20;
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const speed = 0.2 + Math.random() * 0.3;

            velocities.push(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed,
                Math.cos(phi) * speed
            );
            vertices.push(position.x, position.y, position.z);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        
        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.2,
            transparent: true,
            opacity: 0.8
        });

        const particles = new THREE.Points(geometry, material);
        particles.userData = { velocities, age: 0 };
        this.scene.add(particles);

        return particles;
    }

    updateBurstParticles(particles, deltaTime) {
        particles.userData.age += deltaTime;

        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.userData.velocities;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i] * deltaTime * 20;
            positions[i + 1] += velocities[i + 1] * deltaTime * 20;
            positions[i + 2] += velocities[i + 2] * deltaTime * 20;
        }

        particles.geometry.attributes.position.needsUpdate = true;
        particles.material.opacity = Math.max(0, 1 - particles.userData.age * 2);

        if (particles.userData.age > 0.5) {
            this.scene.remove(particles);
            particles.geometry.dispose();
            particles.material.dispose();
            return false;
        }
        return true;
    }

    updateTooltip(bubble, mouseX, mouseY) {
        if (!bubble) {
            this.tooltip.style.display = 'none';
            return;
        }

        const post = bubble.userData.post;
        this.tooltip.innerHTML = `
            <div class="tooltip-content ${post.sentiment}">
                <div class="tooltip-author">${post.author}</div>
                <div class="tooltip-text">${post.content}</div>
                <div class="tooltip-stats">
                    <span>❤️ ${post.likes.toLocaleString()}</span>
                    <span>🔄 ${post.shares.toLocaleString()}</span>
                    <span>📅 ${post.date}</span>
                </div>
            </div>
        `;

        // Position tooltip near the mouse but ensure it stays within viewport
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const margin = 20;
        
        let left = mouseX + margin;
        let top = mouseY + margin;

        // Adjust if tooltip would go outside viewport
        if (left + tooltipRect.width > window.innerWidth) {
            left = mouseX - tooltipRect.width - margin;
        }
        if (top + tooltipRect.height > window.innerHeight) {
            top = mouseY - tooltipRect.height - margin;
        }

        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.display = 'block';
    }

    showModal(post) {
        const modal = document.querySelector('.post-modal');
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${post.author}</h3>
                <p>${post.content}</p>
                <div class="post-stats">
                    <span>❤️ ${post.likes.toLocaleString()}</span>
                    <span>🔄 ${post.shares.toLocaleString()}</span>
                    <span>📅 ${post.date}</span>
                </div>
            </div>
        `;
        modal.classList.add('visible');
        
        setTimeout(() => {
            modal.classList.remove('visible');
        }, 3000);
    }

    onClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.bubbles);

        if (intersects.length > 0) {
            const bubble = intersects[0].object;
            
            if (!bubble.userData.popped) {
                bubble.userData.popped = true;
                
                // Create burst effect
                const particles = this.createBurstParticles(
                    bubble.position.clone(),
                    bubble.material.color
                );

                // Track negative sentiment bubbles
                if (bubble.userData.post.sentiment === 'negative') {
                    this.poppedNegativeBubbles++;
                    document.querySelector('.bubble-counter .count').textContent = 
                        this.poppedNegativeBubbles;

                    if (this.poppedNegativeBubbles >= this.requiredNegativePops) {
                        this.showNextLayerButton();
                    }
                }

                // Bubble pop animation
                gsap.to(bubble.scale, {
                    x: bubble.userData.originalScale * 1.5,
                    y: bubble.userData.originalScale * 1.5,
                    z: bubble.userData.originalScale * 1.5,
                    duration: 0.2,
                    ease: "power2.out",
                    onComplete: () => {
                        gsap.to(bubble.scale, {
                            x: 0,
                            y: 0,
                            z: 0,
                            duration: 0.2,
                            ease: "power2.in",
                            onComplete: () => {
                                this.scene.remove(bubble);
                                this.bubbles = this.bubbles.filter(b => b !== bubble);
                                bubble.geometry.dispose();
                                bubble.material.dispose();
                                
                                // Create a new bubble to maintain the scene
                                const randomPost = this.posts[Math.floor(Math.random() * this.posts.length)];
                                this.createBubble(randomPost);
                            }
                        });
                    }
                });

                this.showModal(bubble.userData.post);
            }
        }
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Raycast to find intersected bubble
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.bubbles);

        // Update tooltip
        const intersectedBubble = intersects.length > 0 ? intersects[0].object : null;
        this.updateTooltip(intersectedBubble, event.clientX, event.clientY);

        // Highlight intersected bubble
        this.bubbles.forEach(bubble => {
            if (!bubble.userData.popped) {
                if (bubble === intersectedBubble) {
                    bubble.material.opacity = 0.8;
                } else {
                    bubble.material.opacity = 0.4;
                }
            }
        });
    }

    showNextLayerButton() {
        const nextButton = document.createElement('button');
        nextButton.className = 'next-layer-btn';
        nextButton.textContent = 'Explore Network Constellations';
        nextButton.title = 'Discover the interconnected network of cinematographers';
        document.body.appendChild(nextButton);

        // Constellation-like sparkle animation
        gsap.fromTo(nextButton,
            { 
                opacity: 0, 
                scale: 0.8,
                filter: 'brightness(1) blur(0px)'
            },
            { 
                opacity: 1, 
                scale: 1, 
                duration: 1.5,
                ease: "elastic.out(1, 0.5)",
                onComplete: () => {
                    // Add subtle glow animation
                    gsap.to(nextButton, {
                        filter: 'brightness(1.2) blur(1px)',
                        duration: 1,
                        repeat: -1,
                        yoyo: true,
                        ease: "sine.inOut"
                    });
                }
            }
        );

        nextButton.addEventListener('click', () => {
            // Constellation-like fade out
            gsap.to([this.renderer.domElement, nextButton], {
                opacity: 0,
                scale: 1.2,
                filter: 'brightness(1.5) blur(3px)',
                duration: 1.5,
                ease: "power2.inOut",
                onComplete: () => {
                    window.location.href = 'network.html';
                }
            });
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const deltaTime = this.clock.getDelta();
        const time = Date.now() * 0.001;

        // Update bubble positions with fluid motion
        this.bubbles.forEach(bubble => {
            if (!bubble.userData.popped) {
                // Add subtle sine wave motion
                bubble.position.x += Math.sin(time * 0.5 + bubble.position.y) * 0.01;
                bubble.position.y += Math.cos(time * 0.5 + bubble.position.x) * 0.01;
                
                // Apply base velocity
                bubble.position.x += bubble.userData.velocity.x;
                bubble.position.y += bubble.userData.velocity.y;
                bubble.position.z += bubble.userData.velocity.z;

                // Boundary check and bounce
                const bounds = { x: 20, y: 15, z: 15 };
                ['x', 'y', 'z'].forEach(axis => {
                    if (Math.abs(bubble.position[axis]) > bounds[axis]) {
                        bubble.position[axis] = Math.sign(bubble.position[axis]) * bounds[axis];
                        bubble.userData.velocity[axis] *= -1;
                    }
                });

                // Gentle rotation
                bubble.rotation.x += deltaTime * 0.1;
                bubble.rotation.y += deltaTime * 0.1;
            }
        });

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the scene
window.addEventListener('load', () => {
    new InstagramScene();
});
