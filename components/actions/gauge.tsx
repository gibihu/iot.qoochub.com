import { DeviceType, PinPropertyType, PinType } from "@/types/device";
import { TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import { useEffect, useRef, useState } from "react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "../ui/context-menu";
import { hexToRgb } from "@/lib/color";
import { toast } from "sonner";
import { Pin } from "@/utils/pin";



export const description = "A radial chart with stacked sections"



export function Gauge({ raw, data, onChange }: { raw: DeviceType, data: PinType, onChange?: (e: PinType) => void }) {
    const [item, setItem] = useState<PinType>(data as PinType);
    const [isFetch, setIsFetch] = useState<boolean>(false);
    const [_token] = useState<string>(raw.token as string);
    const [ppt, setPpt] = useState<PinPropertyType>(item.property);
    const [isFirst, setIsFirst] = useState<boolean>(true);


    useEffect(() => {
        setItem(data);
    }, [data]);
    useEffect(() => {
        setPpt(item.property);
    }, [item]);

    const chartConfig = {
        device: {
            label: item.name,
            color: ppt.color,
        },
    } satisfies ChartConfig

    const chartData = [{ month: "Now", index: item.value, max: item.max_value - item.value }]
    const totalVisitors = item.value;

    const handleUpdate = async () => {
        try {
            const res = await fetch(`https://blynk.cloud/external/api/get?token=${raw.token}&${item.pin}`);
            if (res.ok) {
                const result = await res.text();
                const updatedItem = { ...item, value: Number(result) };
                setItem(updatedItem);
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
        }
    }
    const handleUpdateDB = async (updatedItem: typeof item) => {
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

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // เคลียร์ของเก่าก่อนทุกครั้ง
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
            handleUpdate();
        }, 1000 * ppt.delay_sec);

        // cleanup ตอน unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [ppt.delay_sec]);


    return (
        <Card
            className="flex flex-col  p-0 px-2  size-50 gap-1 rounded-lg shadow-xl cursor-default bg-background"
            style={{
                // background: `rgba(${hexToRgb(ppt.color)}, 0.3)`,
                borderColor: ppt.color
            }}
        >
            <CardHeader className="items-center py-2 px-1">
                <CardDescription className="text-xs">{item.pin}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 p-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square w-full max-w-[250px] max-h-40"
                >
                    <RadialBarChart
                        data={chartData}
                        startAngle={180}
                        endAngle={0}
                        innerRadius={70}
                        outerRadius={110}
                    >
                        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                                                <tspan
                                                    x={(viewBox.cx ?? 1) - 70}
                                                    y={(viewBox.cy || 0) + 20}
                                                    className="fill-muted-foreground"
                                                >
                                                    {item.min_value}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) - 16}
                                                    className="text-2xl font-bold"
                                                    style={{
                                                        fill: ppt.color,
                                                    }}
                                                >
                                                    {totalVisitors.toLocaleString()}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 4}
                                                >
                                                    {item.name}
                                                </tspan>
                                                <tspan
                                                    x={(viewBox.cx ?? 1) * 1.75}
                                                    y={(viewBox.cy || 0) + 20}
                                                >
                                                    {item.max_value}
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </PolarRadiusAxis>
                        <RadialBar
                            dataKey="index"
                            stackId="a"
                            cornerRadius={5}
                            fill={ppt.color}
                            className="stroke-transparent stroke-2"
                        />
                        <RadialBar
                            dataKey="max"
                            stackId="a"
                            cornerRadius={5}
                            fill={`rgba(${hexToRgb(ppt.color)}, 0.2)`}
                            className="stroke-transparent stroke-2 "
                        />
                    </RadialBarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
