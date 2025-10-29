'use client'

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ConfigType } from "@/types/config";
import { ConfigModel } from "@/utils/config";
import { zodResolver } from "@hookform/resolvers/zod";
import { TooltipTrigger, TooltipContent } from "@radix-ui/react-tooltip";
import { Box, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Tooltip } from "recharts";
import { toast } from "sonner";
import z from "zod";

export default function CinfigAppPage() {
    return (
        <>
            <FormChangeBackground />
        </>
    );
}

function FormChangeBackground() {
    const [isFetch, setIsFetch] = useState<boolean>(false);
    const [bg, setBg] = useState<{ main: string; history: string[] }>({
        main: "",
        history: [],
    });

    useEffect(() => {
        const config = ConfigModel.bg.get();
        setBg(config);
    }, []);

    const schema = z.object({
        url: z.string().optional(),
    });
    type FormValues = z.infer<typeof schema>;
    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            url: ''
        },
    });

    function onSubmit(data: FormValues) {
        const fetchData = async () => {
            try {
                setIsFetch(true);
                const res = ConfigModel.bg.update(data.url as string);
                if (res) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    console.error(res);
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
                setTimeout(() => {
                    setIsFetch(false);
                }, 1000);
            }
        }
        fetchData();
    }

    return (
        <Card className="px-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <FormField
                        control={form.control}
                        name="url"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormLabel>URLs</FormLabel>
                                <FormControl>
                                    <Input placeholder="ลิ้งค์รูปภาพ" {...field} />
                                </FormControl>
                                {!fieldState ? (
                                    <FormDescription>ชื่อุปกร์สำหรับเว็บไซต์นี้เท่านั้น</FormDescription>
                                ) : (
                                    <FormMessage />
                                )}
                            </FormItem>
                        )}
                    />
                    <div className="w-full flex flex-wrap gap-2 items-end">
                        {bg.main && (
                            <img
                                src={bg.main}
                                alt={bg.main}
                                className="size-16 rounded border object-cover"
                            />
                        )}

                        {bg.history &&
                            bg.history.length > 0 &&
                            bg.history.map((item: string, key: number) => (
                                <button key={key} onClick={e => onSubmit({url:item})} className="cursor-pointer" type="button">
                                    <img
                                        src={item}
                                        alt={item}
                                        className="size-12 rounded border object-cover"
                                    />
                                </button>
                            ))}
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isFetch}>
                            {isFetch && <LoaderCircle className="animate-spin size-4" />}
                            บันทึก
                        </Button>
                    </div>
                </form>
            </Form>
        </Card>
    );
}