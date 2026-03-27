/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { Calendar, MapPin, Clock, Heart, Camera, ArrowRight, X, ChevronLeft, ChevronRight, Star, Upload, Save, Trash2, Music, Pause, Play, LogIn } from "lucide-react";
import * as React from "react";
import { useRef, useEffect, useState } from "react";
import { auth, db, googleProvider, saveSettingsToDB, loadSettingsFromDB, addImageToDB, deleteImageFromDB, testConnection, handleFirestoreError, OperationType } from "./firebase";
import { signInWithPopup, onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore";

const ParticleField = () => {
  const [particles, setParticles] = useState<{ id: number; top: string; left: string; size: string; duration: string; blur: string }[]>([]);

  useEffect(() => {
    const particleCount = 60;
    const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 6 + 2}px`,
      duration: `${Math.random() * 8 + 7}s`,
      blur: `${Math.random() * 4}px`,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="particle-field">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            filter: `blur(${p.blur})`,
            // @ts-ignore
            "--duration": p.duration,
          }}
        />
      ))}
    </div>
  );
};

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="grid grid-cols-4 gap-4 md:gap-8 max-w-2xl mx-auto mt-12">
      {[
        { label: "DAYS", value: timeLeft.days },
        { label: "HOURS", value: timeLeft.hours },
        { label: "MINS", value: timeLeft.minutes },
        { label: "SECS", value: timeLeft.seconds },
      ].map((item, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="text-3xl md:text-5xl font-light text-[#e2c28a] mb-2">{item.value.toString().padStart(2, '0')}</div>
          <div className="text-[10px] tracking-[0.3em] text-white/30 uppercase">{item.label}</div>
        </div>
      ))}
    </div>
  );
};

const TiltCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const onMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    setRotate({ x: rotateX, y: rotateY });
  };

  const onMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      animate={{ rotateX: rotate.x, rotateY: rotate.y }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ transformStyle: "preserve-3d" }}
      className={`${className} glass-card`}
    >
      <div style={{ transform: "translateZ(50px)" }}>
        {children}
      </div>
    </motion.div>
  );
};

const FallingHearts = () => {
  const [hearts, setHearts] = useState<{ id: number; left: string; delay: string; duration: string; size: number }[]>([]);

  useEffect(() => {
    const heartCount = 15;
    const newHearts = Array.from({ length: heartCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      duration: `${Math.random() * 15 + 15}s`,
      size: Math.random() * 15 + 10,
    }));
    setHearts(newHearts);
  }, []);

  return (
    <div className="heart-container">
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          initial={{ y: -100, opacity: 0, rotate: 0 }}
          animate={{ y: "110vh", opacity: [0, 0.4, 0.4, 0], rotate: 360 }}
          transition={{
            duration: parseFloat(heart.duration),
            delay: parseFloat(heart.delay),
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute text-[#e2c28a]/10"
          style={{ left: heart.left }}
        >
          <Heart size={heart.size} fill="currentColor" />
        </motion.div>
      ))}
    </div>
  );
};

const RevealText = ({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) => {
  return (
    <span className="overflow-hidden block">
      <motion.span
        initial={{ y: "100%" }}
        whileInView={{ y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay }}
        className={`block ${className}`}
      >
        {text}
      </motion.span>
    </span>
  );
};

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
};

const MagneticButton = ({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const onMouseMove = (e: React.MouseEvent) => {
    if (!btnRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = btnRef.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const onMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={btnRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.button>
  );
};

const Lightbox = ({ images, index, onClose }: { images: any[]; index: number; onClose: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(index);

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="lightbox-overlay"
      onClick={onClose}
    >
      <button className="absolute top-8 right-8 text-white/50 hover:text-white z-50" onClick={onClose}>
        <X size={32} />
      </button>
      
      <button className="absolute left-8 text-white/50 hover:text-white z-50 p-4" onClick={prev}>
        <ChevronLeft size={48} />
      </button>
      
      <motion.div 
        key={currentIndex}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-[90vw] max-h-[85vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={images[currentIndex].src} 
          alt={images[currentIndex].title}
          className="w-full h-full object-contain rounded-lg shadow-2xl"
          referrerPolicy="no-referrer"
        />
        <div className="absolute -bottom-12 left-0 right-0 text-center">
          <p className="text-[#e2c28a] font-sans tracking-[0.3em] uppercase text-xs">{images[currentIndex].title}</p>
        </div>
      </motion.div>

      <button className="absolute right-8 text-white/50 hover:text-white z-50 p-4" onClick={next}>
        <ChevronRight size={48} />
      </button>
    </motion.div>
  );
};

export default function App() {
  const containerRef = useRef(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Editable State
  const [groomName, setGroomName] = useState("Ramakoteswara");
  const [groomLastName, setGroomLastName] = useState("Rao");
  const [brideName, setBrideName] = useState("Dharani");
  const [weddingDate, setWeddingDate] = useState("2026-04-03");
  const [weddingTime, setWeddingTime] = useState("09:47 PM");
  const [weddingVenue, setWeddingVenue] = useState("Peddapulivarru");
  const [weddingAddress, setWeddingAddress] = useState("6-91/A, Near Repalle, Andhra Pradesh");
  const [mapUrl, setMapUrl] = useState("https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3835.405544747447!2d80.8224!3d16.0374!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTbCsDAyJzE0LjYiTiA4MMKwNDknMjAuNiJF!5e0!3m2!1sen!2sin!4v1711480000000!5m2!1sen!2sin");
  const [musicUrl, setMusicUrl] = useState("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [galleryImages, setGalleryImages] = useState<any[]>([
    { src: "https://picsum.photos/seed/wedding_vibrant1/1200/1600", title: "The Beginning", size: "large", order: 0, id: "1" },
    { src: "https://picsum.photos/seed/wedding_vibrant2/1200/1200", title: "Shared Dreams", size: "small", order: 1, id: "2" },
    { src: "https://picsum.photos/seed/wedding_vibrant3/1600/1200", title: "Quiet Moments", size: "wide", order: 2, id: "3" },
    { src: "https://picsum.photos/seed/wedding_vibrant4/1200/1600", title: "Endless Love", size: "large", order: 3, id: "4" },
    { src: "https://picsum.photos/seed/wedding_vibrant5/1200/1200", title: "The Promise", size: "small", order: 4, id: "5" },
    { src: "https://picsum.photos/seed/wedding_vibrant6/1600/1200", title: "Celebration", size: "wide", order: 5, id: "6" },
  ]);

  // Firebase Real-time Sync
  useEffect(() => {
    testConnection();

    // Sync Settings
    const unsubscribeSettings = onSnapshot(doc(db, "settings/global"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.groomName) setGroomName(data.groomName);
        if (data.groomLastName) setGroomLastName(data.groomLastName);
        if (data.brideName) setBrideName(data.brideName);
        if (data.weddingDate) setWeddingDate(data.weddingDate);
        if (data.weddingTime) setWeddingTime(data.weddingTime);
        if (data.weddingVenue) setWeddingVenue(data.weddingVenue);
        if (data.weddingAddress) setWeddingAddress(data.weddingAddress);
        if (data.mapUrl) setMapUrl(data.mapUrl);
        if (data.musicUrl) setMusicUrl(data.musicUrl);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, "settings/global"));

    // Sync Gallery
    const q = query(collection(db, "gallery"), orderBy("order", "asc"));
    const unsubscribeGallery = onSnapshot(q, (snapshot) => {
      const images = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      if (images.length > 0) {
        setGalleryImages(images);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, "gallery"));

    // Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => {
      unsubscribeSettings();
      unsubscribeGallery();
      unsubscribeAuth();
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 1.1]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -50]);
  const nameY = useTransform(scrollYProgress, [0, 0.2], [0, -100]);

  const [lastClick, setLastClick] = useState(0);
  const handleStarClick = () => {
    const now = Date.now();
    if (now - lastClick < 300) {
      setIsAdminOpen(true);
    }
    setLastClick(now);
  };

  const handleAdminAuth = () => {
    if (secretKey === "yash") {
      setIsAuthorized(true);
    } else {
      alert("Incorrect Secret Key");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
      alert("Login failed. Please make sure you are an authorized admin.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const safeSetLocalStorage = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert("Storage limit reached! This file is too large to be saved in your browser's local storage. Please use a direct URL (e.g., from a cloud drive) instead.");
      } else {
        console.error("Local storage error:", e);
      }
      return false;
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert("Image is too large! Please upload images smaller than 1.5MB for database storage.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newImage = {
          src: reader.result as string,
          title: "New Memory",
          size: Math.random() > 0.5 ? "large" : "small",
          order: galleryImages.length
        };
        await addImageToDB(newImage);
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteImage = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      await deleteImageFromDB(id);
    }
  };

  const saveSettings = async () => {
    const settings = {
      groomName,
      groomLastName,
      brideName,
      weddingDate,
      weddingTime,
      weddingVenue,
      weddingAddress,
      mapUrl,
      musicUrl
    };

    const success = await saveSettingsToDB(settings);
    if (success) {
      alert("Settings saved to database successfully!");
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log("Playback blocked by browser"));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleViewInvitation = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    if (audioRef.current && !isPlaying) {
      audioRef.current.play().catch(e => console.log("Playback blocked by browser"));
      setIsPlaying(true);
    }
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Music file is too large! Please upload files smaller than 2MB or use a direct URL.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setMusicUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] font-serif selection:bg-[#e2c28a] selection:text-black">
      <div className="gradient-bg" />
      <div className="noise-overlay" />
      <ParticleField />
      <FallingHearts />

      {/* Music Player */}
      <div className="fixed bottom-8 right-8 z-[100] flex items-center space-x-4">
        <audio ref={audioRef} src={musicUrl} loop />
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleMusic}
          className="w-12 h-12 rounded-full bg-[#e2c28a] text-black flex items-center justify-center shadow-lg shadow-[#e2c28a]/20"
        >
          {isPlaying ? <Pause size={20} /> : <Music size={20} />}
        </motion.button>
        {isPlaying && (
          <div className="flex items-end space-x-1 h-4">
            {[0.4, 0.7, 0.5, 0.9, 0.6].map((h, i) => (
              <motion.div
                key={i}
                animate={{ height: ["20%", "100%", "20%"] }}
                transition={{ duration: 0.5 + i * 0.1, repeat: Infinity }}
                className="w-1 bg-[#e2c28a]"
                style={{ height: `${h * 100}%` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Admin Trigger */}
      <div 
        className="fixed top-8 left-8 z-[100] cursor-pointer text-[#e2c28a]/20 hover:text-[#e2c28a] transition-colors star-pulse"
        onClick={handleStarClick}
      >
        <Star size={24} />
      </div>

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {isAdminOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="max-w-2xl w-full glass-card p-8 relative max-h-[90vh] overflow-y-auto">
              <button className="absolute top-6 right-6 text-white/50 hover:text-white" onClick={() => { setIsAdminOpen(false); setIsAuthorized(false); setSecretKey(""); }}>
                <X size={24} />
              </button>

              {!isAuthorized ? (
                <div className="space-y-6 text-center">
                  <h2 className="text-2xl font-display text-[#e2c28a]">Admin Access</h2>
                  <input 
                    type="password" 
                    placeholder="Enter Secret Key" 
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-center focus:border-[#e2c28a] outline-none"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
                  />
                  <button className="glow-button w-full" onClick={handleAdminAuth}>Authorize</button>
                </div>
              ) : (
                <div className="space-y-12">
                  <h2 className="text-2xl font-display text-[#e2c28a] text-center">Wedding Settings</h2>
                  
                  {/* Name Editing */}
                  <div className="space-y-4">
                    <h3 className="text-xs tracking-widest uppercase text-white/30">Edit Names</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input 
                        type="text" 
                        placeholder="Groom First Name" 
                        className="bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[#e2c28a]"
                        value={groomName}
                        onChange={(e) => setGroomName(e.target.value)}
                      />
                      <input 
                        type="text" 
                        placeholder="Groom Last Name" 
                        className="bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[#e2c28a]"
                        value={groomLastName}
                        onChange={(e) => setGroomLastName(e.target.value)}
                      />
                      <input 
                        type="text" 
                        placeholder="Bride Name" 
                        className="bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[#e2c28a]"
                        value={brideName}
                        onChange={(e) => setBrideName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Event Details Editing */}
                  <div className="space-y-4">
                    <h3 className="text-xs tracking-widest uppercase text-white/30">Event Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/30 uppercase">Wedding Date (YYYY-MM-DD)</label>
                        <input 
                          type="date" 
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[#e2c28a]"
                          value={weddingDate}
                          onChange={(e) => setWeddingDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/30 uppercase">Wedding Time</label>
                        <input 
                          type="text" 
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[#e2c28a]"
                          value={weddingTime}
                          onChange={(e) => setWeddingTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/30 uppercase">Venue Name</label>
                        <input 
                          type="text" 
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[#e2c28a]"
                          value={weddingVenue}
                          onChange={(e) => setWeddingVenue(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/30 uppercase">Full Address</label>
                        <input 
                          type="text" 
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[#e2c28a]"
                          value={weddingAddress}
                          onChange={(e) => setWeddingAddress(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/30 uppercase">Google Maps Embed URL</label>
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[#e2c28a]"
                        value={mapUrl}
                        onChange={(e) => setMapUrl(e.target.value)}
                      />
                    </div>
                    {/* Removed individual save button */}
                  </div>

                  {/* Music Settings */}
                  <div className="space-y-4">
                    <h3 className="text-xs tracking-widest uppercase text-white/30">Music Settings</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/30 uppercase">Music URL (MP3)</label>
                        <input 
                          type="text" 
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[#e2c28a]"
                          value={musicUrl}
                          onChange={(e) => setMusicUrl(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <label className="flex-1 flex items-center justify-center h-12 border border-dashed border-white/20 rounded-lg cursor-pointer hover:border-[#e2c28a]/50 transition-colors">
                          <Upload size={16} className="mr-2 text-[#e2c28a]" />
                          <span className="text-xs text-white/50">Upload MP3</span>
                          <input type="file" className="hidden" accept="audio/*" onChange={handleMusicUpload} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Gallery Management */}
                  <div className="space-y-4">
                    <h3 className="text-xs tracking-widest uppercase text-white/30">Manage Gallery</h3>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-[#e2c28a]/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-[#e2c28a] mb-2" />
                        <p className="text-sm text-white/50">Click to upload images</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>

                    <div className="grid grid-cols-3 gap-4 mt-6">
                      {galleryImages.map((img: any, i: number) => (
                        <div key={img.id || i} className="relative aspect-square rounded-lg overflow-hidden group">
                          <img src={img.src} className="w-full h-full object-cover" alt="" />
                          <button 
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteImage(img.id)}
                          >
                            <Trash2 className="text-red-400" size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Database Authorization & Global Save */}
                  <div className="space-y-6 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[#e2c28a] text-xs tracking-widest uppercase">Database Authorization</h3>
                      {user ? (
                        <div className="flex items-center space-x-3">
                          <img src={user.photoURL || ""} className="w-6 h-6 rounded-full border border-[#e2c28a]/50" />
                          <span className="text-[10px] text-white/40">{user.email}</span>
                          <button onClick={handleLogout} className="text-[10px] text-red-400 hover:text-red-300">Logout</button>
                        </div>
                      ) : (
                        <button 
                          onClick={handleGoogleLogin}
                          className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] tracking-widest uppercase hover:bg-white/10 transition-colors"
                        >
                          <LogIn size={14} />
                          <span>Login with Google</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-white/30 italic">Note: You must login with an authorized admin email (sabbinenirajith@gmail.com) to save changes to the live database.</p>
                    
                    <button 
                      onClick={saveSettings}
                      disabled={!user}
                      className={`w-full py-4 rounded-xl flex items-center justify-center space-x-2 transition-all ${
                        user ? "bg-[#e2c28a] text-black hover:bg-white" : "bg-white/5 text-white/20 cursor-not-allowed"
                      }`}
                    >
                      <Save size={18} />
                      <span className="text-xs tracking-[0.2em] font-medium uppercase">Save All Changes to Database</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox 
            images={galleryImages} 
            index={lightboxIndex} 
            onClose={() => setLightboxIndex(null)} 
          />
        )}
      </AnimatePresence>

      {/* Hero Section - Cinematic Entrance */}
      <section className="relative h-[110vh] flex flex-col items-center justify-center overflow-hidden z-10">
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="z-10 text-center px-6 w-full max-w-7xl"
        >
          <div className="mb-8">
            <RevealText 
              text="THE WEDDING CELEBRATION" 
              className="font-sans tracking-[0.6em] text-[10px] md:text-xs uppercase text-[#e2c28a]" 
            />
          </div>
          
          <motion.h1 
            style={{ y: nameY }}
            className="font-display text-5xl md:text-[8vw] lg:text-[10vw] leading-[1.1] mb-12 flex flex-col items-center"
          >
            <RevealText text={groomName} className="premium-text" />
            <RevealText text={groomLastName} className="premium-text" delay={0.1} />
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 1.5 }}
              className="text-2xl md:text-5xl my-4 text-white/20 font-light"
            >
              &
            </motion.span>
            <RevealText text={brideName} className="premium-text" delay={0.2} />
          </motion.h1>

          <div className="flex flex-col items-center mt-12">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 100 }}
              transition={{ delay: 1.5, duration: 1.5, ease: "circOut" }}
              className="h-px bg-[#e2c28a]/40 mb-8"
            />
            <RevealText 
              text="APRIL 03, 2026 • PEDDAPULIVARRU" 
              className="font-sans tracking-[0.3em] text-[10px] uppercase text-white/40"
              delay={1.8}
            />
          </div>

          {/* Countdown Timer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            <CountdownTimer targetDate={`${weddingDate}T21:47:00`} />
          </motion.div>

          <MagneticButton 
            className="glow-button mt-16 group"
            onClick={handleViewInvitation}
          >
            <span className="flex items-center space-x-2">
              <span>View Invitation</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </MagneticButton>
        </motion.div>

        {/* Cinematic Background Depth */}
        <div className="absolute inset-0 z-0">
          <motion.div 
            style={{ 
              scale: useTransform(scrollYProgress, [0, 0.3], [1, 1.2]), 
              y: useTransform(scrollYProgress, [0, 0.3], [0, 100]) 
            }}
            className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]" 
          />
        </div>
      </section>

      {/* Invitation Text - Luxury Editorial */}
      <Section className="py-40 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
            <div className="space-y-12">
              <RevealText 
                text="OUR JOURNEY" 
                className="font-sans tracking-[0.4em] text-xs uppercase text-[#e2c28a]" 
              />
              <h2 className="text-4xl md:text-6xl font-light leading-tight text-white/90">
                A celebration of love, <br />
                commitment, and the <br />
                start of forever.
              </h2>
            </div>
            <div className="space-y-8 pt-12 lg:pt-32">
              <p className="text-xl md:text-2xl text-white/50 leading-relaxed font-light italic">
                "We invite you to join us as we exchange vows and begin our new chapter together. Your presence would mean the world to us."
              </p>
              <div className="flex items-center space-x-4 text-[#e2c28a]">
                <span className="font-sans text-xs tracking-widest uppercase animated-border cursor-pointer">Scroll for details</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Details - Glassmorphism UI */}
      <Section className="py-40 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TiltCard className="p-12 space-y-8 group hover:border-[#e2c28a]/30 transition-all duration-500">
              <Calendar className="w-6 h-6 text-[#e2c28a] opacity-50 group-hover:opacity-100 transition-opacity" />
              <div>
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-white/30 mb-4">THE DATE</p>
                <h3 className="text-3xl md:text-4xl font-light">{new Date(weddingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</h3>
                <p className="text-[#e2c28a] mt-2 italic">{new Date(weddingDate).toLocaleDateString('en-US', { weekday: 'long' })} Evening</p>
              </div>
            </TiltCard>

            <TiltCard className="p-12 space-y-8 group hover:border-[#e2c28a]/30 transition-all duration-500">
              <Clock className="w-6 h-6 text-[#e2c28a] opacity-50 group-hover:opacity-100 transition-opacity" />
              <div>
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-white/30 mb-4">THE TIME</p>
                <h3 className="text-3xl md:text-4xl font-light">{weddingTime}</h3>
                <p className="text-[#e2c28a] mt-2 italic">Muhurtham</p>
              </div>
            </TiltCard>

            <TiltCard className="p-12 space-y-8 group hover:border-[#e2c28a]/30 transition-all duration-500">
              <MapPin className="w-6 h-6 text-[#e2c28a] opacity-50 group-hover:opacity-100 transition-opacity" />
              <div>
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-white/30 mb-4">THE VENUE</p>
                <h3 className="text-3xl md:text-4xl font-light leading-tight">{weddingVenue}</h3>
                <p className="text-white/40 mt-4 text-sm leading-relaxed">
                  {weddingAddress}
                </p>
              </div>
            </TiltCard>
          </div>
        </div>
      </Section>

      {/* Google Maps Integration */}
      <Section className="py-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card overflow-hidden h-[400px] w-full border border-white/10">
            <iframe 
              src={mapUrl} 
              width="100%" 
              height="100%" 
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </Section>

      {/* Gallery - Vibrant Grid with Lightbox */}
      <section className="py-40 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-24">
            <div className="space-y-4">
              <RevealText 
                text="GALLERY" 
                className="font-sans tracking-[0.4em] text-xs uppercase text-[#e2c28a]" 
              />
              <h2 className="text-4xl md:text-6xl font-light">Captured Moments</h2>
            </div>
            <Camera className="w-8 h-8 text-white/10 hidden md:block" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {galleryImages.map((item: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`relative overflow-hidden group cursor-pointer rounded-2xl ${
                  item.size === "large" ? "md:col-span-4 aspect-[3/4]" : 
                  item.size === "wide" ? "md:col-span-8 aspect-[16/9]" : 
                  "md:col-span-4 aspect-square"
                }`}
                onClick={() => setLightboxIndex(index)}
              >
                <motion.img 
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
                  src={item.src} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-all duration-1000 group-hover:brightness-75"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col justify-end p-10">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    whileHover={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700"
                  >
                    <p className="text-[#e2c28a] font-sans text-[10px] tracking-[0.6em] uppercase mb-4 font-medium">{item.title || "MEMORIES"}</p>
                    <div className="w-12 h-px bg-[#e2c28a] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 delay-100" />
                  </motion.div>
                </div>
                
                {/* Subtle border glow on hover */}
                <div className="absolute inset-0 border border-[#e2c28a]/0 group-hover:border-[#e2c28a]/20 transition-colors duration-700 rounded-2xl pointer-events-none" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote - Immersive Depth */}
      <Section className="py-60 px-6 text-center relative overflow-hidden z-10">
        <div className="max-w-4xl mx-auto z-10 relative">
          <Heart className="w-6 h-6 text-[#e2c28a]/20 mx-auto mb-12" />
          <h2 className="text-3xl md:text-6xl font-light italic leading-tight text-white/90">
            "Two souls with but a single thought, <br />
            two hearts that beat as one."
          </h2>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-[#e2c28a]/5 blur-[120px] rounded-full" />
      </Section>

      {/* Footer - Luxury Sign-off */}
      <Section className="py-40 bg-[#050505] border-t border-white/5 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <RevealText 
            text="WE LOOK FORWARD TO SEEING YOU" 
            className="font-sans tracking-[0.5em] text-[10px] uppercase text-[#e2c28a] mb-12" 
          />
          <h2 className="text-4xl md:text-7xl font-display premium-text mb-24">{groomName} & {brideName}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full pt-12 border-t border-white/5">
            <div className="text-center md:text-left">
              <p className="text-[10px] font-sans tracking-widest text-white/20 uppercase mb-4">LOCATION</p>
              <p className="text-white/40 text-sm">Peddapulivarru, Andhra Pradesh</p>
            </div>
            <div className="flex justify-center items-center">
              <div className="w-12 h-px bg-white/10" />
              <div className="mx-4 w-2 h-2 rounded-full border border-white/20" />
              <div className="w-12 h-px bg-white/10" />
            </div>
            <div className="text-center md:text-right">
              <p className="text-[10px] font-sans tracking-widest text-white/20 uppercase mb-4">DATE</p>
              <p className="text-white/40 text-sm">April 03, 2026</p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
