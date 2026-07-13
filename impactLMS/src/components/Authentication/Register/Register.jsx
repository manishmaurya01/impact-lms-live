import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import './Register.css';

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Student',
    domain: 'Programming',
    commitment: '1 Hour',
    experience: 'Beginner',
    learningStyle: 'Videos'
  });

  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const googleClientRef = useRef(null); // Ref to store the token client instance

  // --- GOOGLE OAUTH HANDSHAKE (CUSTOM POPUP FLOW) ---
  useEffect(() => {
    /* global google */
    const handleGoogleSignInResponse = async (tokenResponse) => {
      // Jab user Google popup me login kar lega, hume access_token milega
      if (tokenResponse && tokenResponse.access_token) {
        try {
          // Backend call: aap access_token bhej sakte ho ya id_token. 
          // Note: Token Client default me access_token deta hai.
          const backendResponse = await fetch(`${window.API_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tokenResponse.access_token }) 
          });

          const data = await backendResponse.json();
          
          if (backendResponse.ok) {
            alert("🔓 Google Authentication Handshake Successful!");
            localStorage.setItem('token', data.token);
            
            if (data.isNewUser) {
              setFormData(prev => ({ ...prev, fullName: data.user.name, email: data.user.email }));
              setStep(2);
            } else {
              navigate('/dashboard');
            }
          } else {
            alert(`❌ Google Auth Error: ${data.message}`);
          }
        } catch (err) {
          console.error("Google sync failed:", err);
          alert("Backend server connection failed during OAuth sequence.");
        }
      }
    };

    // Initialize the token client
    if (typeof google !== 'undefined') {
      googleClientRef.current = google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
        scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
        callback: handleGoogleSignInResponse,
      });
    }
  }, [navigate]);

  // Yeh function aapke custom button par trigger hoga
  const triggerGoogleLogin = () => {
    if (googleClientRef.current) {
      googleClientRef.current.requestAccessToken(); // Google Popup Open karega
    } else {
      alert("OAuth SDK loading state incomplete. Retry in a moment.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${window.API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        alert(`✨ Workspace initialized! Welcome to the cluster, ${formData.fullName}.`);
        navigate('/login');
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (err) {
      console.error("Connection failed:", err);
      alert("Backend Server not running!");
    }
  };

  const handleSocialAuth = (provider) => {
    alert(`🔐 Initializing secure ${provider} OAuth Handshake sequence...`);
  };

  // --- THREE.JS LIVE ENGINE (Aapka purana bilkul sahi code) ---
  useEffect(() => {
    let scene, camera, renderer, coreCrystal, orbitalRing1, orbitalRing2, stardustParticles, animationFrameId;
    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;

    const initPremium3D = () => {
      if (!canvasRef.current || !stageRef.current) return;

      const width = stageRef.current.clientWidth;
      const height = stageRef.current.clientHeight;

      if (width === 0 || height === 0) {
        animationFrameId = requestAnimationFrame(initPremium3D);
        return;
      }

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(50, width / height, 1, 1000);
      camera.position.z = 140;

      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); scene.add(ambientLight);
      const topSpecularLight = new THREE.DirectionalLight(0xffffff, 2.0); topSpecularLight.position.set(0, 100, 50); scene.add(topSpecularLight);
      const purpleGlowLight = new THREE.PointLight(0x8B5CF6, 3, 250); purpleGlowLight.position.set(60, 40, 40); scene.add(purpleGlowLight);
      const cyanGlowLight = new THREE.PointLight(0x06B6D4, 3, 250); cyanGlowLight.position.set(-60, -40, 40); scene.add(cyanGlowLight);

      const crystalGeo = new THREE.OctahedronGeometry(22, 0);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.95,
        roughness: 0.1,
        transparent: true,
        opacity: 0.9,
        flatShading: true
      });
      coreCrystal = new THREE.Mesh(crystalGeo, crystalMat); scene.add(coreCrystal);

      const ringGeo1 = new THREE.TorusGeometry(34, 0.4, 8, 100);
      const ringMat1 = new THREE.MeshStandardMaterial({ color: 0x06B6D4, emissive: 0x06B6D4, emissiveIntensity: 1.5, transparent: true, opacity: 0.8 });
      orbitalRing1 = new THREE.Mesh(ringGeo1, ringMat1); orbitalRing1.rotation.x = Math.PI / 3; scene.add(orbitalRing1);

      const ringGeo2 = new THREE.TorusGeometry(38, 0.3, 8, 100);
      const ringMat2 = new THREE.MeshStandardMaterial({ color: 0x8B5CF6, emissive: 0x8B5CF6, emissiveIntensity: 1.2, transparent: true, opacity: 0.6 });
      orbitalRing2 = new THREE.Mesh(ringGeo2, ringMat2); orbitalRing2.rotation.x = -Math.PI / 4; orbitalRing2.rotation.y = Math.PI / 4; scene.add(orbitalRing2);

      const starsCount = 250; const starsGeo = new THREE.BufferGeometry(); const starsPositions = new Float32Array(starsCount * 3);
      for (let i = 0; i < starsCount * 3; i++) { starsPositions[i] = (Math.random() - 0.5) * 160; }
      starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));

      const dustCanvas = document.createElement('canvas'); dustCanvas.width = 16; dustCanvas.height = 16;
      const dCtx = dustCanvas.getContext('2d'); const dGrad = dCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
      dGrad.addColorStop(0, 'rgba(255, 255, 255, 1)'); dGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      dCtx.fillStyle = dGrad; dCtx.fillRect(0, 0, 16, 16);

      const dustMaterial = new THREE.PointsMaterial({ size: 1.8, map: new THREE.CanvasTexture(dustCanvas), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
      stardustParticles = new THREE.Points(starsGeo, dustMaterial); scene.add(stardustParticles);

      const renderLoop = () => {
        const time = performance.now() * 0.001; 

        if (coreCrystal) { coreCrystal.rotation.y = time * 0.3; coreCrystal.position.y = Math.sin(time * 1.5) * 2.5; }
        if (orbitalRing1) orbitalRing1.rotation.z = time * 0.4;
        if (orbitalRing2) orbitalRing2.rotation.z = -time * 0.25;
        if (stardustParticles) stardustParticles.rotation.y = time * 0.02;
        
        mouseX += (targetX - mouseX) * 0.06; mouseY += (targetY - mouseY) * 0.06;
        scene.rotation.y = mouseX * 0.6; scene.rotation.x = mouseY * 0.6;
        
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

  return (
    <div className="lms-unified-center-viewport">
      <div className="bg-radial-blur-shades"></div>
      <div className="bg-canvas-dot-matrix"></div>

      <div className="master-symmetric-dashboard-hub">
        <div className="dashboard-panel-half left-form-panel">
          <div className="panel-sheen-liner"></div>

          <div className="register-step-blueprint-map">
            <div className={`blueprint-step-node ${step === 1 ? 'is-active' : step > 1 ? 'is-completed' : ''}`}>
              <div className="step-index-dot">01</div>
              <span className="step-label-txt">Credentials</span>
            </div>
            <div className="blueprint-bridge-line"></div>
            <div className={`blueprint-step-node ${step === 2 ? 'is-active' : step > 2 ? 'is-completed' : ''}`}>
              <div className="step-index-dot">02</div>
              <span className="step-label-txt">Tuning</span>
            </div>
            <div className="blueprint-bridge-line"></div>
            <div className={`blueprint-step-node ${step === 3 ? 'is-active' : ''}`}>
              <div className="step-index-dot">03</div>
              <span className="step-label-txt">AI Align</span>
            </div>
          </div>

          <div className="auth-component-wrapper">
            {step === 1 && (
              <div className="animate-slide capsule-inputs-mesh-layout">
                <form onSubmit={handleNext} className="capsule-inputs-mesh-layout">
                  <div className="auth-panel-header">
                    <h1>Create Account</h1>
                    <p>Initialize your identity profile metadata node across our distributed clusters.</p>
                  </div>

                  <div className="capsule-field-container">
                    <i className="fa-regular fa-user field-leading-icon"></i>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Enter your full name" required />
                  </div>

                  <div className="capsule-field-container">
                    <i className="fa-regular fa-envelope field-leading-icon"></i>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Enter your email address" required />
                  </div>

                  <div className="capsule-field-container">
                    <i className="fa-solid fa-lock field-leading-icon"></i>
                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} placeholder="Create secure password" required />
                    <button type="button" className="password-toggle-reticle-btn" onClick={() => setShowPassword(!showPassword)}>
                      <i className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                    </button>
                  </div>

                  <button type="submit" className="btn-submit-capsule-pill">
                    Continue Setup <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </form>

                <div className="social-provider-oauth-row">
                  <button type="button" className="oauth-pill-capsule" onClick={() => handleSocialAuth('Facebook')}>
                    <i className="fa-brands fa-facebook-f fb-brand-icon"></i> Facebook
                  </button>

                  {/* MODIFIED: Ab target div ki zaroorat nahi, direct apna responsive custom style button use karein */}
                  <button type="button" className="oauth-pill-capsule Google-Neon-Pill" onClick={triggerGoogleLogin}>
                    <i className="fa-brands fa-google google-brand-icon"></i> Google
                  </button>

                  <button type="button" className="oauth-pill-capsule" onClick={() => handleSocialAuth('Apple')}>
                    <i className="fa-brands fa-apple apple-brand-icon"></i> Apple
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleNext} className="capsule-inputs-mesh-layout animate-slide">
                <div className="auth-panel-header">
                  <h1>System Preferences</h1>
                  <p>Fine-tune your learning velocity parameters and target academic track maps.</p>
                </div>
                <div className="capsule-field-container dropdown-select-box">
                  <i className="fa-solid fa-briefcase field-leading-icon"></i>
                  <select name="role" value={formData.role} onChange={handleInputChange}>
                    <option value="Student"> Student</option>
                    <option value="Professional">Working Professional</option>
                    <option value="Hobbyist">Independent Learner</option>
                  </select>
                </div>
                <div className="capsule-field-container dropdown-select-box">
                  <i className="fa-solid fa-graduation-cap field-leading-icon"></i>
                  <select name="domain" value={formData.domain} onChange={handleInputChange}>
                    <option value="Programming">Computer Applications / Development</option>
                    <option value="Design">UI UX Architecture</option>
                    <option value="Data Science">Artificial Intelligence Systems</option>
                  </select>
                </div>
                <div className="capsule-field-container dropdown-select-box">
                  <i className="fa-solid fa-clock field-leading-icon"></i>
                  <select name="commitment" value={formData.commitment} onChange={handleInputChange}>
                    <option value="1 Hour">1 Hour / Daily </option>
                    <option value="2 Hours">2 Hours / Intermediate </option>
                    <option value="3 Hours">3+ Hours / Intensive </option>
                  </select>
                </div>
                <div className="step-navigation-actions-row">
                  <button type="button" className="btn-capsule-back-node" onClick={handleBack}>Back</button>
                  <button type="submit" className="btn-submit-capsule-pill adaptive-flex">Next Sync</button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleFinalSubmit} className="capsule-inputs-mesh-layout animate-slide">
                <div className="auth-panel-header">
                  <h1>AI Path Curation</h1>
                  <p>Configure internal cognitive models tuning strategies for vector syllabus indexing.</p>
                </div>
                <div className="capsule-field-container dropdown-select-box">
                  <i className="fa-solid fa-chart-line field-leading-icon"></i>
                  <select name="experience" value={formData.experience} onChange={handleInputChange}>
                    <option value="Beginner">Beginner Tier (Base Line)</option>
                    <option value="Intermediate">Intermediate Competency</option>
                    <option value="Advanced">Advanced Stack Engineer</option>
                  </select>
                </div>
                <div className="capsule-field-container dropdown-select-box">
                  <i className="fa-solid fa-wand-magic-sparkles field-leading-icon"></i>
                  <select name="learningStyle" value={formData.learningStyle} onChange={handleInputChange}>
                    <option value="Videos">Interactive Media Stream</option>
                    <option value="Text">Deep Scopus Indexed Documents</option>
                    <option value="Projects">Direct Practical Codebases</option>
                  </select>
                </div>
                <div className="registration-telemetry-pill-display">
                  <div className="telemetry-display-row">
                    <span className="telemetry-lbl">Owner Node:</span>
                    <span className="telemetry-val text-cyan">{formData.fullName || 'Awaiting Input...'}</span>
                  </div>
                  <div className="telemetry-display-row">
                    <span className="telemetry-lbl">Course Track:</span>
                    <span className="telemetry-val">{formData.domain}</span>
                  </div>
                </div>
                <div className="step-navigation-actions-row">
                  <button type="button" className="btn-capsule-back-node" onClick={handleBack}>Back</button>
                  <button type="submit" className="btn-submit-capsule-pill btn-neon-confirm adaptive-flex">Register</button>
                </div>
              </form>
            )}
          </div>

          {step === 1 && (
            <div className="auth-footer-view-switcher">
              Already have an instance account? <Link to="/login" className="auth-blue-redirect-anchor">Log in</Link>
            </div>
          )}
        </div>

        <div className="dashboard-panel-half right-three-panel">
          <div className="panel-sheen-liner"></div>
          <div className="project-blueprint-info">
            <div className="brand-meta-badge"><span className="brand-badge-dot"></span> LuminaLearn Studio Registry</div>
            <h2>Initialize Identity Clusters</h2>
            <p>Help our adaptive curation neural network calibrate your baseline preferences node parameters in real-time execution.</p>
          </div>
          <div className="threejs-embedded-stage" ref={stageRef}>
            <canvas id="quantum3DCanvas" ref={canvasRef}></canvas>
          </div>
          <div className="panel-status-ribbon-strip">
            <span><i className="fa-solid fa-gem network-cyan"></i> GRAPHICS_ENGINE: OBSIDIAN_GLASS</span>
            <span><i className="fa-solid fa-bolt telemetry-purple"></i> REFLECTIONS: REALTIME</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;