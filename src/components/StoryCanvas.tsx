"use client";
import { useEffect, useRef } from "react";
import { Animal, Mood } from "@/lib/constants";
import { drawScene } from "@/lib/canvasDraw";

export function StoryCanvas({
  animal,
  mood,
  description,
  reduceMotion = false,
}: {
  animal: Animal;
  mood: Mood;
  description: string;
  reduceMotion?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = (t: number) => {
      timeRef.current = t;
      if (canvas) {
        drawScene(canvas, {
          animal,
          mood,
          sceneDesc: description,
          reduceMotion,
          time: t,
        });
      }
      if (!reduceMotion) {
        rafRef.current = requestAnimationFrame(render);
      }
    };

    // Initial draw
    drawScene(canvas, {
      animal,
      mood,
      sceneDesc: description,
      reduceMotion,
      time: performance.now(),
    });

    if (!reduceMotion) {
      rafRef.current = requestAnimationFrame(render);
    }

    const handleResize = () => {
      if (canvas) {
        drawScene(canvas, {
          animal,
          mood,
          sceneDesc: description,
          reduceMotion,
          time: timeRef.current,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animal, mood, description, reduceMotion]);

  return (
    <div className="w-full aspect-[4/3] md:aspect-[16/10] rounded-[24px] overflow-hidden bg-[#2D2A6E] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
      <canvas ref={canvasRef} className="w-full h-full block" aria-label={`Illustration: ${description}`} />
    </div>
  );
}

export function HeroCanvas({ animal = "Fox", mood = "Calm" as Mood }: { animal?: Animal; mood?: Mood }) {
  return (
    <div className="w-full">
      <StoryCanvas animal={animal} mood={mood} description="soft hill with moon and fox sitting looking at moon, starry sky" reduceMotion={false} />
    </div>
  );
}
