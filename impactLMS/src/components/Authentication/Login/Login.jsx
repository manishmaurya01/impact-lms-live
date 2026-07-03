import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const canvasRef = useRef(null);
  const stageRef = useRef(null);

  // 🚀 CRITICAL RE-ENGINEERING 1: AUTO-REDIRECT IF SESSION ACTIVE
  useEffect(() => {
    const verifiedSessionToken = localStorage.getItem('token');
    if (verifiedSessionToken) {
      console.log("[AUTH_GUARD] Active identity token found. Redirecting straight to terminal...");
      navigate('/dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    // --- THREE.JS LIVE CYBER QUARTZ KINETIC CORE ENGINE ---
    let scene, camera, renderer;
    let coreCrystal, orbitalRing1, orbitalRing2, stardustParticles;
    let animationFrameId;
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    const initPremium3D = () => {
      if (!canvasRef.current || !stageRef.current) return;

      scene = new THREE.Scene();
      
      camera = new THREE.PerspectiveCamera(50, stageRef.current.clientWidth / stageRef.current.clientHeight, 1, 1000);
      camera.position.z = 140;

      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
      renderer.setSize(stageRef.current.clientWidth, stageRef.current.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
      scene.add(ambientLight);

      const topSpecularLight = new THREE.DirectionalLight(0xffffff, 2.5);
      topSpecularLight.position.set(0, 100, 50);
      scene.add(topSpecularLight);

      const purpleGlowLight = new THREE.PointLight(0x8B5CF6, 3, 250);
      purpleGlowLight.position.set(60, 40, 40);
      scene.add(purpleGlowLight);

      const cyanGlowLight = new THREE.PointLight(0x06B6D4, 3, 250);
      cyanGlowLight.position.set(-60, -40, 40);
      scene.add(cyanGlowLight);

      const crystalGeo = new THREE.OctahedronGeometry(22, 0);
      const crystalMat = new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        metalness: 0.9,
        roughness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transmission: 0.6, 
        ior: 2.4, 
        thickness: 5,
        flatShading: true 
      });

      coreCrystal = new THREE.Mesh(crystalGeo, crystalMat);
      scene.add(coreCrystal);

      const ringGeo1 = new THREE.TorusGeometry(34, 0.4, 8, 100);
      const ringMat1 = new THREE.MeshStandardMaterial({
        color: 0x06B6D4,
        emissive: 0x06B6D4,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.8
      });
      orbitalRing1 = new THREE.Mesh(ringGeo1, ringMat1);
      orbitalRing1.rotation.x = Math.PI / 3;
      scene.add(orbitalRing1);

      const ringGeo2 = new THREE.TorusGeometry(38, 0.3, 8, 100);
      const ringMat2 = new THREE.MeshStandardMaterial({
        color: 0x8B5CF6,
        emissive: 0x8B5CF6,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.6
      });
      orbitalRing2 = new THREE.Mesh(ringGeo2, ringMat2);
      orbitalRing2.rotation.x = -Math.PI / 4;
      orbitalRing2.rotation.y = Math.PI / 4;
      scene.add(orbitalRing2);

      const starsCount = 250;
      const starsGeo = new THREE.BufferGeometry();
      const starsPositions = new Float32Array(starsCount * 3);

      for (let i = 0; i < starsCount * 3; i++) {
        starsPositions[i] = (Math.random() - 0.5) * 160;
      }
      starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));

      const dustCanvas = document.createElement('canvas');
      dustCanvas.width = 16; dustCanvas.height = 16;
      const dCtx = dustCanvas.getContext('2d');
      const dGrad = dCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
      dGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      dGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      dCtx.fillStyle = dGrad; dCtx.fillRect(0, 0, 16, 16);

      const dustMaterial = new THREE.PointsMaterial({
        size: 1.8,
        map: new THREE.CanvasTexture(dustCanvas),
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      stardustParticles = new THREE.Points(starsGeo, dustMaterial);
      scene.add(stardustParticles);

      const clock = new THREE.Clock();

      const renderLoop = () => {
        const time = clock.getElapsedTime();

        if (coreCrystal) {
          coreCrystal.rotation.y = time * 0.3;
          coreCrystal.position.y = Math.sin(time * 1.5) * 2.5; 
        }

        if (orbitalRing1) orbitalRing1.rotation.z = time * 0.4;
        if (orbitalRing2) orbitalRing2.rotation.z = -time * 0.25;
        if (stardustParticles) stardustParticles.rotation.y = time * 0.02;

        mouseX += (targetX - mouseX) * 0.06;
        mouseY += (targetY - mouseY) * 0.06;

        scene.rotation.y = mouseX * 0.6;
        scene.rotation.x = mouseY * 0.6;

        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(renderLoop);
      };
      renderLoop();
    };

    initPremium3D();

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

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("[LOGIN_SUBMIT] Dispatching session encryption tokens...");
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log("[LOGIN_SUCCESS] Synchronization resolved. Writing session payload tokens.");
        
        // 🚀 CRITICAL FIXED LINK: Storing token explicitly inside "token" matching intake expectations
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        alert("🔓 Handshake Successful! Redirection sequence active.");
        navigate('/dashboard');
      } else {
        alert(`❌ Error: ${data.message || 'Authentication rejected.'}`);
      }
    } catch (err) {
      console.error("Connection failed:", err);
      alert("Backend Server not running!");
    }
  };

  return (
    <div className="lms-unified-center-viewport">
      <div className="bg-radial-blur-shades"></div>
      <div className="bg-canvas-dot-matrix"></div>

      <div className="master-symmetric-dashboard-hub">
        
        {/* LEFT PANEL MODULE */}
        <div className="dashboard-panel-half left-form-panel">
          <div className="panel-sheen-liner"></div>
          
          <div className="auth-panel-header">
            <h1>Welcome back</h1>
            <p>Reset your focus and step back into your personal knowledge terminal. Your tailored roadmap is active and waiting.</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="capsule-inputs-mesh-layout">
            <div className="capsule-field-container">
              <i className="fa-solid fa-envelope field-leading-icon"></i>
              <input 
                type="email" 
                name="email" 
                value={loginData.email} 
                onChange={handleChange} 
                placeholder="Enter your email address" 
                required 
              />
            </div>

            <div className="capsule-field-container">
              <i className="fa-solid fa-lock field-leading-icon"></i>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                value={loginData.password} 
                onChange={handleChange} 
                placeholder="Enter your password" 
                required 
              />
              <button 
                type="button" 
                className="password-toggle-reticle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>

            <button type="submit" className="btn-submit-capsule-pill">
              Log in
            </button>
          </form>

          <div className="social-provider-oauth-row">
            <button type="button" className="oauth-pill-capsule">
              <i className="fa-brands fa-facebook-f fb-brand-icon"></i> Facebook
            </button>
            <button type="button" className="oauth-pill-capsule">
              <i className="fa-brands fa-google google-brand-icon"></i> Google
            </button>
            <button type="button" className="oauth-pill-capsule">
              <i className="fa-brands fa-apple apple-brand-icon"></i> Apple
            </button>
          </div>

          <div className="auth-footer-view-switcher">
            Didn't have an account? <Link to="/register" className="auth-blue-redirect-anchor">Sign up</Link>
          </div>
        </div>

        {/* RIGHT CRYSTAL GRAPHICS PANEL */}
        <div className="dashboard-panel-half right-three-panel">
          <div className="panel-sheen-liner"></div>
          
          <div className="project-blueprint-info">
            <div className="brand-meta-badge">
              <span className="brand-badge-dot"></span> Core Engine Active
            </div>
            <h2>The Intelligence Engine</h2>
            <p>Where complex syllabi dissolve into clean, custom daily learning streaks. Powered by cognitive AI curation models designed for infinite memory retention.</p>
          </div>

          <div className="threejs-embedded-stage" ref={stageRef}>
            <canvas id="quantum3DCanvas" ref={canvasRef}></canvas>
          </div>
          
          <div className="panel-status-ribbon-strip">
            <span><i className="fa-solid fa-gem network-cyan"></i> GRAPHICS_ENGINE: OBSIDIAN_GLASS</span>
            <span><i className="fa-solid fa-bolt telemetry-purple"></i> FREQUENCY: ACTIVE</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;