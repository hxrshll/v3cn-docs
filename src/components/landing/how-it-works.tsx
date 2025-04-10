"use client";

import type React from "react";
import { memo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { animate } from "motion/react";
import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CardSpotlight } from "../ui/card-spotlight";

interface GlowingEffectProps {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
  variant?: "default" | "white";
  glow?: boolean;
  className?: string;
  disabled?: boolean;
  movementDuration?: number;
  borderWidth?: number;
  borderColor?: string;
}
const GlowingEffect = memo(
  ({
    blur = 0,
    inactiveZone = 0.7,
    proximity = 0,
    spread = 20,
    variant = "default",
    glow = false,
    className,
    movementDuration = 2,
    borderWidth = 1,
    borderColor = "border-gray-800",
    disabled = true,
  }: GlowingEffectProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPosition = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef<number>(0);

    const handleMove = useCallback(
      (e?: MouseEvent | { x: number; y: number }) => {
        if (!containerRef.current) return;

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          const element = containerRef.current;
          if (!element) return;

          const { left, top, width, height } = element.getBoundingClientRect();
          const mouseX = e?.x ?? lastPosition.current.x;
          const mouseY = e?.y ?? lastPosition.current.y;

          if (e) {
            lastPosition.current = { x: mouseX, y: mouseY };
          }

          const center = [left + width * 0.5, top + height * 0.5];
          const distanceFromCenter = Math.hypot(
            mouseX - center[0],
            mouseY - center[1]
          );
          const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

          if (distanceFromCenter < inactiveRadius) {
            element.style.setProperty("--active", "0");
            return;
          }

          const isActive =
            mouseX > left - proximity &&
            mouseX < left + width + proximity &&
            mouseY > top - proximity &&
            mouseY < top + height + proximity;

          element.style.setProperty("--active", isActive ? "1" : "0");

          if (!isActive) return;

          const currentAngle =
            Number.parseFloat(element.style.getPropertyValue("--start")) || 0;
          const targetAngle =
            (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) /
              Math.PI +
            90;

          const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
          const newAngle = currentAngle + angleDiff;

          animate(currentAngle, newAngle, {
            duration: movementDuration,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (value) => {
              element.style.setProperty("--start", String(value));
            },
          });
        });
      },
      [inactiveZone, proximity, movementDuration]
    );

    useEffect(() => {
      if (disabled) return;

      const handleScroll = () => handleMove();
      const handlePointerMove = (e: PointerEvent) => handleMove(e);

      window.addEventListener("scroll", handleScroll, { passive: true });
      document.body.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        window.removeEventListener("scroll", handleScroll);
        document.body.removeEventListener("pointermove", handlePointerMove);
      };
    }, [handleMove, disabled]);

    return (
      <>
        <div
          className={cn(
            "pointer-events-none absolute -inset-px hidden rounded-[inherit] border opacity-0 transition-opacity",
            glow && "opacity-100",
            borderColor,
            variant === "white" && "border-white",
            disabled && "!block"
          )}
          style={{ borderWidth: `${borderWidth}px` }}
        />
        <div
          ref={containerRef}
          style={
            {
              "--blur": `${blur}px`,
              "--spread": spread,
              "--start": "0",
              "--active": "0",
              "--glowingeffect-border-width": `${borderWidth}px`,
              "--repeating-conic-gradient-times": "5",
              "--gradient":
                variant === "white"
                  ? `repeating-conic-gradient(
                  from 236.84deg at 50% 50%,
                  var(--black),
                  var(--black) calc(25% / var(--repeating-conic-gradient-times))
                )`
                  : `radial-gradient(circle, #dd7bbb 10%, #dd7bbb00 20%),
                radial-gradient(circle at 40% 40%, #d79f1e 5%, #d79f1e00 15%),
                radial-gradient(circle at 60% 60%, #5a922c 10%, #5a922c00 20%), 
                radial-gradient(circle at 40% 60%, #4c7894 10%, #4c789400 20%),
                repeating-conic-gradient(
                  from 236.84deg at 50% 50%,
                  #dd7bbb 0%,
                  #d79f1e calc(25% / var(--repeating-conic-gradient-times)),
                  #5a922c calc(50% / var(--repeating-conic-gradient-times)), 
                  #4c7894 calc(75% / var(--repeating-conic-gradient-times)),
                  #dd7bbb calc(100% / var(--repeating-conic-gradient-times))
                )`,
            } as React.CSSProperties
          }
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity",
            glow && "opacity-100",
            blur > 0 && "blur-[var(--blur)] ",
            className,
            disabled && "!hidden"
          )}
        >
          <div
            className={cn(
              "glow",
              "rounded-[inherit]",
              'after:content-[""] after:rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))]',
              "after:[border:var(--glowingeffect-border-width)_solid_transparent]",
              "after:[background:var(--gradient)] after:[background-attachment:fixed]",
              "after:opacity-[var(--active)] after:transition-opacity after:duration-300",
              "after:[mask-clip:padding-box,border-box]",
              "after:[mask-composite:intersect]",
              "after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]"
            )}
          />
        </div>
      </>
    );
  }
);

