'use client'

import { Gauge } from "@/components/actions/gauge";
import { Slider } from "@/components/actions/slider";
import { ToggleSwitch } from "@/components/actions/toggle-switch";
import { ColorPicker } from "@/components/customs/color-picker";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { hexToRgb } from "@/lib/color";
import { timeSince } from "@/lib/time";
import { cn } from "@/lib/utils";
// app/user/[id]/page.tsx
import { DeviceType, PinType } from "@/types/device";
import { DeviceModel } from "@/utils/device";
import { Pin } from "@/utils/pin";
import {
    closestCenter,
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, GripHorizontal, GripVertical, LoaderCircle, Plus, Terminal } from "lucide-react";
import Link from "next/link";
import { JSX, use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const type_options = {
    virtual: [
        'V0',
        'V1',
        'V2',
        'V3',
        'V4',
        'V5',
        'V6',
        'V7',
        'V8',
        'V9',
    ],
    analog: [
        'A0',
        'A1',
        'A2',
        'A3',
        'A4',
        'A5',
        'A6',
        'A7',
        'A8',
        'A9',
    ],
};

export default function UserPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params); // ✅ unwrap params
    const { id } = unwrappedParams;
    const [device, setdevice] = useState<DeviceType>();
    const [iseLoad, setIsLoad] = useState<boolean>(true);
    const [isFetch, setIsFetch] = useState<boolean>(true);
    const [reGet, setReGet] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsFetch(true);
                const data = await DeviceModel.find(id) as any;
                console.log(data);
                setdevice(data.data);
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
                setReGet(false);
                setIsLoad(false);
            }
        }
        fetchData();
    }, [id, reGet]);



    const [isFormFetch, setIsFormFetch] = useState<boolean>(false);
    const [isAddCardOpen, setIsAddCardOpen] = useState<boolean>(false);


    return (
        <div className="h-full">
            {iseLoad ? (
                <div className="flex justify-center">
                    <LoaderCircle className="size-4  animate-spin text-primary" />
                </div>
            ) : (
                <div className="h-full flex flex-col gap-4">
                    <Card className={cn("flex flex-row justify-between items-center  px-2 md:px-6 py-4 sticky top-2  backdrop-blur bg-background/50 shadow-xl border-2 border-accent/20  z-50", isFetch ? 'animate-pulse' : '')}>
                        <div className="flex gap-2">
                            <Link href={`/device/${id}/model`}>
                                <Box className="size-12  text-primary" />
                            </Link>
                            <div className="flex flex-col gap-0">
                                <span className="text-xl  font-bold">{device?.name}</span>
                                <span>{device?.description}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <PinForm deviceId={id} isOpen={isAddCardOpen} onOpenChange={e => setIsAddCardOpen(e)} forceReGet={e => setReGet(e)}>
                                <Button variant="outline_primary" className="size-10 bg-accent/50" onClick={() => setIsAddCardOpen(true)} disabled={isFetch}>
                                    {isFetch ? (
                                        <LoaderCircle className="size-6 animate-spin" />
                                    ) : (
                                        <Plus className="size-6" />
                                    )}
                                </Button>
                            </PinForm>
                        </div>
                    </Card>

                    <div className="w-full h-full flex flex-col gap-4 items-center">
                        {device && (<AvtionArea raw={device} items={device?.items} forceReGet={e => setReGet(e)} />)}
                    </div>

                </div>
            )}
        </div>
    );
}
function SortableItem({
    item,
    raw,
    onEdit,
    onDelete,
    onChange,
}: {
    item: PinType;
    raw: DeviceType;
    onEdit: (item: PinType) => void;
    onDelete: (item: PinType) => void;
    onChange: (updatedItem: PinType) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: "grab",
    };

    const ppt = item.property;

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <ContextMenu>
                <ContextMenuTrigger>
                    <div className="relative">
                        {/* ปุ่มจับลาก */}
                        <div
                            {...listeners}
                            className="absolute w-full  top-1  text-muted-foreground   flex justify-center"
                            title="ลากเพื่อย้ายตำแหน่ง"
                        >
                            <GripHorizontal className="size-4 cursor-grab" />
                        </div>

                        {/* เนื้อหาปกติ */}
                        {(() => {
                            switch (ppt.widget) {
                                case "slider":
                                    return (
                                        <Slider raw={raw} data={item} onChange={onChange} />
                                    );
                                case "gauge":
                                    return (
                                        <Gauge raw={raw} data={item} onChange={onChange} />
                                    );
                                default:
                                    return <ToggleSwitch raw={raw} data={item} />;
                            }
                        })()}
                    </div>
                </ContextMenuTrigger>

                <ContextMenuContent>
                    <ContextMenuItem onClick={() => onEdit(item)}>แก้ไข</ContextMenuItem>
                    <ContextMenuItem onClick={() => onDelete(item)}>ลบ</ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        </div>
    );
}


