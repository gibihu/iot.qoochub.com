'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DeviceType } from "@/types/device";
import { DeviceModel } from "@/utils/device";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

export default function DeviceListPage() {
    const [device, setdevice] = useState<DeviceType[]>([]);
    const [isFetch, setIsFetch] = useState<boolean>(true);
    const [reGet, setReget] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await DeviceModel.get();
                console.log(data);
                setdevice(data.data as DeviceType[]);
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
        fetchData();
    }, [reGet]);

    return (
        <div className="flex flex-col gap-4">
            {!isFetch ? (
                device.map((item: DeviceType, key: number) => (
                    <Card className="p-0 shadow-xl" key={key}>
                        <Accordion type="single" collapsible>
                            <AccordionItem value="item-1">
                                <AccordionTrigger className="py-0 cursor-pointer p-4">
                                    <div className="flex justify-between w-full">
                                        <div className="flex flex-col">
                                            <span>{item.name}</span>
                                            <span className="text-xs text-muted-foreground">{item.description}</span>
                                        </div>
                                        <div className="flex gap-2 mt-[2px]">
                                            <span className="text-xs text-muted-foreground">{item.items.length} </span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent asChild>
                                    <div className="flex flex-col gap-2 mt-4">
                                        <FormCard item={item} forceReGet={setReget} returnItem={(e) => {
                                            setdevice(prev =>
                                                prev.map(item =>
                                                    item.id === e.id ? { ...item, ...e } : item
                                                )
                                            );
                                        }}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </Card>
                ))
            ) : (
                <div className="w-full flex justify-center">
                    <LoaderCircle className="size-4 animate-spin" />
                </div>
            )}
        </div>
    );
}

function FormCard({ item, returnItem, forceReGet }: { item: DeviceType, returnItem: (e: DeviceType) => void, forceReGet?: (e: boolean) => void; }) {
    const [isFetch, setIsFetch] = useState<boolean>(false);
    const [openDelAlert, setOpenDelAlert] = useState<boolean>(false);

    const schema = z.object({
        title: z.string().min(1, { message: "กรุณาเพิ่มหัวข้อมทีเด็ด" }).max(200, { message: 'ความยาวต้องไม่เกิน 200 ตัวอักษร' }),
        token: z.string().min(1, { message: "ต้องการ token" }),
        description: z.string().optional(),
    });
    type FormValues = z.infer<typeof schema>;
    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: item.name,
            token: item.token,
            description: item.description,
        },
    });

    async function onSubmit(data: FormValues) {
        const fetchData = async () => {
            try {
                setIsFetch(true);
                const updated = {
                    id: item.id,
                    name: data.title,
                    token: data.token,
                    description: data.description,
                } as DeviceType;
                const res = await DeviceModel.update(updated);

                const result = await res;
                console.log(result);
                if (result.code == 200) {
                    toast.success(result.message);
                    returnItem(result.data as DeviceType);
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

        fetchData();
    }

    async function handlwDelete(id: string) {
        try {
            setIsFetch(true);
            const res = await DeviceModel.delete(id);
            const result = await res;

            if (result.code == 200) {
                toast.success(result.message);
                window.location.reload();
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

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 px-2">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field, fieldState }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <div className="flex gap-1">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" disabled={true} asChild>
                                                <span>
                                                    <Box className="size-4 opacity-50" />
                                                </span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>500 Roblux</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Input placeholder="ชื่ออุปกรณ์" disabled={isFetch} {...field} />
                                </div>
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
                    name="token"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>รหัส token</FormLabel>
                            <FormControl>
                                <Input placeholder="D4sxwuS4..." type="text" disabled={isFetch} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>คำอธิบาย</FormLabel>
                            <FormControl>
                                <Textarea placeholder="ไม่มีระบบเซ็นเซอร์คำ" disabled={isFetch} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />


                <div className="flex justify-end gap-2">
                    <AlertDialog open={openDelAlert}>
                        <AlertDialogTrigger asChild>
                            <Button type="button" disabled={isFetch} className="hover:bg-destructive" onClick={e => setOpenDelAlert(true)}>
                                {isFetch && <LoaderCircle className="animate-spin size-4" />}
                                ลบ
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>คุณแน่ใจแล้วเหรอ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    ลบแกล้วกู้คืนไม่ได้
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <Button variant="outline" disabled={isFetch} onClick={e => setOpenDelAlert(false)}>
                                    {isFetch && <LoaderCircle className="animate-spin size-4" />}
                                    กดผิด
                                </Button>
                                <Button className="hover:bg-destructive" disabled={isFetch} onClick={e => handlwDelete(item.id)}>
                                    {isFetch && <LoaderCircle className="animate-spin size-4" />}
                                    ลบเลย
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button type="submit" disabled={isFetch}>
                        {isFetch && <LoaderCircle className="animate-spin size-4" />}
                        บันทึก
                    </Button>
                </div>
            </form>
        </Form>
    );
}