"use client"

import { Box, ChevronDown, LoaderCircle, Plus } from "lucide-react"
import * as React from "react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { DeviceType } from "@/types/device"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

export function TeamSwitcher({
    teams,
}: {
    teams: {
        name: string
        logo: React.ElementType
        plan: string,
        href: string,
    }[]
}) {
    const [activeTeam, setActiveTeam] = React.useState(teams[0])

    if (!activeTeam) {
        return null
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton className="w-fit px-1.5">
                            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-5 items-center justify-center rounded-md">
                                <activeTeam.logo className="size-3" />
                            </div>
                            <span className="truncate font-medium">{activeTeam.name}</span>
                            <ChevronDown className="opacity-50" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-64 rounded-lg"
                        align="start"
                        side="bottom"
                        sideOffset={4}
                    >
                        {teams.map((team, index) => (
                            <Link href={team.href} key={team.name}>
                                <DropdownMenuItem
                                    onClick={() => setActiveTeam(team)}
                                    className="gap-2 p-2"
                                >
                                    <div className="flex size-6 items-center justify-center rounded-xs border">
                                        <team.logo className="size-4 shrink-0" />
                                    </div>
                                    {team.name}
                                    {/* <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut> */}
                                </DropdownMenuItem>
                            </Link>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <DialogAdddevice className="w-full flex items-center gap-2 p-2 cursor-pointer">
                                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                                    <Plus className="size-4" />
                                </div>
                                <div className="text-muted-foreground font-medium">เพิ่มอุปกรณ์</div>
                            </DialogAdddevice>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}


type DialogAddDeviceProps = React.ComponentProps<"div"> & {
    data?: DeviceType;   // กำหนดเป็น type ของคุณ
    mode?: "add" | "edit";       // หรือ enum/string literal
};
export function DialogAdddevice({
    data,
    mode = 'add',
    children,
    className,
    ...props
}: DialogAddDeviceProps) {
    return (
        <Dialog>
            <DialogTrigger className={cn(className)}>
                {children}
            </DialogTrigger>
            <DialogContent className="max-h-[100svh]">
                <DialogHeader>
                    <DialogTitle>เพิ่มอุปกรณ์</DialogTitle>
                    <DialogDescription asChild>
                        <FormAdddevice data={data} mode={mode} />
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}


function FormAdddevice({ data, mode }: { data?: DeviceType, mode?: 'add' | 'edit' }) {

    const [isFetch, setIsFetch] = React.useState<boolean>(false);
    const [modelFile, setModelFile] = React.useState<File | null>(null);

    const schema = z.object({
        title: z.string().min(1, { message: "กรุณาเพิ่มหัวข้อมทีเด็ด" }).max(200, { message: 'ความยาวต้องไม่เกิน 200 ตัวอักษร' }),
        token: z.string().min(1, { message: "ต้องการ token" }),
        description: z.string().optional(),
    });
    type FormValues = z.infer<typeof schema>;
    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: '',
            token: '',
            description: '',
        },
    });

    // Validation สำหรับไฟล์ 3D
    const validate3DFile = (file: File): boolean => {
        const allowedExtensions = ['.gltf', '.glb', '.obj', '.fbx', '.dae', '.ply', '.stl', '.3ds', '.3mf'];
        const fileName = file.name.toLowerCase();
        const extension = fileName.substring(fileName.lastIndexOf('.'));
        return allowedExtensions.includes(extension);
    };

    function onSubmit(data: FormValues) {
        const fetchData = async () => {
            try {
                setIsFetch(true);
                
                // สร้าง FormData สำหรับส่งข้อมูลและไฟล์
                const formData = new FormData();
                formData.append('title', data.title);
                formData.append('token', data.token);
                formData.append('description', data.description || '');
                
                // ถ้ามีไฟล์ให้ตรวจสอบและเพิ่ม
                if (modelFile) {
                    if (!validate3DFile(modelFile)) {
                        toast.error('กรุณาอัพโหลดไฟล์ 3D เท่านั้น (.gltf, .glb, .obj, .fbx, .dae, .ply, .stl, .3ds, .3mf)');
                        setIsFetch(false);
                        return;
                    }
                    formData.append('model', modelFile);
                }

                const res = await fetch('/api/device/data', {
                    method: 'POST',
                    body: formData
                });

                const result = await res.json();
                if (result.code == 201) {
                    toast.success(result.message);
                    window.location.reload();
                } else {
                    toast.error(result.message + ` #${result.code}`);
                    setIsFetch(false);
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
                setIsFetch(true);
            }
        }

        fetchData();
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
                                    <Input placeholder="ชื่ออุปกรณ์" {...field} />
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
                                <Input placeholder="D4sxwuS4..." type="text" {...field} />
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
                                <Textarea placeholder="ไม่มีระบบเซ็นเซอร์คำ" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormItem>
                    <FormLabel>ไฟล์โมเดล 3D (ไม่บังคับ)</FormLabel>
                    <FormControl>
                        <Input
                            type="file"
                            accept=".gltf,.glb,.obj,.fbx,.dae,.ply,.stl,.3ds,.3mf"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const allowedExtensions = ['.gltf', '.glb', '.obj', '.fbx', '.dae', '.ply', '.stl', '.3ds', '.3mf'];
                                    const fileName = file.name.toLowerCase();
                                    const extension = fileName.substring(fileName.lastIndexOf('.'));
                                    if (allowedExtensions.includes(extension)) {
                                        setModelFile(file);
                                    } else {
                                        toast.error('กรุณาอัพโหลดไฟล์ 3D เท่านั้น (.gltf, .glb, .obj, .fbx, .dae, .ply, .stl, .3ds, .3mf)');
                                        e.target.value = '';
                                        setModelFile(null);
                                    }
                                } else {
                                    setModelFile(null);
                                }
                            }}
                        />
                    </FormControl>
                    <FormDescription>
                        รองรับไฟล์: .gltf, .glb, .obj, .fbx, .dae, .ply, .stl, .3ds, .3mf
                        {modelFile && <span className="block mt-1 text-xs text-muted-foreground">ไฟล์ที่เลือก: {modelFile.name}</span>}
                    </FormDescription>
                </FormItem>

                <div className="flex justify-end">
                    <Button type="submit" variant="primary" disabled={isFetch}>
                        {isFetch && <LoaderCircle className="animate-spin size-4" />}
                        บันทึก
                    </Button>
                </div>
            </form>
        </Form>
    );
}
