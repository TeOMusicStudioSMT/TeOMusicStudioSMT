import React, { useRef, useEffect, useState } from 'react';

interface VisualizerProps {
    themeImages: string[];
    analyserNode: AnalyserNode | null;
}

const Visualizer: React.FC<VisualizerProps> = ({ themeImages, analyserNode }) => {
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

        const renderFrame = () => {
            animationFrameId = requestAnimationFrame(renderFrame);

            analyserNode.getByteFrequencyData(dataArray);

            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);

            const barWidth = (width / bufferLength) * 1.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] * (height / 255) * 0.8;

                // Gradient from brand-primary (#8A42DB) to brand-secondary (#D94A8C)
                const r = 138 + (dataArray[i]/255) * (217 - 138); 
                const g = 66 + (dataArray[i]/255) * (74 - 66); 
                const b = 219 + (dataArray[i]/255) * (140 - 219); 
                
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                x += barWidth + 2;
            }
        };

        renderFrame();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };

    }, [analyserNode]);
    
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
            <div className="absolute inset-0 bg-black/40" />
            <canvas ref={canvasRef} className="absolute bottom-0 left-0 w-full h-1/4 opacity-70" />
        </div>
    );
};

export default Visualizer;
