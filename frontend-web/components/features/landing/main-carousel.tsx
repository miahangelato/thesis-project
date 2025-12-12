"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { landingCarouselSlides } from "@/data/landing-content";
import { WarningHeader } from "@/components/layout/warning-header";

interface MainCarouselProps {
  autoPlayInterval?: number;
  onStartClick: () => void;
  loading?: boolean;
}

export function MainCarousel({ autoPlayInterval = 5000, onStartClick, loading = false }: MainCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const totalSlides = landingCarouselSlides.length;

  // Reset currentSlide if out of bounds (when slides change)
  useEffect(() => {
    if (currentSlide >= totalSlides) {
      setCurrentSlide(0);
    }
  }, [currentSlide, totalSlides]);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [currentSlide, autoPlayInterval]);

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const slide = landingCarouselSlides[currentSlide];
  
  // Safety check - if slide is undefined, don't render
  if (!slide) {
    return null;
  }
  
  const Icon = slide.icon;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };


  const [swipeStart, setSwipeStart] = useState<number | null>(null);

  return (
    <div className="flex flex-col w-full">
      <div 
        className="relative w-full px-12 lg:px-18 xl:px-24 2xl:px-36 pt-4 pb-2 flex items-start justify-between cursor-pointer select-none"
        onMouseDown={(e) => {
          setSwipeStart(e.clientX);
        }}
        onMouseUp={(e) => {
          if (swipeStart !== null) {
            const diffX = e.clientX - swipeStart;
            if (Math.abs(diffX) > 100) {
              if (diffX > 0) {
                prevSlide();
              } else {
                nextSlide();
              }
            }
            setSwipeStart(null);
          }
        }}
        onTouchStart={(e) => {
          setSwipeStart(e.touches[0].clientX);
        }}
        onTouchEnd={(e) => {
          if (swipeStart !== null) {
            const diffX = e.changedTouches[0].clientX - swipeStart;
            if (Math.abs(diffX) > 100) {
              if (diffX > 0) {
                prevSlide();
              } else {
                nextSlide();
              }
            }
            setSwipeStart(null);
          }
        }}
      >
      {/* Left: Text Content - Widened to 55% for one-line titles */}
      <div className="w-[55%] flex flex-col justify-between h-[650px] pr-4 lg:pr-8 relative z-10 pb-12">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="flex flex-col justify-start pt-20"
          >
             {/* Subtitle Badge */}
             {slide.subtitle && (
                <div className="inline-block mb-3">
                  <span className="text-[#00c2cb] font-semibold text-lg lg:text-xl bg-[#e4f7f8] px-4 py-2 rounded-full">
                    {slide.subtitle}
                  </span>
                </div>
              )}

            {/* Title - Optimized for multi-line */}
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-800 mb-6 leading-tight">
              {slide.title}
            </h1>

            {/* Content Lines */}
            <div className="space-y-2 mb-10">
              {slide.content.map((line, idx) => {
                // Check if line starts with a bullet point character
                const isBullet = line.trim().startsWith("•");
                const text = isBullet ? line.trim().substring(1).trim() : line;
                
                return (
                  <div key={idx} className={`flex items-start ${isBullet ? "pl-2" : ""}`}>
                     {isBullet && (
                        <span className="text-[#00c2cb] mr-2 font-bold text-lg">•</span>
                     )}
                    <p className="text-gray-600 text-base lg:text-lg xl:text-xl leading-relaxed select-none"> {/* Added select-none for drag */}
                      {text}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Dots - Aligned with top of CTA button container */}
        <div className="absolute bottom-28 left-0 flex items-center space-x-3 z-20">
            {landingCarouselSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-3 rounded-full transition-all duration-300 ${
                  currentSlide === index 
                    ? "w-8 bg-[#00c2cb]" 
                    : "w-3 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
        </div>

      </div>


      {/* Right: Visual - With Animation (Synced with Text) */}
      <div className="w-[45%] flex justify-center items-center relative h-[600px]"> {/* Fixed height container */}
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="w-full h-full flex items-center justify-center"
          >
            {slide.singleImageLayout && slide.imagePath ? (
              /* Single Large Image Layout */
              <div className="relative w-[85%] h-[85%] flex items-center justify-center transform -translate-y-8">
                <Image
                  src={slide.imagePath}
                  alt="Slide visual"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              /* Three Cards Layout */
              <div className="relative w-full max-w-xl transform -translate-y-12"> {/* Lifted images up */}
                {/* Fingerprint Cards Triptych - Static */}
                <div className="relative h-[350px] lg:h-[400px] xl:h-[450px] w-full flex items-center justify-center">
              
            {/* Left fingerprint */}
            <div className="absolute left-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#00c2cb] via-cyan-300 to-teal-700 shadow-[0_0_25px_rgba(0,194,203,0.5)]" 
                 style={{ 
                  width: 'clamp(200px, 24vw, 250px)', 
                  height: 'clamp(200px, 24vw, 250px)',
                  zIndex: 1,
                  transform: 'translateX(-15px)'
                 }}>
              <div className="flex items-center justify-center h-full p-4 bg-white rounded-2xl overflow-hidden">
                {slide.imagePath ? (
                  <Image
                    src={slide.imagePath}
                    alt="Slide visual"
                    fill
                    className="object-cover opacity-70 blur-sm"
                  />
                ) : Icon && (
                  <Icon 
                    className="w-full h-full text-[#00c2cb] opacity-80"
                    strokeWidth={1}
                  />
                )}
              </div>
            </div>
            
            {/* Right fingerprint */}
            <div className="absolute right-0 rounded-2xl p-[2px] bg-gradient-to-bl from-[#00c2cb] via-cyan-300 to-teal-700 shadow-[0_0_25px_rgba(0,194,203,0.5)]" 
                 style={{ 
                  width: 'clamp(200px, 24vw, 250px)', 
                  height: 'clamp(200px, 24vw, 250px)',
                  zIndex: 1,
                  transform: 'translateX(15px)'
                 }}>
              <div className="flex items-center justify-center h-full p-4 bg-white rounded-2xl overflow-hidden">
                {slide.imagePath ? (
                  <Image
                    src={slide.imagePath}
                    alt="Slide visual"
                    fill
                    className="object-cover opacity-70 blur-sm"
                  />
                ) : Icon && (
                  <Icon 
                    className="w-full h-full text-[#00c2cb] opacity-80"
                    strokeWidth={1}
                  />
                )}
              </div>
            </div>
            
            {/* Main center card */}
            <div className="rounded-2xl p-[3px] bg-gradient-to-b from-cyan-300 via-[#00c2cb] to-teal-600 shadow-[0_0_40px_rgba(0,194,203,0.7)] relative" 
                 style={{ 
                   width: 'clamp(260px, 32vw, 320px)', 
                   height: 'clamp(260px, 32vw, 320px)',
                   zIndex: 2
                 }}>
              <div className="flex items-center justify-center h-full p-5 bg-white rounded-2xl overflow-hidden relative">
                {slide.imagePath ? (
                  <Image
                    src={slide.imagePath}
                    alt="Slide visual"
                    fill
                    className="object-cover"
                  />
                ) : Icon && (
                  <Icon 
                    className="w-full h-full text-[#00c2cb]"
                    strokeWidth={1}
                  />
                )}
              </div>
            </div>
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
        
        
        {/* CTA Button - Moved Below Images with Heartbeat Animation */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 w-full flex justify-center">
          <Button
            onClick={onStartClick}
            className="bg-[#00c2cb] hover:bg-[#00adb5] text-white px-12 py-8 lg:py-9 rounded-2xl transition-all duration-200 font-bold text-xl lg:text-2xl shadow-xl hover:shadow-2xl animate-heartbeat hover:animate-none transform hover:-translate-y-1 hover:scale-105"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="animate-spin h-8 w-8 mr-3" />
                <span>Starting...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <Fingerprint className="mr-3 h-8 w-8" />
                <span>Click to Start</span>
              </div>
            )}
          </Button>
        </div>
      </div>


      </div>
    </div>
  );
}
