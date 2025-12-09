
import React, { useRef, useEffect, useState } from 'react';

interface VisualizerProps {
    themeImages: string[];
    analyserNode: AnalyserNode | null;
    variant?: 'standard' | 'gravitational';
}

const Visualizer: React.FC<VisualizerProps> = ({ themeImages, analyserNode, variant = 'standard' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Background image slideshow effect
    useEffect(() => {
        if (themeImages.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % themeImages.length);
        }, 7000);
        return () => clearInterval(interval);
    }, [themeImages]);

    // Canvas drawing effect
    useEffect(() => {
        if (!analyserNode || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        analyserNode.fftSize = 256;
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let animationFrameId: number;
        let rotation = 0;

        const renderFrame = () => {
            animationFrameId = requestAnimationFrame(renderFrame);
            analyserNode.getByteFrequencyData(dataArray);

            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);

            if (variant === 'standard') {
                // Standard Bar Visualizer
                const barWidth = (width / bufferLength) * 1.5;
                let barHeight;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    barHeight = dataArray[i] * (height / 255) * 0.8;
                    const r = 138 + (dataArray[i]/255) * (217 - 138); 
                    const g = 66 + (dataArray[i]/255) * (74 - 66); 
                    const b = 219 + (dataArray[i]/255) * (140 - 219); 
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
                    ctx.fillRect(x, height - barHeight, barWidth, barHeight);
                    x += barWidth + 2;
                }
            } else {
                // Gravitational Rings Visualizer (Live AI Mode)
                const cx = width / 2;
                const cy = height / 2;
                const maxRadius = Math.min(width, height) / 2;
                
                // Rotate the whole canvas slightly for orbital effect
                rotation += 0.005;
                
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(rotation);
                
                // Draw concentric rings based on frequency
                for (let i = 0; i < bufferLength; i += 4) { // Skip some for performance/aesthetics
                    const value = dataArray[i];
                    const percent = value / 255;
                    const radius = (i / bufferLength) * maxRadius * 0.8 + (percent * 30);
                    
                    ctx.beginPath();
                    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
                    
                    // Color shift based on intensity
                    // TeO Palette: #8A42DB (Purple) -> #D94A8C (Pink) -> #3D91E6 (Blue)
                    const r = 138 + percent * 80;
                    const g = 66 + percent * 50;
                    const b = 219 - percent * 50;
                    const a = 0.1 + percent * 0.5;

                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
                    ctx.lineWidth = 2 + percent * 4;
                    ctx.stroke();
                }
                
                // Core pulse
                const bassAvg = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
                const coreRadius = 10 + (bassAvg / 255) * 40;
                ctx.beginPath();
                ctx.arc(0, 0, coreRadius, 0, 2 * Math.PI);
                ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + (bassAvg/255)*0.5})`;
                ctx.fill();

                ctx.restore();
            }
        };

        renderFrame();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };

    }, [analyserNode, variant]);
    
    // Resize canvas to fit parent
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !canvas.parentElement) return;
        
        const resizeObserver = new ResizeObserver(() => {
            canvas.width = canvas.parentElement!.clientWidth;
            canvas.height = canvas.parentElement!.clientHeight;
        });
        
        resizeObserver.observe(canvas.parentElement);
        
        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden bg-black -z-10">
            {themeImages.map((url, index) => (
                <img
                    key={`${url}-${index}`}
                    src={url}
                    alt="Visualizer background"
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out ${
                        index === currentIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                />
            ))}
            <div className={`absolute inset-0 ${variant === 'gravitational' ? 'bg-black/70' : 'bg-black/40'}`} />
            <canvas ref={canvasRef} className={`absolute bottom-0 left-0 w-full h-full ${variant === 'standard' ? 'h-1/4 opacity-70' : ''}`} />
        </div>
    );
};

export default Visualizer;