export function AvtionArea({
    raw,
    items,
    forceReGet,
}: {
    raw: DeviceType;
    items: PinType[];
    forceReGet?: (e: boolean) => void;
}) {
    const [chest, setChest] = useState<PinType[]>(items);
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);
    const [isDeleteDilogOpen, setIsDeleteDilogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<PinType>();
    const [reGet, setReGet] = useState(false);

    const sensors = useSensors(useSensor(PointerSensor));


    useEffect(() => {
        // เรียงลำดับ items ตามค่า 'sort'
        const sortedItems = [...items].sort((a, b) => a.sort - b.sort); // เรียงจากน้อยไปมาก

        // อัพเดทค่าใน state chest
        setChest(sortedItems);
    }, [items]); // useEffect จะทำงานเมื่อ items เปลี่ยนแปลง


    useEffect(() => {
        forceReGet?.(reGet);
        setReGet(false);
    }, [reGet]);

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setChest((prev) => {
            const oldIndex = prev.findIndex((i) => i.id === active.id);
            const newIndex = prev.findIndex((i) => i.id === over.id);
            const newOrder = arrayMove(prev, oldIndex, newIndex);
            // update sort
            const updated = newOrder.map((p, index) => ({ ...p, sort: index + 1 }));
            handleUpdateDBSort(updated);
            return updated;
        });
    };

    const handleUpdateDBSort = async (updated: PinType[]) => {
        const res = await Pin.updateSort(raw, updated);
        const result = await res as any;
        if (result.code == 200) {
            console.log(result.message);
            // toast.success('บันทึกการเปลี่ยนแปลง');
        } else {
            toast.error(result.message + ` #${result.code}`);
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={chest.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="w-full h-full flex flex-wrap gap-4 justify-center items-start">
                    {chest.map((item) => (
                        <SortableItem
                            key={item.id}
                            item={item}
                            raw={raw}
                            onChange={(updatedItem) =>
                                setChest((prev) =>
                                    prev.map((i) =>
                                        i.id === updatedItem.id ? updatedItem : i
                                    )
                                )
                            }
                            onEdit={(item) => {
                                setSelectedItem(item);
                                setIsAddCardOpen(true);
                            }}
                            onDelete={(item) => {
                                setSelectedItem(item);
                                setIsDeleteDilogOpen(true);
                            }}
                        />
                    ))}
                </div>
            </SortableContext>

            <PinForm
                deviceId={raw.id}
                data={selectedItem}
                isOpen={isAddCardOpen}
                onOpenChange={setIsAddCardOpen}
                forceReGet={setReGet}
                mode="edit"
            />

            <PinDelete
                deviceId={raw.id}
                data={selectedItem}
                isOpen={isDeleteDilogOpen}
                onOpenChange={setIsDeleteDilogOpen}
                forceReGet={setReGet}
            />
        </DndContext>
    );
}


interface PinFormProps {
    deviceId: string;
    onChange?: (color: string) => void;
    onSubmit?: (color: string) => void;
    children?: React.ReactNode;
    isOpen: boolean;
    onOpenChange?: (e: boolean) => void;
    data?: PinType;
    mode?: 'add' | 'edit';
    forceReGet?: (e: boolean) => void;
}

export function PinForm({ deviceId, onChange, onSubmit, children, isOpen, onOpenChange, data, mode = 'add', forceReGet }: PinFormProps): JSX.Element {
    const [isFormFetch, setIsFormFetch] = useState<boolean>(false);
    const [reGet, setReGet] = useState<boolean>(false);
    const [isAddCardOpen, setIsAddCardOpen] = useState<boolean>(false);

    useEffect(() => {
        setIsAddCardOpen(isOpen);
    }, [isOpen]);
    useEffect(() => {
        onOpenChange?.(isAddCardOpen);
    }, [isAddCardOpen]);
    useEffect(() => {
        forceReGet?.(reGet);
        setReGet(false);
    }, [reGet]);

    const schema = z.object({
        id: z.string().optional(),
        type: z.string().min(1, { message: "กรุณาเลือก" }),
        pin: z.string().min(1, { message: "กรุณาเลือก" }),
        name: z.string().min(1, { message: "ไม่ใส่ชื่อปรับ 500 Roblux" }).max(50, { message: 'ความยาวต้องไม่เกิน 50 ตัวอักษร' }),
        value: z.number({ message: "ต้องเป็นตัวเลขเท่านั้น" }),
        min_value: z.number({ message: "ต้องเป็นตัวเลขเท่านั้น" }),
        max_value: z.number({ message: "ต้องเป็นตัวเลขเท่านั้น" }),
        delay_sec: z.number({ message: "ต้องเป็นตัวเลขเท่านั้น" }).min(1, { message: "ความถี่ในการส่งต้องกำหนดอย่างน้อย 1 วินาที" }),

        // property
        widget: z.string().min(1, { message: "กรุณาเลือก" }),
        color: z.string().min(1, { message: "กรุณาเลือก" }),
        width: z.number().min(1, { message: "กรุณาเลือก" }),
        height: z.number().min(1, { message: "กรุณาเลือก" }),
        sort: z.number().optional(),
    });
    type FormValues = z.infer<typeof schema>;
    const ppt = data?.property ?? null;

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            value: 0,
            min_value: 0,
            max_value: 100,
            pin: '',
            type: 'virtual',
            widget: 'switch',
            color: '#16a34a',
            width: 1,
            height: 1,
            delay_sec: 3,
        },
    });

    // เมื่อ data พร้อม ค่อย reset ค่า
    useEffect(() => {
        if (mode !== 'add' && data) {
            const ppt = data.property;
            form.reset({
                id: data.id,
                name: data.name ?? '',
                value: data.value ?? 0,
                min_value: data.min_value ?? 0,
                max_value: data.max_value ?? 100,
                pin: data.pin ?? '',
                type: data.type ?? 'virtual',
                widget: ppt?.widget ?? 'switch',
                color: ppt?.color ?? '#16a34a',
                width: ppt?.width ?? 1,
                height: ppt?.height ?? 1,
                delay_sec: ppt?.delay_sec ?? 3,
            });
        }
    }, [data, mode]);


    function handleSubmit(fielData: FormValues) {
        const fetchData = async () => {
            try {
                setIsFormFetch(true);
                let payload = { ...fielData };

                if (mode !== 'add') {
                    payload.sort = data?.sort;
                }
                const res = await fetch(`/api/device/pin/${deviceId}`, {
                    method: mode === 'add' ? 'POST' : 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });

                const result = await res.json();
                if (res.ok) {
                    toast.success(result.message);
                    setReGet(true);
                    setIsAddCardOpen(false);
                    form.reset();
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
                setIsFormFetch(false);
            }
        }

        fetchData();
    }


    const select_type = form.watch('type');

    const widgetSelecter: { title: string, value: string }[] = [
        { title: 'สวิตซ์', value: 'switch' },
        { title: 'สไลเดอร์', value: 'slider' },
        { title: 'ตัวเลข (รอ)', value: 'number_input' },
        { title: 'เกจวัด', value: 'gauge' },
        { title: 'เกจวัดเรดาล (รอ)', value: 'radal_gauge' },
    ]

    return (
        <Dialog open={isAddCardOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>เพิ่มสวิตซ์</DialogTitle>
                    <DialogDescription asChild>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
                                <div className="flex gap-2  w-full">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field, fieldState }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>ชื่อ</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ชื่ออุปกรณ์" {...field} />
                                                </FormControl>
                                                {!fieldState ? (
                                                    <FormDescription>ชื่อุปกร์สำหรับเว็บไซต์นี้เท่านั้น</FormDescription>
                                                ) : (
                                                    <FormMessage />
                                                )}
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>ประเถท</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={(val) => field.onChange(val)}
                                                        value={field.value.toString()}
                                                        defaultValue={field.value.toString()}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Type" />
                                                        </SelectTrigger>
                                                        <SelectContent className="capitalize">
                                                            <SelectItem value="virtual">Virtual Pin</SelectItem>
                                                            <SelectItem value="analog">Analog Pin</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {select_type == 'virtual' ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex gap-2">
                                            <FormField
                                                control={form.control}
                                                name="pin"
                                                render={({ field }) => (
                                                    <FormItem className="w-1/3">
                                                        <FormLabel>Pin</FormLabel>
                                                        <FormControl>
                                                            <Select
                                                                onValueChange={(val) => field.onChange(val)}
                                                                value={field.value.toString()}
                                                                defaultValue={field.value.toString()}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Type" />
                                                                </SelectTrigger>
                                                                <SelectContent className="capitalize">
                                                                    {type_options.virtual.map((value: string, index: number) => (
                                                                        <SelectItem value={value ?? ''} key={index}>{value}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="value"
                                                render={({ field }) => (
                                                    <FormItem className="w-2/3">
                                                        <FormLabel>value</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="ค่า" type="number" defaultValue={field.value} min={0} max={1} onChange={(e) => field.onChange(Number(e.target.value))} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex gap-2">
                                            <FormField
                                                control={form.control}
                                                name="pin"
                                                render={({ field }) => (
                                                    <FormItem className="w-1/3">
                                                        <FormLabel>Pin</FormLabel>
                                                        <FormControl>
                                                            <Select
                                                                onValueChange={(val) => field.onChange(val)}
                                                                value={field.value.toString()}
                                                                defaultValue={field.value.toString()}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Pin" />
                                                                </SelectTrigger>
                                                                <SelectContent className="capitalize">
                                                                    {type_options.analog.map((value: string, index: number) => (
                                                                        <SelectItem value={value ?? ''} key={index}>{value}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="value"
                                                render={({ field }) => (
                                                    <FormItem className="w-2/3">
                                                        <FormLabel>value</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="ค่า" type="number" defaultValue={field.value} min={form.watch('min_value')} max={form.watch('max_value')} onChange={(e) => field.onChange(Number(e.target.value))} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <FormField
                                                control={form.control}
                                                name="min_value"
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormLabel>min</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="ค่า" defaultValue={form.watch('min_value')} type="number" onChange={(e) => field.onChange(Number(e.target.value))} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="max_value"
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormLabel>max</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="ค่า" defaultValue={form.watch('max_value')} type="number" onChange={(e) => field.onChange(Number(e.target.value))} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}

                                <Accordion type="single" collapsible>
                                    <AccordionItem value="item-1">
                                        <AccordionTrigger>คุณสมบัติ</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-2 gap-2 px-2">

                                                <FormField
                                                    control={form.control}
                                                    name="widget"
                                                    render={({ field }) => (
                                                        <FormItem className="w-full">
                                                            <FormLabel>วิดเจ็ต</FormLabel>
                                                            <FormControl>
                                                                <Select
                                                                    onValueChange={(val) => field.onChange(val)}
                                                                    value={field.value.toString()}
                                                                    defaultValue={field.value.toString()}
                                                                >
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue placeholder="Type" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="capitalize">
                                                                        {widgetSelecter.map((item: { title: string, value: string }, key: number) => (
                                                                            <SelectItem value={item.value} key={key}>{item.title}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="color"
                                                    render={({ field }) => (
                                                        <FormItem className="w-full">
                                                            <FormLabel>สี</FormLabel>
                                                            <FormControl>
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <Input value={field.value} className="text-start" style={{ background: `rgba(${hexToRgb(field.value)}, 0.2)` }} />
                                                                    </PopoverTrigger>
                                                                    <PopoverContent>
                                                                        <ColorPicker
                                                                            value={field.value}
                                                                            onChange={field.onChange}
                                                                        />
                                                                    </PopoverContent>
                                                                </Popover>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="delay_sec"
                                                    render={({ field }) => (
                                                        <FormItem className="w-full col-span-2">
                                                            <FormLabel>หน่วงวินาที</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    type="number"
                                                                    value={field.value}
                                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>


                                <div className="flex justify-end gap-2">
                                    <Button type="button" disabled={isFormFetch} onClick={() => {
                                        setIsAddCardOpen(false);
                                        // form.reset();
                                    }}>
                                        {isFormFetch && <LoaderCircle className="animate-spin size-4" />}
                                        ยกเลิก
                                    </Button>
                                    <Button type="submit" variant="primary" disabled={isFormFetch} onClick={() => setIsAddCardOpen(true)}>
                                        {isFormFetch && <LoaderCircle className="animate-spin size-4" />}
                                        บันทึก
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>

    );
}

function PinDelete({ deviceId, isOpen, onOpenChange, data, forceReGet }: PinFormProps): JSX.Element {
    const [isDeleteDilogOpen, setIsDeleteDilogOpen] = useState<boolean>(false);
    const [reGet, setReGet] = useState<boolean>(false);
    const [isFetch, setIsFetch] = useState<boolean>(false);

    useEffect(() => {
        setIsDeleteDilogOpen(isOpen);
    }, [isOpen]);
    useEffect(() => {
        onOpenChange?.(isDeleteDilogOpen);
    }, [isDeleteDilogOpen]);
    useEffect(() => {
        forceReGet?.(reGet);
        setReGet(false);
    }, [reGet]);

    const handleDelete = async () => {
        if (data?.id) {
            setIsFetch(true);
            try {
                const res = await Pin.delete(deviceId, data.id);
                const result = await res;
                if (result.code === 200) {
                    toast.success(result.message);
                    setReGet(true);
                    setIsDeleteDilogOpen(false);
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
    }

    return (
        <Dialog open={isDeleteDilogOpen} onOpenChange={setIsDeleteDilogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>ต้องการลบ {data?.name} หรือไม่</DialogTitle>
                    <DialogDescription asChild className="text-accent-foreground">
                        <Alert variant="default">
                            <Terminal />
                            <AlertTitle className="text-destructive">หากลบแล้วจะไม่สามารถกู้คืนได้</AlertTitle>
                            <AlertDescription>
                                <ul>
                                    <li>คุณอยู่กับมันมา : {timeSince(data?.created_at ?? '')} แล้ว</li>
                                    <li>ครั้งล่าสุดที่คุณคุยกับมัน : {timeSince(data?.updated_at ?? '')} ที่แล้ว</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </DialogDescription>
                    <DialogFooter>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="destructive" onClick={handleDelete}>
                                    {isFetch && <LoaderCircle className="animate-spin" />}
                                    ยืนยัน
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>หวังว่าคุณไม่ลืมฉัน 😭</p>
                            </TooltipContent>
                        </Tooltip>
                    </DialogFooter>
                </DialogHeader>
            </DialogContent>
        </Dialog>

    );
}