class NetworkScene {
    constructor() {
        this.init();
        this.createStarField();
        this.createNodes();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000020);
        document.getElementById('network-scene').appendChild(this.renderer.domElement);
        
        this.camera.position.z = 30;

        // Scene state
        this.nodes = [];
        this.selectedNodes = [];
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.drawMode = true;
        this.linePoints = [];
        this.constellation = null;
        this.constellations = [];
        this.connectionCount = 0;
        this.maxConnections = 3;
        this.previewLine = null;

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(10, 10, 10);
        this.scene.add(pointLight);

        // Remove any existing counters first
        const existingCounters = document.querySelectorAll('.constellation-counter, .network-controls');
        existingCounters.forEach(counter => counter.remove());

        // Create UI container
        const controls = document.createElement('div');
        controls.className = 'network-controls';
        controls.innerHTML = `
            <div class="status-filters">
                <button class="active" data-status="all">All</button>
                <button data-status="emerging">Nominees</button>
                <button data-status="active">Active</button>
                <button data-status="veteran">Retired</button>
            </div>
            <div class="constellation-counter">
                <div>Constellations Formed</div>
                <div class="nodes-connected">0/${this.maxConnections}</div>
            </div>
        `;
        document.body.appendChild(controls);

        // Add filter button listeners
        controls.querySelectorAll('.status-filters button').forEach(button => {
            button.addEventListener('click', (e) => {
                // Update button states
                controls.querySelectorAll('.status-filters button').forEach(btn => 
                    btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update node visibility
                const status = button.dataset.status;
                this.nodes.forEach(node => {
                    const shouldShow = status === 'all' || node.userData.status === status;
                    node.material.uniforms.highlight = { value: shouldShow ? 1.0 : 0.2 };
                });
            });
        });
    }

