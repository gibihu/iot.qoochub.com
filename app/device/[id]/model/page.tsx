'use client'

import ThreeModelViewer from "@/components/customs/model-viewer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DeviceType } from "@/types/device";
import { DeviceModel } from "@/utils/device";
import { LoaderCircle, Settings2 } from "lucide-react";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function ModelViewerPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params); // ✅ unwrap params
    const { id } = unwrappedParams;
    const [device, setdevice] = useState<DeviceType>();
    const [iseLoad, setIsLoad] = useState<boolean>(true);
    const [isFetch, setIsFetch] = useState<boolean>(true);
    const schema = z.object({
        model_x: z.coerce.number(),
        model_y: z.coerce.number(),
        model_z: z.coerce.number(),
        model_size: z.coerce.number().min(0.01, {message: "ขนาดต้องมากกว่า 0.01"}),
        cam_x: z.coerce.number(),
        cam_y: z.coerce.number(),
        cam_z: z.coerce.number(),
        space_width: z.union([z.string(), z.coerce.number()]),
        space_height: z.union([z.string(), z.coerce.number()]),
        can_mouse: z.coerce.boolean(),
        can_zoom: z.coerce.boolean(),
        bg: z.string(),
        light_x: z.coerce.number(),
        light_y: z.coerce.number(),
        light_z: z.coerce.number(),
        light_color: z.string(),
        light_power: z.coerce.number(),
    });
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            model_x: 0,
            model_y: 0,
            model_z: 0,
            model_size: 1,
            cam_x: 2,
            cam_y: 2,
            cam_z: 2,
            space_width: "100%",
            space_height: "100%",
            can_mouse: true,
            can_zoom: true,
            bg: "#ffffff",
            light_x: 0,
            light_y: 100,
            light_z: 0,
            light_color: "#ffffff",
            light_power: 3,
        }
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsFetch(true);
                const data = await DeviceModel.find(id) as any;
                console.log(data);
                setdevice(data.data);
                const mp = data.data?.model_property ?? {};
                form.reset({
                    model_x: mp.model_x ?? 0,
                    model_y: mp.model_y ?? 0,
                    model_z: mp.model_z ?? 0,
                    model_size: mp.model_size ?? 1,
                    cam_x: mp.cam_x ?? 2,
                    cam_y: mp.cam_y ?? 2,
                    cam_z: mp.cam_z ?? 2,
                    space_width: mp.space_width ?? "100%",
                    space_height: mp.space_height ?? "100%",
                    can_mouse: mp.can_mouse ?? true,
                    can_zoom: mp.can_zoom ?? true,
                    bg: mp.bg ?? "#ffffff",
                    light_x: mp.light_x ?? 0,
                    light_y: mp.light_y ?? 100,
                    light_z: mp.light_z ?? 0,
                    light_color: mp.light_color ?? "#ffffff",
                    light_power: mp.light_power ?? 3,
                });
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
                setIsLoad(false);
            }
        }
        fetchData();
    }, [id]);

    if (iseLoad || isFetch) {
        return (
            <div className="flex justify-center">
                <LoaderCircle className="size-4  animate-spin text-primary" />
            </div>
        );
    }

    if (!device?.model_path) {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                    <span>{device?.name}</span>
                    <span>{device?.model_name}</span>
                </div>
                <div className="flex items-center justify-center p-8 text-gray-500">
                    ไม่มีไฟล์ model
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-between gap-4">
                <div className="flex gap-2 items-end">
                    <span className="text-xl">{device?.name}</span>
                    <span>{device?.model_name}</span>
                </div>
                <div className="flex gap-2 relative">
                    <div className="absolute top-15 right-5">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button>
                                    <Settings2 />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-full">
                                <Form {...form}>
                                    <form
                                        className="flex flex-col gap-3 w-[360px]"
                                        onSubmit={form.handleSubmit(async (values) => {
                                            try {
                                                if (!device) return;
                                                const fd = new FormData();
                                                fd.append('id', device.id);
                                                fd.append('name', device.name);
                                                fd.append('token', device.token);
                                                fd.append('description', device.description ?? '');
                                                fd.append('model_path', device.model_path ?? '');
                                                fd.append('model_property', JSON.stringify(values));
                                                const res = await fetch(`/api/device/${device.id}`, {
                                                    method: 'PATCH',
                                                    body: fd,
                                                });
                                                const result = await res.json();
                                                if (res.ok && result?.data) {
                                                    setdevice(result.data as DeviceType);
                                                    toast.success('บันทึกการตั้งค่าแสดงผลแล้ว');
                                                } else {
                                                    throw new Error(result?.message || 'บันทึกไม่สำเร็จ');
                                                }
                                            } catch (e: any) {
                                                toast.error(e?.message || 'เกิดข้อผิดพลาด');
                                            }
                                        })}
                                    >
                                        <div className="grid grid-cols-2 gap-2">
                                            <FormField
                                                control={form.control}
                                                name="model_x"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>model_x</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" step="any" value={Number(field.value ?? 0)} onChange={e => field.onChange(Number(e.target.value))} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField control={form.control} name="model_y" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>model_y</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="any" value={Number(field.value ?? 0)} onChange={e => field.onChange(Number(e.target.value))} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="model_z" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>model_z</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="any" value={Number(field.value ?? 0)} onChange={e => field.onChange(Number(e.target.value))} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="model_size" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>model_size</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="any" value={Number(field.value ?? 1)} onChange={e => field.onChange(Number(e.target.value))} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="cam_x" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>cam_x</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="any" value={Number(field.value ?? 2)} onChange={e => field.onChange(Number(e.target.value))} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="cam_y" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>cam_y</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="any" value={Number(field.value ?? 2)} onChange={e => field.onChange(Number(e.target.value))} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="cam_z" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>cam_z</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="any" value={Number(field.value ?? 2)} onChange={e => field.onChange(Number(e.target.value))} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="light_x" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>light_x</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="any" value={Number(field.value ?? 0)} onChange={e => field.onChange(Number(e.target.value))} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="light_y" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>light_y</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="any" value={Number(field.value ?? 100)} onChange={e => field.onChange(Number(e.target.value))} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="light_z" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>light_z</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="any" value={Number(field.value ?? 0)} onChange={e => field.onChange(Number(e.target.value))} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="light_power" render={({ field }) => (
                                                <FormItem className="col-span-1">
                                                    <FormLabel>light_power</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="any" value={Number(field.value ?? 3)} onChange={e => field.onChange(Number(e.target.value))} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="light_color" render={({ field }) => (
                                                <FormItem className="col-span-1">
                                                    <FormLabel>light_color</FormLabel>
                                                    <FormControl>
                                                        <Input type="text" step="any" placeholder="#ffffff" value={field.value} onChange={e => field.onChange(e.target.value)} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <FormField control={form.control} name="bg" render={({ field }) => (
                                                <FormItem className="col-span-2">
                                                    <FormLabel>bg</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="#ffffff" value={String(field.value ?? '')} onChange={field.onChange} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="space_width" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>space_width</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="ค่าเริ่มต้น 100%" disabled value={typeof field.value === 'number' ? String(field.value) : String(field.value ?? '')} onChange={field.onChange} />
                                                    </FormControl>
                                                    <FormDescription>เช่น 0-100%</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="space_height" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>space_height</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="ค่าเริ่มต้น 100%" disabled value={typeof field.value === 'number' ? String(field.value) : String(field.value ?? '')} onChange={field.onChange} />
                                                    </FormControl>
                                                    <FormDescription>เช่น 0-100%</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="can_mouse" render={({ field }) => (
                                                <FormItem className="flex items-center gap-2">
                                                    <FormControl>
                                                        <Input type="checkbox" className="size-4" checked={!!field.value} onChange={e => field.onChange(e.target.checked)} />
                                                    </FormControl>
                                                    <FormLabel>หมุนด้วยเมาส์</FormLabel>
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="can_zoom" render={({ field }) => (
                                                <FormItem className="flex items-center gap-2">
                                                    <FormControl>
                                                        <Input type="checkbox" className="size-4"  checked={!!field.value} onChange={e => field.onChange(e.target.checked)} />
                                                    </FormControl>
                                                    <FormLabel>ซูมได้</FormLabel>
                                                </FormItem>
                                            )} />
                                        </div>
                                        <div className="flex justify-end gap-2 mt-2">
                                            <Button type="button" variant="outline" onClick={() => form.reset()}>รีเซ็ต</Button>
                                            <Button type="submit" variant="primary" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
                                        </div>
                                    </form>
                                </Form>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>
            <Card className="rounded-xl overflow-hidden h-full w-full p-0">
                <ThreeModelViewer file={device.model_path}
                    model_x={device.model_property?.model_x}
                    model_y={device.model_property?.model_y}
                    model_z={device.model_property?.model_z}
                    model_size={device.model_property?.model_size}
                    cam_x={device.model_property?.cam_x}
                    cam_y={device.model_property?.cam_y}
                    cam_z={device.model_property?.cam_z}
                    space_width={device.model_property?.space_width}
                    space_height={device.model_property?.space_height}
                    can_mouse={device.model_property?.can_mouse}
                    can_zoom={device.model_property?.can_zoom}
                    bg={device.model_property?.bg}
                    light_x={device.model_property?.light_x}
                    light_y={device.model_property?.light_y}
                    light_z={device.model_property?.light_z}
                    light_color={device.model_property?.light_color}
                    light_power={device.model_property?.light_power}
                />
            </Card>

        </>
    );
}