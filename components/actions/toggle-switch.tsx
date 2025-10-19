import { cn } from "@/lib/utils";
import { DriverType, PinPropertyType, PinType } from "@/types/driver";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Toggle } from "../ui/toggle";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "../ui/context-menu";
import { hexToRgb } from "@/lib/color";


export function ToggleSwitch({ raw, data }: { raw: DriverType, data: PinType }) {
    const [item, setItem] = useState<PinType>(data as PinType);
    const [isOn, setIsOn] = useState<boolean>(item.value == 0 ? false : true);
    const [isFetch, setIsFetch] = useState<boolean>(false);
    const [_token] = useState<string>(raw.token as string);
    const [ppt, setPpt] = useState<PinPropertyType>(item.property);

    useEffect(() => {
        setItem(data);
    }, [data]);
    useEffect(() => {
        setPpt(item.property);
    }, [item]);


    const handleToggle = async (val: number) => {
        try {
            console.log(val);
            setIsFetch(true);
            const res = await fetch(`https://blynk.cloud/external/api/update?token=${_token}&${item.pin}=${val}`);
            if (res.ok) {
                setIsOn(val === 0 ? false : true);
                const updatedItem = { ...item, value: val };
                setItem(updatedItem);
                handleUpdateDB(updatedItem);
            } else {
                setIsOn(val === 0 ? true : false);
                const result = await res.json();
                toast.error("ปลายทางปฏิเสธหรือติดต่อไม่ได้", { description: result.error.message });
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

    const handleUpdateDB = async (updatedItem: typeof item) => {
        try {
            setIsFetch(true);
            const res = await fetch(`/api/driver/${raw.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedItem)
            });
            const result = await res.json();
            if (result.code == 200) {
                toast.success(result.message);
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

    const [bgColorHax, setbgColorHax] = useState<string>(`rgba(${hexToRgb(ppt.color)}, 0.2)`);

    useEffect(() => {
        if (!isOn) {
            setbgColorHax(`rgba(${hexToRgb(ppt.color)}, 0)`);
        } else {
            setbgColorHax(`rgba(${hexToRgb(ppt.color)}, 0.2)`);
        }
    }, [isOn]);


    return (

        <Toggle
            className={cn(
                "border flex flex-col items-center transition  bg-transparent hover:bg-background size-50 shadow-xl cursor-pointer",
                isOn ? "border  data-[state=on]:shadow-inner  shadow-zinc-500/50  scale-99" : ''
            )}
            disabled={isFetch}
            defaultPressed={isOn}
            pressed={isOn}
            onPressedChange={e => {
                const newValue = e ? 1 : 0;
                setIsOn(e);
                handleToggle(newValue);
            }}
            style={{
                borderColor: ppt.color,
                backgroundColor: bgColorHax
            }}

        >
            <div className="w-full h-full flex flex-col justify-between">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs pt-2">{item.pin}</span>
                    {isFetch && (
                        <LoaderCircle className="size-4 animate-spin" />
                    )}
                </div>
                <span className="font-bold h-1/2 mb-2">{item.name ?? 'Switch'}</span>
            </div>
        </Toggle>
    );
}