"use client"

import { ChevronRight, LayoutGrid, Plus, type LucideIcon } from "lucide-react"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { DialogAdddevice } from "./team-swicher"

export function NavMain({
    items,
}: {
    items: {
        title: string
        url: string
        icon: LucideIcon
        isActive?: boolean
        items?: {
            title: string
            url: string
        }[]
    }[]
}) {
    return (
        <div className="flex flex-col gap-4">
            <div className="w-full flex gap-2">
                <DialogAdddevice className="flex-1">
                    <SidebarMenuButton asChild tooltip="add" className="bg-white/50  rounded-lg border font-bold h-10 cursor-pointer shadow-md">
                        <div className="flex gap-4 px-4">
                            <Plus />
                            <span>เพิ่มอุปกรณ์</span>
                        </div>
                    </SidebarMenuButton>
                </DialogAdddevice>
                <Link href="/device/list">
                    <SidebarMenuButton asChild tooltip="add" className="w-auto  bg-white/50  rounded-lg border font-bold h-10 cursor-pointer shadow-md">
                        <div className="flex gap-4 px-3">
                            <LayoutGrid />
                            <span className="sr-only">เพิ่มอุปกรณ์</span>
                        </div>
                    </SidebarMenuButton>
                </Link>
            </div>
            <SidebarGroup>
                <SidebarGroupLabel>Devices</SidebarGroupLabel>
                <SidebarMenu>
                    {items.map((item, index) => (
                        <Collapsible key={index} asChild defaultOpen={item.isActive}>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip={item.title}>
                                    <Link href={item.url}>
                                        {item.icon && (<item.icon />)}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                                {item.items?.length ? (
                                    <>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuAction className="data-[state=open]:rotate-90">
                                                <ChevronRight />
                                                <span className="sr-only">Toggle</span>
                                            </SidebarMenuAction>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {item.items?.map((subItem, fev) => (
                                                    <SidebarMenuSubItem key={fev}>
                                                        <SidebarMenuSubButton asChild>
                                                            <a href={subItem.url}>
                                                                <span>{subItem.title}</span>
                                                            </a>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </>
                                ) : null}
                            </SidebarMenuItem>
                        </Collapsible>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        </div>
    )
}
