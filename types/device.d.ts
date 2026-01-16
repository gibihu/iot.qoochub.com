import { string } from "zod"


export interface DeviceType {
  id: string;
  name: string;
  token: string;
  model_path: string;
  model_name: string;
  model_property: ModelPropertyType;
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
  sort: number;
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

export interface ModelPropertyType {
  model_x: number;
  model_y: number;
  model_z: number;
  model_size: number;
  cam_x: number;
  cam_y: number;
  cam_z: number;
  space_width: string | number;
  space_height: string | number;
  can_mouse: boolean;
  can_zoom: boolean;
  bg: string;
  light_x: number;
  light_y: number;
  light_z: number;
  light_color: string;
  light_power: number;
}


export interface DeviceHisType {
  device_id: string
  items: DevicePinHisType[];
  device?: DeviceType;
}

export interface DevicePinHisType {
  id: string;
  records: DevicePinRecordHisType[];
  pin?: PinType;
}
export interface DevicePinRecordHisType {
  date: string
  changes: DevicePinChageType[]
  summary: DevicePinSummaryShisType
  value_groups: DevicePinValueGroupHisType[]
}
export interface DevicePinChageHisType {
  time: string
  value: number
}
export interface DevicePinSummaryShisType {
  avg_value: number
  min_value: number
  max_value: number
  count: number
}
export interface DevicePinValueGroupHisType {
  value: number
  count: number
}