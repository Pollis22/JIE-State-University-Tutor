import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  opacity: number;
  symbol?: string;
  isWisconsin?: boolean;
}

// Academic symbols mixed with subtle phrases
const SYMBOLS = ['∑', '∫', 'π', 'Δ', '∞', '≈', '√', 'α', 'β', 'θ', 'λ', '∂', 'φ', '∇', '≡'];
const ACCENT_PHRASES = ['Go State', 'Go State', 'W', 'W'];

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let nodes: Node[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const NODE_COUNT = 55;
    for (let i = 0; i < NODE_COUNT; i++) {
      const roll = Math.random();
      const isWisconsin = roll > 0.82; // ~18% chance of phrase
      const isSymbol = !isWisconsin && roll > 0.55;
      nodes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: 2 + Math.random() * 3,
        opacity: 0.07 + Math.random() * 0.13,
        symbol: isWisconsin
          ? ACCENT_PHRASES[Math.floor(Math.random() * ACCENT_PHRASES.length)]
          : isSymbol
          ? SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
          : undefined,
        isWisconsin,
      });
    }

    const CONNECTION_DIST = 160;
    const CENTER_MARGIN = 420;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;

      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      // Connections — crimson tint
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const aInSide = Math.abs(a.x - cx) > CENTER_MARGIN * 0.55;
          const bInSide = Math.abs(b.x - cx) > CENTER_MARGIN * 0.55;
          if (!aInSide && !bInSide) continue;
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.09;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(197, 5, 12, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Nodes + symbols + phrases
      nodes.forEach(n => {
        const inSide = Math.abs(n.x - cx) > CENTER_MARGIN * 0.45;
        if (!inSide) return;

        const distFromCenter = Math.abs(n.x - cx);
        const fadeStart = CENTER_MARGIN * 0.45;
        const fadeEnd = CENTER_MARGIN * 0.75;
        const fade = distFromCenter < fadeEnd
          ? (distFromCenter - fadeStart) / (fadeEnd - fadeStart)
          : 1;
        const alpha = n.opacity * Math.max(0, Math.min(1, fade));

        if (n.isWisconsin) {
          // "Go State" — slightly larger, italic, crimson
          const fontSize = n.symbol === 'W' ? 18 : 11;
          ctx.font = `italic bold ${fontSize}px Georgia, serif`;
          ctx.fillStyle = `rgba(197, 5, 12, ${alpha * 0.85})`;
          ctx.fillText(n.symbol!, n.x, n.y);
        } else if (n.symbol) {
          ctx.font = `${10 + n.r * 2}px serif`;
          ctx.fillStyle = `rgba(197, 5, 12, ${alpha * 0.75})`;
          ctx.fillText(n.symbol, n.x, n.y);
        } else {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(197, 5, 12, ${alpha})`;
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
