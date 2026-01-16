import { DeviceType, PinPropertyType, PinType } from "@/types/device";
import { v4 as uuidv4 } from "uuid";
import { DeviceModel } from "./DeviceModel";
import { PinHistoryModel } from "./devices/pins/PinHistoryModel";


export class PinModel {

    static async create(driv_id: string, data: any) {
        const datas = DeviceModel.readFile();
        const now = new Date().toISOString();
        // const hashed = await bcrypt.hash(token, 2);


        const device = datas.find((d: DeviceType) => d.id === driv_id);
        if (!device) return null; // ถ้าไม่เจอ device
        const maxSort = Math.max(...device.items.map(i => Number(i.sort)));

        const id = uuidv4();
        const property: PinPropertyType = {
            widget: data.widget ?? 'switch',
            color: data.color ?? '#16a34a',
            width: data.width ?? 1,
            height: data.height ?? 1,
            delay_sec: data.delay_sec ?? 3,
        };
        const newData: PinType = {
            id: id,
            name: data.name ?? "Pin_" + id,
            type: data.type,
            pin: data.pin,
            value: data.value,
            sort: maxSort,
            min_value: data.type == 'virtual' ? 0 : data.min_value,
            max_value: data.type == 'virtual' ? 1 : data.max_value,
            property: property,
            created_at: now,
            updated_at: now,
        };

        device.items.push(newData);
        device.updated_at = now;

        // ต้อง reassign array เพื่อให้ JSON update
        datas[datas.indexOf(device)] = device;

        // เขียนกลับไฟล์
        DeviceModel.writeFile(datas);
        return device;
    }

    static async update(driv_id: string, data: Partial<any> & { id: string }) {
        const db = await DeviceModel.readFile();
        const now = new Date().toISOString();

        // หา device ตาม id
        const deviceIndex = db.findIndex((d) => d.id === driv_id);
        if (deviceIndex === -1) return null; // ถ้าไม่เจอ device

        const device = db[deviceIndex];

        // หา item ตาม id
        const itemIndex = device.items.findIndex((i) => i.id === data.id);
        if (itemIndex === -1) return null; // ถ้าไม่เจอ item

        const item = device.items[itemIndex];
        // const maxItem = device.items.reduce((max, item) =>
        //     item.sort > max.sort ? item : max
        // )
        const maxSort = data.sort ?? Math.max(...device.items.map(i => Number(i.sort)));


        const property: PinPropertyType = {
            widget: data.widget ?? item.property.widget,
            color: data.color ?? item.property.color,
            width: data.width ?? item.property.width,
            height: data.height ?? item.property.height,
            delay_sec: data.delay_sec ?? (item.property.delay_sec ?? 3),
        };
        const updateData: PinType = {
            id: item.id,
            name: data.name ?? item.name,
            type: data.type ?? item.type,
            pin: data.pin ?? item.pin,
            sort: maxSort,
            value: data.type == 'virtual' ? (data.value <= 1 ? data.value : 0) : (data.value ?? item.min_value),
            min_value: data.type == 'virtual' ? 0 : (data.min_value ?? item.min_value),
            max_value: data.type == 'virtual' ? 1 : (data.max_value ?? item.max_value),
            property: property,
            updated_at: now,
            created_at: item.created_at,
        };

        // merge เฉพาะ field ที่ส่งมา
        device.items[itemIndex] = {
            ...updateData,
        };

        // update device updated_at
        device.updated_at = now;

        // update device ใน db
        db[deviceIndex] = device;

        // เขียนกลับไฟล์
        await DeviceModel.writeFile(db);

        const date = now.slice(0, 10);
        const time = now.slice(11, 16);

        PinHistoryModel.addChangeIf(
            {
                device_id: driv_id,
                item_id: item.id,
                date: date,
            },
            {
                time: time,
                value: updateData.value,
            }
        )

        return device;
    }

    static async delete(driv_id: string, pinId: string) {
        const db = await DeviceModel.readFile();
        const now = new Date().toISOString();

        // หา device ตาม id
        const deviceIndex = db.findIndex((d) => d.id === driv_id);
        if (deviceIndex === -1) return null; // ถ้าไม่เจอ device

        const device = db[deviceIndex];

        // หา item ตาม pinId
        const itemIndex = device.items.findIndex((i: any) => i.id === pinId);
        if (itemIndex === -1) return null; // ถ้าไม่เจอ item

        // ลบ item ออกจาก items
        device.items.splice(itemIndex, 1);

        // อัปเดตเวลาล่าสุด
        device.updated_at = now;

        // บันทึกกลับ
        db[deviceIndex] = device;
        await DeviceModel.writeFile(db);

        return device;
    }

    static async updateAllItems(device_id: string, updates: Partial<PinType>[]) {
        const db = await DeviceModel.readFile();
        const now = new Date().toISOString();

        // หา device
        const deviceIndex = db.findIndex((d) => d.id === device_id);
        if (deviceIndex === -1) return null;

        const device = db[deviceIndex];
        const updatedItems: PinType[] = [];

        for (const updated of updates) {
            const update = updated as PinType;
            const itemIndex = device.items.findIndex((i) => i.id === update.id);
            const ppt = update.property as PinPropertyType;
            if (itemIndex === -1) continue; // ถ้าไม่เจอ item ข้ามไป

            const item = device.items[itemIndex];

            const property: PinPropertyType = {
                widget: ppt.widget ?? item.property.widget,
                color: ppt.color ?? item.property.color,
                width: ppt.width ?? item.property.width,
                height: ppt.height ?? item.property.height,
                delay_sec: ppt.delay_sec ?? (item.property.delay_sec ?? 3),
            };

            const newItem: PinType = {
                id: item.id,
                name: update.name ?? item.name,
                type: update.type ?? item.type,
                pin: update.pin ?? item.pin,
                sort: update.sort ?? item.sort, // ✅ ใช้ sort ที่ส่งมาจาก frontend
                value: update.type == 'virtual' ? (update.value <= 1 ? update.value : 0) : (update.value ?? item.min_value),
                min_value:
                    update.type == 'virtual' ? 0 : update.min_value ?? item.min_value,
                max_value:
                    update.type == 'virtual' ? 1 : update.max_value ?? item.max_value,
                property,
                updated_at: now,
                created_at: item.created_at,
            };

            device.items[itemIndex] = newItem;
            updatedItems.push(newItem);
        }

        device.updated_at = now;
        db[deviceIndex] = device;
        await DeviceModel.writeFile(db);

        return {
            device_id,
            updated_count: updatedItems.length,
            updated_items: updatedItems,
        };
    }

    static async find(device_id: string, pin_id: string, hide?: string[]): Promise<Partial<PinType> | null> {
        const db = await DeviceModel.readFile();

        // หา device ตาม id
        const device = db.find((d) => d.id === device_id);
        if (!device) return null; // ถ้าไม่เจอ device

        // หา item (pin) ตาม pin_id
        const item = device.items.find((i) => i.id === pin_id);
        if (!item) return null;

        // ถ้าไม่มี hide ให้คืนข้อมูลเต็ม
        if (!hide || hide.length === 0) return item;

        // ลบตัวแปรที่ระบุใน hide array
        const result = { ...item };
        hide.forEach((key) => {
            delete result[key as keyof PinType];
        });

        return result;
    }

}
