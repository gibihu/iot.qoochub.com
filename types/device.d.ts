import { string } from "zod"


export interface DeviceType{
    id: string;
    name: string;
    token: string;
    items: PinType[];
    updated_at?: string;
    created_at?: string;
    description: string;
}


export interface PinType {
    id: string;
    name: string;
    type: string;
    pin: string;
    value: number;
    min_value: number;
    max_value: number;
    property: PinPropertyType;
    updated_at?: string;
    created_at?: string;
}

export interface PinPropertyType {
    widget: string;
    color: string;
    width: number;
    height: number;
    delay_sec: number;
}