GlowingEffect.displayName = "GlowingEffect";

interface FeatureCardProps {
  number: string | React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ number, title, description }: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative backdrop-blur-sm p-6 rounded-xl h-full transform-gpu transition-all duration-300 flex flex-col items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <GlowingEffect
        disabled={!isHovered}
        spread={20}
        glow={true}
        proximity={64}
        inactiveZone={0.01}
        borderColor="border-gray-800"
        borderWidth={0.5}
      />

      <div className="flex items-center justify-center relative w-16 h-16 rounded-2xl bg-white border border-gray-300 shadow-sm my-4">
        <span className="text-2xl font-medium text-center w-full">
          {number}
        </span>
      </div>
      <h3 className="font-bold text-white text-2xl mb-4">{title}</h3>
      <p className="text-gray-300 leading-relaxed text-center">{description}</p>
    </div>
  );
}

export function FeaturesSection() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [50, 0]);

  const features = [
    {
      number: "01",
      title: "Install Your Modules",
      description:
        "Begin by installing the necessary modules using: npm install.",
    },
    {
      number: "02",
      title: "Use Our Utility",
      description:
        "After installation, run our npx utility. It automatically detects your node modules to assess which type of project you are using (React or Next.js).",
    },
    {
      number: "03",
      title: "Compatibility",
      description:
        "We are compatible with all routing and folder structures in both React and Next.js, making integration seamless.",
    },
  ];

  const [featureScales] = useState(() => {
    return features.map((_, index) => {
      return (progress: number) => {
        const start = 0.1 * index;
        const end = 0.2 + 0.1 * index;
        if (progress < start) return 0.95;
        if (progress > end) return 1;
        return 0.95 + ((progress - start) / (end - start)) * 0.05;
      };
    });
  });

  return (
    <>
      <style jsx global>{`
        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>

      <section
        style={{
          backgroundImage:
            "radial-gradient(circle at 35% 25%, #ab40ff2e, #fff0 23%), radial-gradient(circle at 25% 35%, #ff000014, #fff0 18%)",
        }}
        ref={sectionRef}
        className="px-4 py-16 md:py-24"
      >
        <motion.div className="mx-auto max-w-7xl" style={{ opacity, y }}>
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div
              className="flex items-center gap-1 px-[10px] py-1 border border-[#5c58673d] rounded-[100px] w-fit text-base"
              style={{
                background:
                  "linear-gradient(180deg, rgba(25, 25, 27, 0.4) 19.09%, #19191B 100%)",
              }}
            >
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #5a606c, #fff 50%, #5a606c)",
                }}
              >
                How it works
              </span>
            </div>
            <div className="bg-clip-text bg-gradient-stop bg-gradient-to-br from-white via-30% via-white to-white/30   py-9 font-bold leading-relaxed  text-transparent text-4xl sm:text-6xl  ">
              Build stunning products at lightning ⚡️ speed.
            </div>
            <p className="mx-auto max-w-2xl text-gray-300 text-lg leading-relaxed">
              Welcome to V3CN! We provide components that are easily available
              for use in the market elsewhere. Combined with our npx utility, it
              is very easy to get started in any type of project, whether it is
              React or Next.js.
            </p>
          </div>

          {/* Features Grid */}
          <div className="gap-12 grid md:grid-cols-3 mt-12 lg:mt-24">
            {features.map((feature, index) => (
              <motion.div
                key={`feature-${index}`}
                style={{ scale: featureScales[index](scrollYProgress.get()) }}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100,
                  damping: 12,
                  mass: 0.9,
                }}
                className="h-full"
              >
                <CardSpotlight>
                  <FeatureCard
                    number={feature.number}
                    title={feature.title}
                    description={feature.description}
                  />
                </CardSpotlight>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </>
  );
}
