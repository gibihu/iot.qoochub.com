'use client'

import { AudioWaveform, Command, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu
} from "@/components/ui/sidebar";
import { NavType } from "@/types/app";
import { DeviceType, PinType } from "@/types/device";
import { toast } from "sonner";
import { NavMain } from "./nav-main";
import { TeamSwitcher } from "./team-swicher";
import { Device } from "@/utils/device";

// This is sample data.
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: Command,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [device, setdevice] = useState<DeviceType[]>([]);
  const [menuSider, setMenuSider] = useState<NavType>(data);
  const [isFetch, setIsFetch] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await Device.get();
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
  }, []);

  useEffect(() => {
    if (device && device.length > 0) {
      const tokenNav = device.map((driv: DeviceType) => ({
        title: driv.name,
        url: `/device/${driv.id}`,
        items: driv.items.map((item: PinType) => ({
          title: item.name,
          url: "#"
        }))
      }));

      // เพิ่มเข้าไปใน data.navMain
      const newTokenNav = tokenNav.filter((tokenItem: any) => {
        // check ว่า token นี้ยังไม่มีใน navMain
        return !menuSider.navMain.some((nav: any) => nav.token !== tokenItem.token);
      });

      console.log(newTokenNav);
      // เพิ่มเฉพาะ token ใหม่
      if (newTokenNav.length > 0) {
        setMenuSider({
          ...menuSider,
          navMain: [...menuSider.navMain, ...newTokenNav],
        });
      }
    }
  }, [device]);

  return (
    <Sidebar variant='floating' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {isFetch ? (
              <div className="flex justify-center">
                <LoaderCircle className="size-4  animate-spin" />
              </div>
            ) : (
              <NavMain items={menuSider.navMain}/>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
