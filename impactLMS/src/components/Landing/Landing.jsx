import { Link } from 'react-router-dom'; // Add this at the top of Landing.jsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './Landing.css';
function Landing() {
  const typedConsoleRef = useRef(null);
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  // Speed modifier tracking ref to avoid re-triggering effects
  const speedModifierRef = useRef(1.0); 

  useEffect(() => {
    // --- AUTOMATED CONSOLE PRINTS LOGIC ---
    const phrases = [
      "I want to learn Java DSA from scratch...",
      "Generate Full-Stack Web Dev roadmap...",
      "Create UI/UX design master crash module...",
      "Test my skills with Adaptive AI Quiz..."
    ];
    let pIdx = 0; let cIdx = 0; let isDeleting = false;
    let typingTimeout;

    const typeLoop = () => {
      if (!typedConsoleRef.current) return;
      const current = phrases[pIdx];
      
      if (isDeleting) {
        typedConsoleRef.current.textContent = current.substring(0, cIdx - 1);
        cIdx--;
      } else {
        typedConsoleRef.current.textContent = current.substring(0, cIdx + 1);
        cIdx++;
      }

      let speed = isDeleting ? 25 : 65;
      if (!isDeleting && cIdx === current.length) { 
        speed = 2500; 
        isDeleting = true; 
      } else if (isDeleting && cIdx === 0) { 
        isDeleting = false; 
        pIdx = (pIdx + 1) % phrases.length; 
        speed = 400; 
      }
      typingTimeout = setTimeout(typeLoop, speed);
    };
    
    typeLoop();

    // --- THREE.JS CORE ENGINE IMPLEMENTATION ---
    let scene, camera, renderer, particleSystem, quantumRing1, quantumRing2;
    let mouseX = 0, mouseY = 0; let targetX = 0, targetY = 0;
    let animationFrameId;

    const init3DCore = () => {
      if (!canvasRef.current || !stageRef.current) return;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(65, stageRef.current.clientWidth / stageRef.current.clientHeight, 1, 1000);
      camera.position.z = 190;

      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
      renderer.setSize(stageRef.current.clientWidth, stageRef.current.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const count = 2000;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      const cPurple = new THREE.Color('#A78BFA');
      const cBlue = new THREE.Color('#60A5FA');

      for (let i = 0; i < count; i++) {
        const u = Math.random(); const v = Math.random();
        const theta = u * 2 * Math.PI;
        const phi = Math.acos(2 * v - 1);
        const r = 62 + (Math.random() * 16);

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);

        const mix = cPurple.clone().lerp(cBlue, Math.random());
        colors[i * 3] = mix.r; colors[i * 3 + 1] = mix.g; colors[i * 3 + 2] = mix.b;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const pCanvas = document.createElement('canvas');
      pCanvas.width = 16; pCanvas.height = 16;
      const ctx = pCanvas.getContext('2d');
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 16, 16);
      const texture = new THREE.CanvasTexture(pCanvas);

      const mat = new THREE.PointsMaterial({
        size: 3.2, vertexColors: true, transparent: true, opacity: 0.9,
        map: texture, blending: THREE.AdditiveBlending, depthWrite: false
      });

      particleSystem = new THREE.Points(geometry, mat);
      scene.add(particleSystem);

      quantumRing1 = new THREE.Mesh(new THREE.RingGeometry(82, 83, 64), new THREE.MeshBasicMaterial({ color: 0x60A5FA, side: THREE.DoubleSide, transparent: true, opacity: 0.35 }));
      quantumRing1.rotation.x = Math.PI / 2.2;
      scene.add(quantumRing1);

      quantumRing2 = new THREE.Mesh(new THREE.RingGeometry(92, 92.5, 64), new THREE.MeshBasicMaterial({ color: 0xA78BFA, side: THREE.DoubleSide, transparent: true, opacity: 0.25 }));
      quantumRing2.rotation.y = Math.PI / 3.8;
      scene.add(quantumRing2);

      const clock = new THREE.Clock();

      const tick = () => {
        const elapsed = clock.getElapsedTime();
        const pos = particleSystem.geometry.attributes.position.array;
        
        for (let i = 0; i < count; i++) {
          const x = pos[i * 3];
          pos[i * 3 + 2] += Math.sin(elapsed * speedModifierRef.current + (x * 0.04)) * 0.12;
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;

        mouseX += (targetX - mouseX) * 0.08;
        mouseY += (targetY - mouseY) * 0.08;

        particleSystem.rotation.y = elapsed * (0.12 * speedModifierRef.current) + (mouseX * 1.3);
        particleSystem.rotation.x = elapsed * (0.06 * speedModifierRef.current) + (mouseY * 1.3);

        quantumRing1.rotation.z = elapsed * (0.25 * speedModifierRef.current);
        quantumRing2.rotation.z = -elapsed * (0.18 * speedModifierRef.current);

        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(tick);
      };
      tick();
    };

    init3DCore();

    const handleMouseMove = (e) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / canvasRef.current.clientWidth) - 0.5;
      targetY = ((e.clientY - rect.top) / canvasRef.current.clientHeight) - 0.5;
    };

    const handleResize = () => {
      if (!stageRef.current || !camera || !renderer) return;
      camera.aspect = stageRef.current.clientWidth / stageRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(stageRef.current.clientWidth, stageRef.current.clientHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Cleanup logic on unmount
    return () => {
      clearTimeout(typingTimeout);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const setSpeed = (speed) => {
    speedModifierRef.current = speed;
  };

  const commandLog = (sysName) => {
    alert(`✨ System Protocol initialized: ${sysName} successfully parsed.`);
  };

  return (
    <div className="landing-container">
      {/* SAFE HEADER CONSOLE */}
      <header className="landing-header">
        <a href="#" className="logo-section" onClick={(e) => e.preventDefault()}>
          <div className="logo-box">PA</div>
          <div className="logo-title-wrapper">
            <span className="logo-main-text">LuminaLearn</span>
            <span className="logo-sub-text">AI Personalization Engine</span>
          </div>
        </a>
        
     

        <div className="auth-buttons">
          <div className="auth-buttons">
  {/* Link Router to Dynamic Secure Login Portal */}
  <Link to="/login" className="btn-login">Login</Link>
  
  {/* Link Router to Dynamic Onboarding */}
  <Link to="/register" className="btn-register">Register</Link>
</div>
        </div>
      </header>

      {/* ANTI-OVERLAP PROTECTED HERO LAYOUT */}
      <section className="hero-master-grid">
        {/* LOCKED LEFT SIDEBAR */}
        <div className="hero-sidebar left">
          <div className="side-monitor-widget purple-theme">
            <h5>// AI CORE INITIATOR</h5>
            <div>&gt; Loading module: Java_DSA</div>
            <div>&gt; Generating full taxonomy...</div>
            <div>&gt; Status: Compiling sequences</div>
          </div>
          <div className="integrated-badge">
            <i className="fa-solid fa-bolt" style={{ color: '#A78BFA' }}></i> Quantum Roadmaps
          </div>
        </div>

        {/* CENTER COMPUTATION AXIS */}
        <div className="hero-center-axis">
          <h1 className="hero-main-heading">Shaping Your Future with AI Personalized Learning</h1>

          {/* INTERACTIVE AUTO-TYPING TERMINAL DOCK */}
          <div className="interactive-prompt-terminal">
            <div className="terminal-user-tag">User Prompt</div>
            <div className="typing-text-console" ref={typedConsoleRef}></div>
          </div>

          {/* CENTRAL 3D INTERACTIVE THEATER PLATFORM */}
          <div className="stage-3d-container" ref={stageRef}>
            <div className="canvas-core-glow"></div>
            <canvas id="aiAdvancedCanvas" ref={canvasRef}></canvas>
          </div>

          <a href="#" className="btn-watch-demo" onMouseEnter={() => setSpeed(4.5)} onMouseLeave={() => setSpeed(1.0)} onClick={(e) => { e.preventDefault(); commandLog('Hologram Player Node'); }}>
            <i className="fa-solid fa-play"></i> Watch Demo
          </a>
        </div>

        {/* LOCKED RIGHT SIDEBAR */}
        <div className="hero-sidebar right">
          <div className="side-monitor-widget blue-theme">
            <h5>[ANALYTICS FEED]</h5>
            <div>Metric Completions: 92%</div>
            <div>Weakness Point: DFS Graphs</div>
            <div>Injecting Adaptive Modules...</div>
          </div>
          <div className="integrated-badge">
            <i className="fa-solid fa-brain" style={{ color: '#60A5FA' }}></i> Adaptive Matrix
          </div>
        </div>
      </section>

      {/* HIGH-TECH DYNAMIC FEATURES MATRIX SECTION */}
      <section className="features-grid-section" id="features">
        <div className="features-grid">
          <div className="feature-card" onMouseEnter={() => setSpeed(4.5)} onMouseLeave={() => setSpeed(1.0)}>
            <div className="card-icon-box"><i className="fa-solid fa-robot"></i></div>
            <h3>AI Course Generation</h3>
            <p>User sirf prompt de aur complete custom syllabus path auto generate kare.</p>
          </div>

          <div className="feature-card" onMouseEnter={() => setSpeed(4.5)} onMouseLeave={() => setSpeed(1.0)}>
            <div className="card-icon-box"><i className="fa-solid fa-map-signs"></i></div>
            <h3>Personalized Roadmap</h3>
            <p>Beginner se advanced tak structured Day-wise learning system.</p>
          </div>

          <div className="feature-card" onMouseEnter={() => setSpeed(4.5)} onMouseLeave={() => setSpeed(1.0)}>
            <div className="card-icon-box"><i className="fa-solid fa-cubes"></i></div>
            <h3>Automatic Modules</h3>
            <p>Topics ko balanced sub-chapters aur clean sequences me track kare.</p>
          </div>

          <div className="feature-card" onMouseEnter={() => setSpeed(4.5)} onMouseLeave={() => setSpeed(1.0)}>
            <div className="card-icon-box"><i className="fa-solid fa-video"></i></div>
            <h3>Smart Content Curation</h3>
            <p>Handpicked relevant YouTube videos aur documentation cards fetch kare.</p>
          </div>

          <div className="feature-card" onMouseEnter={() => setSpeed(4.5)} onMouseLeave={() => setSpeed(1.0)}>
            <div className="card-icon-box"><i className="fa-solid fa-brain"></i></div>
            <h3>AI Quiz Generator</h3>
            <p>Granular performance analytics check karne ke liye live dynamic MCQs.</p>
          </div>

          <div className="feature-card" onMouseEnter={() => setSpeed(4.5)} onMouseLeave={() => setSpeed(1.0)}>
            <div className="card-icon-box"><i className="fa-solid fa-chart-pie"></i></div>
            <h3>Progress Tracking</h3>
            <p>Completion index metrics aur deep score analysis dashboard framework.</p>
          </div>

          <div className="feature-card" onMouseEnter={() => setSpeed(4.5)} onMouseLeave={() => setSpeed(1.0)}>
            <div className="card-icon-box"><i className="fa-solid fa-chalkboard-user"></i></div>
            <h3>Mock Interview</h3>
            <p>Real-time AI simulated setup for Core Technical and HR placement rounds.</p>
          </div>

          <div className="feature-card" onMouseEnter={() => setSpeed(4.5)} onMouseLeave={() => setSpeed(1.0)}>
            <div className="card-icon-box"><i className="fa-solid fa-sliders"></i></div>
            <h3>Adaptive Learning</h3>
            <p>Aapke weak concepts catch karke auto recovery recommendations de.</p>
          </div>
        </div>
      </section>

      {/* USER ROLE CONTROLLER OVERLAY */}
      <div className="system-roles-footer">
        <div className="roles-container">
          <span><strong>System Roles Asset:</strong> Student | Mentor/Teacher | Admin</span>
          <div className="role-avatars">
            <div className="role-img">S</div>
            <div className="role-img">M</div>
            <div className="role-img">A</div>
          </div>
        </div>
      </div>

      {/* MAIN CTA FOOTER TRACE LAUNCHER */}
      <div className="cta-bottom-bar">
        <button className="btn-giant-start" onMouseEnter={() => setSpeed(4.5)} onMouseLeave={() => setSpeed(1.0)} onClick={() => commandLog('AI Core Optimization Compiler Deployment')}>
          Deploy AI Learning Architecture <i className="fa-solid fa-arrow-right-long"></i>
        </button>
      </div>
    </div>
  );
}

export default Landing;