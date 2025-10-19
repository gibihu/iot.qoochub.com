export interface NavType{
    teams: {

    }
    navMain: NavG
}


export interface NavGroup {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
        title: string
        url: string
    }[]
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    quantity?: number | string;
    helperAction?: string[{
        title?: string;
        icon?: LucideIcon | null;
        href?: string;
    }];
}