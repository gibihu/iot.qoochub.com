'use client';

import { useState, useRef, useEffect, JSX } from 'react';
import { Pipette } from 'lucide-react';
import { Input } from '../ui/input';

interface ColorPickerProps {
    value?: string;
    onChange?: (color: string) => void;
    onSubmit?: (color: string) => void;
}

export function ColorPicker({ value = '#ffffff', onChange, onSubmit }: ColorPickerProps): JSX.Element {
    const [h, setH] = useState<number>(0);
    const [s, setS] = useState<number>(0);
    const [b, setB] = useState<number>(100);
    const [hex, setHex] = useState<string>(value);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // HSB to Hex
    const hsbToHex = (h: number, s: number, b: number): string => {
        const c = (b / 100) * (s / 100);
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = b / 100 - c;

        let r, g, bi;
        if (h >= 0 && h < 60) [r, g, bi] = [c, x, 0];
        else if (h >= 60 && h < 120) [r, g, bi] = [x, c, 0];
        else if (h >= 120 && h < 180) [r, g, bi] = [0, c, x];
        else if (h >= 180 && h < 240) [r, g, bi] = [0, x, c];
        else if (h >= 240 && h < 300) [r, g, bi] = [x, 0, c];
        else[r, g, bi] = [c, 0, x];

        const toHex = (n: number) => {
            const hex = Math.round((n + m) * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(bi)}`.toUpperCase();
    };

    // Hex to HSB
    const hexToHsb = (hexColor: string): { h: number; s: number; b: number } => {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const bi = parseInt(hex.substring(4, 6), 16) / 255;

        const max = Math.max(r, g, bi);
        const min = Math.min(r, g, bi);
        const d = max - min;

        let h = 0;
        if (max !== min) {
            switch (max) {
                case r:
                    h = ((g - bi) / d + (g < bi ? 6 : 0)) / 6;
                    break;
                case g:
                    h = ((bi - r) / d + 2) / 6;
                    break;
                case bi:
                    h = ((r - g) / d + 4) / 6;
                    break;
            }
        }

        const s = max === 0 ? 0 : d / max;
        const brightness = max;

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            b: Math.round(brightness * 100),
        };
    };

    // Draw color gradient (saturation x brightness)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const saturation = (x / width) * 100;
                const brightness = ((height - y) / height) * 100;
                const color = hsbToHex(h, saturation, brightness);
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }, [h]);

    // Update color from canvas position
    const updateColorFromPosition = (e: React.MouseEvent<HTMLCanvasElement>): void => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

        const newS = Math.round((x / rect.width) * 100);
        const newB = Math.round(((rect.height - y) / rect.height) * 100);

        setS(newS);
        setB(newB);

        const newHex = hsbToHex(h, newS, newB);
        setHex(newHex);
        onChange?.(newHex);
    };

    // Handle mouse down
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>): void => {
        setIsDragging(true);
        updateColorFromPosition(e);
    };

    // Handle mouse move
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>): void => {
        if (isDragging) {
            updateColorFromPosition(e);
        }
    };

    // Handle mouse up
    const handleMouseUp = (): void => {
        setIsDragging(false);
    };

    // Handle hue slider change
    const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const newH = parseInt(e.target.value);
        setH(newH);
        const newHex = hsbToHex(newH, s, b);
        setHex(newHex);
        onChange?.(newHex);
    };

    // Handle brightness slider change
    const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const newB = parseInt(e.target.value);
        setB(newB);
        const newHex = hsbToHex(h, s, newB);
        setHex(newHex);
        onChange?.(newHex);
    };

    // Handle hex input change
    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        let value = e.target.value;
        if (!value.startsWith('#')) value = '#' + value;
        setHex(value.toUpperCase());

        if (/^#[0-9A-F]{6}$/i.test(value)) {
            const hsb = hexToHsb(value);
            setH(hsb.h);
            setS(hsb.s);
            setB(hsb.b);
            onChange?.(value.toUpperCase());
        }
    };

    // Handle hex input key press (Enter)
    const handleHexKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            if (/^#[0-9A-F]{6}$/i.test(hex)) {
                onSubmit?.(hex);
            }
        }
    };

    return (
        <div className="flex flex-col gap-1 w-full max-w-sm">
            {/* Color Preview */}

            {/* Color Gradient Canvas */}
            <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700">
                    เลือกสี
                </label>
                <div className="relative inline-block w-full">
                    <canvas
                        ref={canvasRef}
                        width={300}
                        height={200}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className="w-full h-40 border-2 border-gray-300 rounded-lg cursor-crosshair bg-white"
                    />
                    {/* Circle Indicator */}
                    <div
                        className="absolute w-5 h-5 border-2 border-white rounded-full pointer-events-none"
                        style={{
                            left: `${s}%`,
                            top: `${100 - b}%`,
                            transform: 'translate(-50%, -50%)',
                            boxShadow: '0 0 0 1px black, 0 0 0 3px white',
                        }}
                    />
                </div>
            </div>

            {/* Hue Slider */}
            <div className="">
                <label className="block text-sm font-medium text-gray-700">
                    สี
                </label>
                <input
                    type="range"
                    min="0"
                    max="360"
                    value={h}
                    onChange={handleHueChange}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, 
              hsl(0, 100%, 50%), 
              hsl(60, 100%, 50%), 
              hsl(120, 100%, 50%), 
              hsl(180, 100%, 50%), 
              hsl(240, 100%, 50%), 
              hsl(300, 100%, 50%), 
              hsl(360, 100%, 50%))`,
                    }}
                />
            </div>

            {/* Brightness Slider */}
            <div className="">
                <label className="block text-sm font-medium text-gray-700">
                    ความสว่าง
                </label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={b}
                    onChange={handleBrightnessChange}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, 
              ${hsbToHex(h, 0, 0)}, 
              ${hsbToHex(h, 0, 50)}, 
              ${hsbToHex(h, 0, 100)})`,
                    }}
                />
            </div>

            {/* Hex Input */}
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                        ค่าสี
                    </label>
                    <div className="flex gap-1">

                        <div
                            className="w-15 rounded-lg border-2 border-gray-300 transition-colors"
                            style={{ backgroundColor: hex }}
                        />
                        <Input
                            type="text"
                            value={hex}
                            onChange={handleHexChange}
                            onKeyPress={handleHexKeyPress}
                            placeholder="#FFFFFF"
                            maxLength={7}
                        />
                    </div>
                </div>
                <div className="mt-6">
                    <Pipette className="w-5 h-5 text-gray-600" />
                </div>
            </div>
        </div>
    );
}