    createStarField() {
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });

        const starVertices = [];
        for (let i = 0; i < 1000; i++) {
            const x = (Math.random() - 0.5) * 100;
            const y = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 50;
            starVertices.push(x, y, z);
        }

        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
    }

    createNodes() {
        const cinematographers = [
            { name: "Rachel Morrison", status: "active", films: 25, awards: 12 },
            { name: "Mandy Walker", status: "active", films: 30, awards: 15 },
            { name: "Ellen Kuras", status: "active", films: 35, awards: 18 },
            { name: "Reed Morano", status: "active", films: 28, awards: 14 },
            { name: "Natasha Braier", status: "active", films: 22, awards: 10 },
            { name: "Charlotte Bruus Christensen", status: "active", films: 20, awards: 8 },
            { name: "Uta Briesewitz", status: "active", films: 26, awards: 11 },
            { name: "Agnès Godard", status: "active", films: 32, awards: 16 },
            { name: "Autumn Durald", status: "emerging", films: 15, awards: 5 },
            { name: "Halyna Hutchins", status: "emerging", films: 12, awards: 3 },
            { name: "Maryse Alberti", status: "veteran", films: 45, awards: 25 },
            { name: "Brianne Murphy", status: "veteran", films: 40, awards: 20 }
        ];

        // Group nodes by status for positioning
        const grouped = cinematographers.reduce((acc, c) => {
            if (!acc[c.status]) acc[c.status] = [];
            acc[c.status].push(c);
            return acc;
        }, {});

        Object.entries(grouped).forEach(([status, group]) => {
            const zOffset = this.getZOffsetForStatus(status);
            const radius = 15;
            
            group.forEach((data, index) => {
                const geometry = new THREE.SphereGeometry(0.8, 32, 32);
                const material = new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0 },
                        color: { value: this.getColorForStatus(status) },
                        hover: { value: 0.0 },
                        selected: { value: 0.0 },
                        highlight: { value: 1.0 }
                    },
                    vertexShader: `
                        varying vec2 vUv;
                        varying vec3 vNormal;
                        void main() {
                            vUv = uv;
                            vNormal = normal;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `,
                    fragmentShader: `
                        uniform float time;
                        uniform vec3 color;
                        uniform float hover;
                        uniform float selected;
                        uniform float highlight;
                        varying vec2 vUv;
                        varying vec3 vNormal;
                        
                        void main() {
                            float pulse = sin(time * 2.0) * 0.15 + 0.85;
                            vec3 finalColor = mix(color, vec3(1.0), hover * 0.3 + selected * 0.5);
                            float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                            float alpha = pulse * (0.6 + hover * 0.4 + selected * 0.4 + fresnel * 0.3) * highlight;
                            gl_FragColor = vec4(finalColor, alpha);
                        }
                    `,
                    transparent: true,
                    side: THREE.DoubleSide
                });

                const node = new THREE.Mesh(geometry, material);
                
                // Position nodes in an arc based on their status group
                const angleStep = (Math.PI * 1.5) / (group.length - 1 || 1);
                const angle = -Math.PI * 0.75 + angleStep * index;
                
                node.position.x = Math.cos(angle) * radius;
                node.position.y = Math.sin(angle) * radius;
                node.position.z = zOffset;
                
                node.userData = { ...data };
                
                this.nodes.push(node);
                this.scene.add(node);
            });
        });
    }

    getZOffsetForStatus(status) {
        const offsets = {
            'emerging': 5,    // Closest to camera
            'active': 0,      // Mid-ground
            'veteran': -5     // Furthest back
        };
        return offsets[status] || 0;
    }

    getColorForStatus(status) {
        const colors = {
            'active': new THREE.Color(0x3498db),    // Blue
            'emerging': new THREE.Color(0x2ecc71),  // Green
            'veteran': new THREE.Color(0xe74c3c)    // Red
        };
        return colors[status] || new THREE.Color(0xffffff);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.nodes);

        // Reset all nodes hover state
        this.nodes.forEach(node => {
            if (node.material.uniforms) {
                node.material.uniforms.hover.value = 0.0;
            }
        });

        if (intersects.length > 0) {
            const node = intersects[0].object;
            if (node.material.uniforms) {
                node.material.uniforms.hover.value = 1.0;
            }
            this.updateTooltip(node, event.clientX, event.clientY);
        } else {
            this.hideTooltip();
        }

        // Update preview line
        if (this.linePoints.length > 0) {
            this.updatePreviewLine(this.mouse);
        }
    }

    updatePreviewLine(mouse) {
        // Create temporary end point for the line
        const vector = new THREE.Vector3(mouse.x, mouse.y, 0);
        vector.unproject(this.camera);
        const dir = vector.sub(this.camera.position).normalize();
        const distance = -this.camera.position.z / dir.z;
        const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));

        // Create or update the preview line
        if (!this.previewLine) {
            const geometry = new THREE.BufferGeometry();
            const material = new THREE.LineBasicMaterial({
                color: 0x3498db,
                transparent: true,
                opacity: 0.4,
                linewidth: 1
            });
            this.previewLine = new THREE.Line(geometry, material);
            this.scene.add(this.previewLine);
        }

        // Update line positions
        const positions = [];
        this.linePoints.forEach(point => {
            positions.push(point.position.x, point.position.y, point.position.z);
        });
        positions.push(pos.x, pos.y, pos.z);

        this.previewLine.geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(positions, 3)
        );
    }

    updateTooltip(node, mouseX, mouseY) {
        const tooltip = document.querySelector('.node-tooltip') || this.createTooltip();
        
        if (!node) {
            tooltip.style.display = 'none';
            return;
        }

        const data = node.userData;
        tooltip.innerHTML = `
            <div class="tooltip-name">${data.name}</div>
            <div class="tooltip-status">${data.status}</div>
            <div class="tooltip-stats">
                Films: ${data.films}<br>
                Awards: ${data.awards}
            </div>
        `;

        const margin = 20;
        tooltip.style.left = `${mouseX + margin}px`;
        tooltip.style.top = `${mouseY + margin}px`;
        tooltip.style.display = 'block';
    }

    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'node-tooltip';
        document.body.appendChild(tooltip);
        return tooltip;
    }

    onClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.nodes);

        if (intersects.length > 0) {
            const node = intersects[0].object;
            
            if (!this.linePoints.includes(node)) {
                node.material.uniforms.selected.value = 1.0;
                this.linePoints.push(node);

                if (this.linePoints.length === 3) {
                    this.createConstellation();
                    this.linePoints = [];
                    
                    // Reset node selection visual state
                    this.nodes.forEach(n => {
                        if (n.material.uniforms) {
                            n.material.uniforms.selected.value = 0.0;
                        }
                    });
                }
            }
        }
    }

    createConstellation() {
        const points = this.linePoints.map(node => node.position);
        
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.2, 8, false);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0xffd700) },
                completed: { value: 0.0 }
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
                uniform vec3 color;
                uniform float completed;
                varying vec2 vUv;
                
                void main() {
                    float glow = sin(time * 2.0 + vUv.x * 10.0) * 0.15 + 0.85;
                    vec3 finalColor = mix(color, vec3(1.0, 1.0, 0.5), completed * 0.5);
                    float alpha = glow * (0.6 + completed * 0.4);
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        const constellation = new THREE.Mesh(tubeGeometry, material);
        this.scene.add(constellation);
        this.constellations.push(constellation);
        this.connectionCount++;

        // Update counter
        const counter = document.querySelector('.nodes-connected');
        if (counter) {
            counter.textContent = `${this.connectionCount}/${this.maxConnections}`;
        }

        // Celebration effect
        gsap.to(material.uniforms.completed, {
            value: 1.0,
            duration: 0.5,
            ease: "power2.out"
        });

        // Remove preview line
        if (this.previewLine) {
            this.scene.remove(this.previewLine);
            this.previewLine = null;
        }

        // Check if we should transition
        if (this.connectionCount >= this.maxConnections) {
            setTimeout(() => this.triggerTransition(), 1000);
        }
    }

    setupEventListeners() {
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('click', this.onClick.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.renderer.render(this.scene, this.camera);
    }

    triggerTransition() {
        // Fade out current scene
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: black;
            opacity: 0;
            transition: opacity 1s ease;
            z-index: 1000;
        `;
        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 100);

        setTimeout(() => {
            window.location.href = 'letters.html';
        }, 1200);
    }
}

// Initialize the scene
document.addEventListener('DOMContentLoaded', () => {
    new NetworkScene();
});
