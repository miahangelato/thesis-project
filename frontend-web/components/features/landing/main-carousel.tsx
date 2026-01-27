"use client";
import { useState, useEffect } from "react";

import { landingCarouselSlides } from "@/data/landing-content";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface MainCarouselProps {
  autoPlayInterval?: number;
  onStartClick: () => void;
  loading?: boolean;
}

export function MainCarousel({
  autoPlayInterval = 9000,
  onStartClick,
  loading = false,
}: MainCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const totalSlides = landingCarouselSlides.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [autoPlayInterval, totalSlides]);

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

  const [swipeStart, setSwipeStart] = useState<number | null>(null);

  if (!slide) return null;

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

  // Separate variants: text slides, images crossfade (no horizontal motion)
  const textVariants = slideVariants;

  const imageVariants = {
    enter: { opacity: 0, scale: 0.995 },
    center: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.995 },
  };

  return (
    <div className="flex flex-col w-full">
      <div
        className="relative w-full px-12 lg:px-18 xl:px-24 2xl:px-36 pt-4 pb-2 flex items-start justify-between cursor-pointer select-none"
        onMouseDown={(e) => setSwipeStart(e.clientX)}
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
        onTouchStart={(e) => setSwipeStart(e.touches[0].clientX)}
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
        <div className="w-[55%] flex flex-col justify-between h-[650px] pr-4 lg:pr-8 relative z-10 pb-12">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={textVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="flex flex-col justify-start pt-20"
            >
              {slide.subtitle && (
                <div className="inline-block mb-3">
                  <span className="text-[#00c2cb] font-semibold text-lg lg:text-xl bg-[#e4f7f8] px-4 py-2 rounded-full">
                    {slide.subtitle}
                  </span>
                </div>
              )}

              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-800 mb-6 leading-tight">
                {slide.title}
              </h1>

              <div className="space-y-2 mb-10">
                {slide.content.map((line, idx) => {
                  const isBullet = line.trim().startsWith("•");
                  const text = isBullet ? line.trim().substring(1).trim() : line;

                  return (
                    <div
                      key={idx}
                      className={`flex items-start ${isBullet ? "pl-2" : ""}`}
                    >
                      {isBullet && (
                        <span className="text-[#00c2cb] mr-2 font-bold text-lg">•</span>
                      )}
                      <p className="text-gray-600 text-base lg:text-lg xl:text-xl leading-relaxed select-none">
                        {text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

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

        <div className="w-[45%] flex justify-center items-center relative h-[600px]">
          <div className="relative w-full max-w-xl transform -translate-y-12">
            <div className="relative h-[350px] lg:h-[400px] xl:h-[450px] w-full flex items-center justify-center">
              {/* decorative elements remain static */}
              <div
                className="absolute rounded-3xl border-2 border-[#00c2cb]/70 bg-white/50 bottom-43 right-43"
                style={{
                  width: "clamp(260px, 20vw, 200px)",
                  height: "clamp(260px, 20vw, 200px)",
                  transform: "translate(-70px, 10px)",
                  zIndex: 0,
                }}
              />

              <div
                className="absolute rounded-3xl border-2 border-[#00c2cb]/60 bg-white/40 top-43 left-43"
                style={{
                  width: "clamp(260px, 20vw, 200px)",
                  height: "clamp(260px, 20vw, 200px)",
                  transform: "translate(70px, 10px)",
                  zIndex: 0,
                }}
              />

              <div
                className="absolute rounded-full"
                style={{
                  width: "clamp(280px, 36vw, 360px)",
                  height: "clamp(280px, 36vw, 360px)",
                  background: "rgba(0,194,203,0.16)",
                  filter: "blur(35px)",
                  zIndex: 0,
                }}
              />

              {/* only this inner box will crossfade */}
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={currentSlide}
                  custom={direction}
                  variants={imageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ opacity: { duration: 0.45 }, scale: { duration: 0.45 } }}
                  className="relative rounded-3xl p-[3px] bg-linear-to-b from-cyan-300 via-[#00c2cb] to-teal-600 shadow-[0_0_35px_rgba(0,194,203,0.45)]"
                  style={{
                    width: "clamp(280px, 34vw, 340px)",
                    height: "clamp(280px, 34vw, 340px)",
                    zIndex: 2,
                  }}
                >
                  <div className="relative h-full w-full bg-white rounded-3xl overflow-hidden flex items-center justify-center">
                    <div className="relative w-full h-full rounded-2xl flex items-center justify-center overflow-hidden">
                      {slide.imagePath ? (
                        <Image
                          src={slide.imagePath}
                          alt="Slide visual"
                          fill
                          draggable={false}
                          className="object-contain"
                          sizes="(min-width: 1280px) 340px, (min-width: 1024px) 320px, 280px"
                          priority
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6">
                          {Icon && <Icon className="w-20 h-20 text-gray-300 mb-4" />}
                          <p className="text-gray-400 text-center">No Image Available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 w-full flex justify-center">
            <Button
              onClick={onStartClick}
              className="bg-[#00c2cb] hover:bg-[#00adb5] text-white px-12 py-8 lg:py-9 rounded-2xl transition-all duration-200 font-bold text-xl lg:text-2xl shadow-xl hover:shadow-2xl animate-heartbeat hover:animate-none transform hover:-translate-y-1 hover:scale-105 cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <Spinner
                    size="md"
                    className="mr-3"
                    label="Starting"
                    trackClassName="border-white/30"
                    indicatorClassName="border-white border-t-transparent"
                  />
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
