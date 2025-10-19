import { DriverType, PinPropertyType, PinType } from "@/types/driver";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
const FilePath = path.join(process.cwd(), "database", "drivers.json");

export class Driver {

    private static readFile(): DriverType[] {
        try {
            const data = fs.readFileSync(FilePath, "utf-8");
            return JSON.parse(data);
        } catch {
            return [];
        }
    }
    private static writeFile(drivers: DriverType[]) {
        const dir = path.dirname(FilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(FilePath, JSON.stringify(drivers, null, 2));
    }

    static async createToken(token: string, name: string, description: string): Promise<DriverType> {
        const datas = this.readFile();
        const now = new Date().toISOString();
        // const hashed = await bcrypt.hash(token, 2);

        const newData: DriverType = {
            id: uuidv4(),
            name: name ?? "driver_" + token,
            token: token,
            description: description,
            items: [],
            created_at: now,
            updated_at: now,
        };

        datas.push(newData);
        this.writeFile(datas);
        return newData;
    }
    static async addItem(driv_id: string, data: any) {
        const datas = this.readFile();
        const now = new Date().toISOString();
        // const hashed = await bcrypt.hash(token, 2);


        const driver = datas.find((d: DriverType) => d.id === driv_id);
        if (!driver) return null; // ถ้าไม่เจอ driver

        const id = uuidv4();
        const property: PinPropertyType = {
            widget: data.widget ?? 'switch',
            color: data.color ?? 'var(--primary)',
            width: data.width ?? 1,
            height: data.height ?? 1,
        };
        const newData: PinType = {
            id: id,
            name: data.name ?? "Pin_" + id,
            type: data.type,
            pin: data.pin,
            value: data.value,
            min_value: data.min_value,
            max_value: data.max_value,
            property: property,
            created_at: now,
            updated_at: now,
        };

        driver.items.push(newData);
        driver.updated_at = now;

        // ต้อง reassign array เพื่อให้ JSON update
        datas[datas.indexOf(driver)] = driver;

        // เขียนกลับไฟล์
        this.writeFile(datas);
        return driver;
    }

    static async update(driv_id: string, data: Partial<any> & { id: string }) {
        const db = await this.readFile();
        const now = new Date().toISOString();

        // หา driver ตาม id
        const driverIndex = db.findIndex((d) => d.id === driv_id);
        if (driverIndex === -1) return null; // ถ้าไม่เจอ driver

        const driver = db[driverIndex];

        // หา item ตาม id
        const itemIndex = driver.items.findIndex((i) => i.id === data.id);
        if (itemIndex === -1) return null; // ถ้าไม่เจอ item

        const item = driver.items[itemIndex];
        
        const property: PinPropertyType = {
            widget: data.widget ?? item.property.widget,
            color: data.color ?? item.property.color,
            width: data.width ?? item.property.widget,
            height: data.height ?? item.property.height,
        };
        const updateData: PinType = {
            id: item.id,
            name: data.name ?? item.name,
            type: data.type ?? item.type,
            pin: data.pin ?? item.pin,
            value: data.value ?? item.value,
            min_value: data.min_value ?? item.min_value,
            max_value: data.max_value ?? item.max_value,
            property: property,
            updated_at: now,
            created_at: item.created_at,
        };

        // merge เฉพาะ field ที่ส่งมา
        driver.items[itemIndex] = {
            ...updateData,
        };

        // update driver updated_at
        driver.updated_at = now;

        // update driver ใน db
        db[driverIndex] = driver;

        // เขียนกลับไฟล์
        await this.writeFile(db);

        return driver;
    }



    static get() {
        return this.readFile();
    }

    static find(id: string) {
        return this.readFile().find((u) => u.id === id);
    }
}