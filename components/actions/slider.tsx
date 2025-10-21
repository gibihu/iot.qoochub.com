import { useEffect, useRef, useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DeviceType, PinType } from '@/types/device';
import { hexToRgb } from '@/lib/color';
import { toast } from 'sonner';
import { Pin } from '@/utils/pin';
import { Button } from '../ui/button';

type SliderProps = {
    raw: DeviceType;
    data: PinType;
    onChange?: (e: PinType) => void;
};

export function Slider({ raw, data, onChange }: SliderProps) {
    const [_token] = useState<string>(raw.token as string);
    const [value, setValue] = useState(data.value); // ค่าจริง
    const [tempValue, setTempValue] = useState(data.value); // ค่าระหว่างเลื่อน
    const [isFetch, setIsFetch] = useState<boolean>(false);
    const [isFirst, setIsFirst] = useState<boolean>(true);

    useEffect(() => {
        setValue(data.value);
        setTempValue(data.value);
    }, [data]);

    const min_value = data.min_value ?? 0;
    const max_value = data.max_value ?? 100;
    const step = 1;
    const label = data.name ?? 'Value';
    const ppt = data.property;
    const thumbColor = ppt.color ?? '#3b82f6';
    const trackColor = `rgba(${hexToRgb(ppt.color)}, 0.2)`;
    const filledColor = ppt.color ?? '#3b82f6';
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTempValue(Number(e.target.value));
    };

    const handleRelease = () => {
        setValue(tempValue);
        console.log('Final value:', tempValue); // ทําอะไรกับ value ได้ตรงนี้
    };

    const updateTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleIncrement = () => {
        setTempValue((prev) => {
            const next = Math.min(prev + step, max_value);

            if (updateTimeout.current) clearTimeout(updateTimeout.current);
            updateTimeout.current = setTimeout(() => {
                setValue(next);
                console.log('Final value (after delay):', next);
            }, 1000);

            return next;
        });
    };

    const handleDecrement = () => {
        setTempValue((prev) => {
            const next = Math.max(prev - step, min_value);

            if (updateTimeout.current) clearTimeout(updateTimeout.current);
            updateTimeout.current = setTimeout(() => {
                setValue(next);
                console.log('Final value (after delay):', next);
            }, 1000);

            return next;
        });
    };

    const handleUpdateBlynk = async (val: number) => {
        try {
            setIsFetch(true);
            const res = await fetch(`https://blynk.cloud/external/api/update?token=${_token}&${data.pin}=${val}`);
            if (res.ok) {
                const updatedItem = { ...data, value: val };
                handleUpdateDB(updatedItem);
            } else {
                const result = await res.json();
                toast.error("ปลายทางปฏิเสธหรือติดต่อไม่ได้", { description: result.error.message ?? '' });
            }
        } catch (error) {
            console.error('Error:', error);
            let message = "เกิดข้อผิดพลาดบางอย่าง";
            if (error instanceof Error) {
                message = error.message;
            } else if (typeof error === "string") {
                message = error;
            }
            toast.error(message);
        } finally {
            setIsFetch(false);
        }
    }

    const handleUpdateDB = async (updatedItem: PinType) => {
        try {
            setIsFetch(true);
            const res = await Pin.update(raw, updatedItem);
            const result = await res;
            if (result.code == 200) {
                onChange?.(updatedItem);
                console.log(result.message);
                // toast.success('บันทึกการเปลี่ยนแปลง');
            } else {
                toast.error(result.message + ` #${result.code}`);
            }
        } catch (error) {
            console.error('Error:', error);
            let message = "เกิดข้อผิดพลาดบางอย่าง";
            if (error instanceof Error) {
                message = error.message;
            } else if (typeof error === "string") {
                message = error;
            }
            toast.error(message);
        } finally {
            setIsFetch(false);
        }
    }

    useEffect(() => {
        if(isFirst){
            setIsFirst(false);
        }else{
            handleUpdateBlynk(value);
        }
    }, [value]);



    // Calculate percentage for visual feedback
    const percentage = ((tempValue - min_value) / (max_value - min_value)) * 100;

    return (
        <Card className="w-77 h-50  flex flex-col p-0 gap-0 shadow-xl border  rounded-md  cursor-default"
            style={{
                borderColor: ppt.color,
            }}
        >
            <span className='text-xs text-muted-foreground p-2 '>{data.pin}</span>
            <div className="space-y-4  px-4">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <label className="text-xl font-bold text-gray-700"
                        style={{
                            color: ppt.color,
                        }}
                    >
                        {label}
                    </label>
                    <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: thumbColor }}>
                            {tempValue.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Slider with Buttons */}
                <div className="flex items-center gap-3">
                    {/* Minus Button */}
                    <Button
                        onClick={handleDecrement}
                        className="flex-shrink-0 p-2 hover:bg-gray-100  border  rounded-lg transition-colors"
                        style={{
                            color: thumbColor,
                            borderColor: thumbColor,
                        }}
                        disabled={isFetch}
                    >
                        <Minus className='size-4'/>
                    </Button>

                    {/* Slider Container */}
                    <div className="flex-1 relative pt-2 pb-4">
                        <div className="absolute inset-0 flex items-center pointer-events-none">
                            {/* Background track */}
                            <div
                                className="w-full h-2 rounded-full"
                                style={{ backgroundColor: trackColor }}
                            ></div>
                            {/* Filled track */}
                            <div
                                className="absolute h-2 rounded-full"
                                style={{
                                    width: `${percentage}%`,
                                    backgroundColor: filledColor,
                                }}
                            ></div>
                        </div>

                        {/* Slider Input */}
                        <input
                            type="range"
                            min={min_value}
                            max={max_value}
                            step={step}
                            value={tempValue}
                            onChange={handleChange}
                            onMouseUp={handleRelease}
                            onTouchEnd={handleRelease}
                            disabled={isFetch}
                            className="w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer relative z-5 slider-thumb"
                            style={{
                                background: 'transparent',
                                '--thumb-color': isFetch ? trackColor : thumbColor,
                            } as React.CSSProperties}
                        />
                    </div>

                    {/* Plus Button */}
                    <Button
                        onClick={handleIncrement}
                        className="flex-shrink-0 p-2 hover:bg-gray-100  border  rounded-lg transition-colors"
                        style={{
                            color: thumbColor,
                            borderColor: thumbColor,
                        }}
                        disabled={isFetch}
                    >
                        <Plus className='size-4'/>
                    </Button>
                </div>

                {/* Range Display */}
                <div className="flex justify-between text-xs text-gray-600 px-1">
                    <span>{min_value.toLocaleString()}</span>
                    <span>{max_value.toLocaleString()}</span>
                </div>
            </div>

            <style>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--thumb-color, --primary);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
          border: 2px solid white;
          transition: all 0.2s ease;
        }

        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
        }

        .slider-thumb::-webkit-slider-thumb:active {
          transform: scale(0.95);
        }

        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--thumb-color, --primary);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
          border: 2px solid white;
          transition: all 0.2s ease;
        }

        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
        }

        .slider-thumb::-moz-range-track {
          background: transparent;
          border: none;
        }
      `}</style>
        </Card>
    );
}
