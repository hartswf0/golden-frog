class RipplesScene {
    constructor() {
        this.ripples = [];
        this.articles = [
            {
                headline: "Breaking Barriers in Cinematography",
                sentiment: "positive",
                mentions: 2,
                publication: "Film Quarterly",
                date: "2024-01-15",
                summary: "Profile of emerging women cinematographers breaking new ground in the industry."
            },
            {
                headline: "Award Season Nominations Announced",
                sentiment: "neutral",
                mentions: 1,
                publication: "Variety",
                date: "2024-02-01",
                summary: "Annual awards show nominations include one female cinematographer among twenty nominees."
            },
            {
                headline: "Industry Statistics Report 2024",
                sentiment: "negative",
                mentions: 0,
                publication: "Hollywood Reporter",
                date: "2024-02-15",
                summary: "Latest industry report shows minimal progress in cinematography gender diversity."
            }
        ];
        this.init();
        this.animate();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000020);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 30, 30);
        this.camera.lookAt(0, 0, 0);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('ripples-scene').appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        // Create water surface with noise
        this.createWaterSurface();
        
        // Create info display
        this.createInfoDisplay();

        // Raycaster for interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Create initial ripples
        this.createRipples();

        // Add title and question
        const title = document.createElement('h1');
        title.className = 'title';
        title.textContent = 'Media Coverage';
        document.body.appendChild(title);

        const question = document.createElement('div');
        question.className = 'question';
        question.textContent = 'How do media narratives shape our perception?';
        document.body.appendChild(question);

        // Fade in title and question
        gsap.from(title, {
            opacity: 0,
            y: -50,
            duration: 1,
            ease: "power2.out"
        });

        gsap.from(question, {
            opacity: 0,
            y: 50,
            duration: 1,
            delay: 0.5,
            ease: "power2.out"
        });

        // Event listeners
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('click', this.onClick.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Add click handler for next button
        const nextButton = document.querySelector('.next-layer-btn');
        nextButton.addEventListener('click', () => {
            // Fade out scene
            gsap.to(this.renderer.domElement, {
                opacity: 0,
                duration: 1,
                ease: "power2.in",
                onComplete: () => {
                    window.location.href = 'instagram.html';
                }
            });

            // Fade out button
            gsap.to(nextButton, {
                opacity: 0,
                y: 30,
                duration: 1,
                ease: "power2.in"
            });
        });
    }

    createWaterSurface() {
        const geometry = new THREE.PlaneGeometry(60, 60, 128, 128);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                noiseScale: { value: 5.0 },
                noiseStrength: { value: 0.2 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float time;
                uniform float noiseScale;
                uniform float noiseStrength;

                //	Simplex 3D Noise 
                //	by Ian McEwan, Ashima Arts
                vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
                vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
                float snoise(vec3 v){ 
                    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
                    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

                    vec3 i  = floor(v + dot(v, C.yyy) );
                    vec3 x0 =   v - i + dot(i, C.xxx) ;
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min( g.xyz, l.zxy );
                    vec3 i2 = max( g.xyz, l.zxy );
                    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
                    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
                    vec3 x3 = x0 - 1. + 3.0 * C.xxx;
                    i = mod(i, 289.0 ); 
                    vec4 p = permute( permute( permute( 
                                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                            + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                    float n_ = 1.0/7.0;
                    vec3  ns = n_ * D.wyz - D.xzx;
                    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_ );
                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    vec4 b0 = vec4( x.xy, y.xy );
                    vec4 b1 = vec4( x.zw, y.zw );
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                    vec3 p0 = vec3(a0.xy,h.x);
                    vec3 p1 = vec3(a0.zw,h.y);
                    vec3 p2 = vec3(a1.xy,h.z);
                    vec3 p3 = vec3(a1.zw,h.w);
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                }

                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    float noise = snoise(vec3(pos.x * noiseScale, pos.z * noiseScale, time * 0.2)) * noiseStrength;
                    pos.y = noise;
                    vPosition = pos;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float time;

                void main() {
                    vec3 baseColor = vec3(0.1, 0.2, 0.3);
                    vec3 rippleColor = vec3(0.2, 0.4, 0.6);
                    
                    float depth = smoothstep(-0.2, 0.2, vPosition.y);
                    vec3 finalColor = mix(baseColor, rippleColor, depth);
                    
                    gl_FragColor = vec4(finalColor, 0.9);
                }
            `,
            transparent: true
        });

        this.waterSurface = new THREE.Mesh(geometry, material);
        this.waterSurface.rotation.x = -Math.PI / 2;
        this.scene.add(this.waterSurface);
    }

    createInfoDisplay() {
        const legend = document.createElement('div');
        legend.className = 'legend';
        legend.innerHTML = `
            <div class="legend-item">
                <span class="legend-color" style="background: #2ecc71"></span>
                <span>Positive Coverage</span>
            </div>
            <div class="legend-item">
                <span class="legend-color" style="background: #f1c40f"></span>
                <span>Neutral Coverage</span>
            </div>
            <div class="legend-item">
                <span class="legend-color" style="background: #e74c3c"></span>
                <span>Negative Coverage</span>
            </div>
            <div class="progress">
                <span class="progress-text">0/${this.articles.length} Ripples Explored</span>
                <div class="progress-bar"></div>
            </div>
        `;
        document.body.appendChild(legend);

        // Create info panel
        const infoPanel = document.createElement('div');
        infoPanel.className = 'info-panel hidden';
        document.body.appendChild(infoPanel);

        // Create hidden next button
        const nextButton = document.createElement('button');
        nextButton.className = 'next-layer-btn hidden';
        nextButton.textContent = 'Explore Instagram Voices';
        document.body.appendChild(nextButton);
    }

    updateProgress() {
        const explored = this.ripples.filter(group => group.userData.explored).length;
        const total = this.ripples.length;
        
        const progressText = document.querySelector('.progress-text');
        progressText.textContent = `${explored}/${total} Ripples Explored`;
        
        const progressBar = document.querySelector('.progress-bar');
        progressBar.style.width = `${(explored / total) * 100}%`;

        if (explored === total) {
            // Show next button with unlock animation
            const nextButton = document.querySelector('.next-layer-btn');
            nextButton.classList.remove('hidden');
            gsap.fromTo(nextButton,
                { opacity: 0, scale: 0.8 },
                { opacity: 1, scale: 1, duration: 1, ease: "elastic.out(1, 0.5)" }
            );
            
            // Add unlock effect
            const unlockFlash = document.createElement('div');
            unlockFlash.className = 'unlock-flash';
            document.body.appendChild(unlockFlash);
            
            gsap.to(unlockFlash, {
                opacity: 0,
                duration: 1,
                onComplete: () => unlockFlash.remove()
            });
        }
    }

    showRippleInfo(article, position) {
        const infoPanel = document.querySelector('.info-panel');
        infoPanel.innerHTML = `
            <h3>${article.headline}</h3>
            <p class="publication">${article.publication} - ${article.date}</p>
            <p class="summary">${article.summary}</p>
        `;
        
        // Position panel near the ripple but ensure it stays in view
        const vector = position.clone();
        vector.project(this.camera);
        
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
        
        infoPanel.style.left = `${Math.min(Math.max(x, 20), window.innerWidth - 320)}px`;
        infoPanel.style.top = `${Math.min(Math.max(y - 100, 20), window.innerHeight - 200)}px`;
        
        infoPanel.classList.remove('hidden');
    }

    hideRippleInfo() {
        const infoPanel = document.querySelector('.info-panel');
        infoPanel.classList.add('hidden');
    }

    createRipples() {
        this.articles.forEach((article, index) => {
            const rippleGroup = new THREE.Group();
            
            // Create concentric circles
            const numCircles = 3;
            for(let i = 0; i < numCircles; i++) {
                const radius = 1.5 + i * 0.5;
                const geometry = new THREE.RingGeometry(radius - 0.3, radius, 32);
                const color = article.sentiment === 'positive' ? 0x2ecc71 : 
                             article.sentiment === 'negative' ? 0xe74c3c : 0xf1c40f;
                
                const material = new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.5 - (i * 0.1),
                    side: THREE.DoubleSide
                });

                const ring = new THREE.Mesh(geometry, material);
                ring.rotation.x = -Math.PI / 2;
                rippleGroup.add(ring);

                // Add continuous pulse animation
                gsap.to(ring.scale, {
                    x: 1.2,
                    y: 1.2,
                    duration: 1.5 + i * 0.2,
                    ease: "power1.inOut",
                    yoyo: true,
                    repeat: -1
                });

                gsap.to(ring.material, {
                    opacity: (0.7 - i * 0.1),
                    duration: 1.5 + i * 0.2,
                    ease: "power1.inOut",
                    yoyo: true,
                    repeat: -1
                });
            }

            // Position the ripple group
            const angle = (index / this.articles.length) * Math.PI * 2;
            const radius = 15;
            rippleGroup.position.set(
                Math.cos(angle) * radius,
                0.1,
                Math.sin(angle) * radius
            );

            // Store metadata
            rippleGroup.userData = {
                article: article,
                originalScale: 1,
                phase: Math.random() * Math.PI * 2,
                explored: false
            };

            this.scene.add(rippleGroup);
            this.ripples.push(rippleGroup);
        });
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(
            this.ripples.map(group => group.children).flat()
        );

        if (intersects.length > 0) {
            const rippleGroup = intersects[0].object.parent;
            this.showRippleInfo(rippleGroup.userData.article, rippleGroup.position);
        } else {
            this.hideRippleInfo();
        }
    }

    onClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(
            this.ripples.map(group => group.children).flat()
        );

        if (intersects.length > 0) {
            const rippleGroup = intersects[0].object.parent;
            // Add a more generous click radius
            const clickBox = new THREE.Box3().setFromObject(rippleGroup);
            clickBox.expandByScalar(1.5); // Makes click detection area 1.5x larger
            
            const clickPoint = this.raycaster.ray.at(intersects[0].distance);
            if (clickBox.containsPoint(clickPoint)) {
                const color = rippleGroup.children[0].material.color;
                
                // Create expanding rings
                this.createExpandingRings(rippleGroup.position, color);

                // Animate existing rings with more dramatic effect
                rippleGroup.children.forEach((ring, i) => {
                    // Scale up
                    gsap.to(ring.scale, {
                        x: 1.8,
                        y: 1.8,
                        z: 1,
                        duration: 0.4,
                        ease: "power2.out",
                        yoyo: true,
                        repeat: 1
                    });

                    // Opacity pulse
                    gsap.to(ring.material, {
                        opacity: 1,
                        duration: 0.2,
                        yoyo: true,
                        repeat: 1,
                        delay: i * 0.05
                    });

                    // Rotation pulse
                    gsap.to(ring.rotation, {
                        z: ring.rotation.z + Math.PI * 0.25,
                        duration: 0.4,
                        ease: "power2.inOut",
                        yoyo: true,
                        repeat: 1
                    });
                });

                // Mark ripple as explored
                rippleGroup.userData.explored = true;

                // Update progress
                this.updateProgress();

                // If all ripples are explored, fade out title and question
                const allExplored = this.ripples.every(group => group.userData.explored);
                if (allExplored) {
                    const title = document.querySelector('.title');
                    const question = document.querySelector('.question');

                    gsap.to([title, question], {
                        opacity: 0,
                        y: -30,
                        duration: 1,
                        ease: "power2.in",
                        onComplete: () => {
                            title.remove();
                            question.remove();
                        }
                    });
                }
            }
        }
    }

    createExpandingRings(position, color) {
        const numRings = 8;
        const rings = [];
        const maxScale = 40;
        
        for(let i = 0; i < numRings; i++) {
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(0.1, 0.15, 32),
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.8,
                    side: THREE.DoubleSide
                })
            );
            
            ring.position.copy(position);
            ring.position.y += 0.05;
            ring.rotation.x = -Math.PI / 2;
            this.scene.add(ring);
            rings.push(ring);

            gsap.to(ring.scale, {
                x: maxScale,
                y: maxScale,
                z: 1,
                duration: 2.5,
                delay: i * 0.15,
                ease: "power2.out"
            });

            gsap.to(ring.material, {
                opacity: 0,
                duration: 2.5,
                delay: i * 0.15,
                ease: "power2.out",
                onComplete: () => {
                    if (i === numRings - 1) {
                        rings.forEach(r => {
                            this.scene.remove(r);
                            r.geometry.dispose();
                            r.material.dispose();
                        });
                    }
                }
            });
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const time = Date.now() * 0.001;
        
        // Animate water surface
        this.waterSurface.material.uniforms.time.value = time;

        // Animate ripples
        this.ripples.forEach(group => {
            const phase = group.userData.phase;
            group.position.y = 0.1 + Math.sin(time + phase) * 0.1;
            
            // Rotate rings in opposite directions
            group.children.forEach((ring, i) => {
                ring.rotation.z = (time + i * 0.2) * (i % 2 ? 1 : -1);
            });
        });

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the scene
new RipplesScene();
