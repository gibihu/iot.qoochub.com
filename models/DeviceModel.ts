import { DeviceType } from "@/types/device";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
const FilePath = path.join(process.cwd(), "database", "devices.json");

export class DeviceModel {

    public static readFile(): DeviceType[] {
        try {
            const data = fs.readFileSync(FilePath, "utf-8");
            return JSON.parse(data);
        } catch {
            return [];
        }
    }
    public static writeFile(device: DeviceType[]) {
        const dir = path.dirname(FilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(FilePath, JSON.stringify(device, null, 2));
    }

    static async createToken(token: string, name: string, description: string): Promise<DeviceType> {
        const datas = this.readFile();
        const now = new Date().toISOString();
        // const hashed = await bcrypt.hash(token, 2);

        const newData: DeviceType = {
            id: uuidv4(),
            name: name ?? "device_" + token,
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

    static update(updateData: DeviceType): DeviceType | null {
        const datas = this.readFile();
        const index = datas.findIndex(d => d.id === updateData.id);

        if (index === -1) {
            return null; // or throw new Error("Device not found");
        }

        const oldData = datas[index];

        // fields ห้ามเปลี่ยน
        const immutableFields = {
            id: oldData.id,
            created_at: oldData.created_at,
            items: oldData.items,
        };

        // เอาของใหม่มา merge ทับของเดิม (ยกเว้น field ห้ามแก้)
        const newData: DeviceType = {
            ...oldData,
            ...updateData,
            ...immutableFields,
            updated_at: new Date().toISOString()
        };

        datas[index] = newData;
        this.writeFile(datas);

        return newData;
    }

    static delete(id: string): boolean {
        const datas = this.readFile();
        const index = datas.findIndex(d => d.id === id);

        if (index === -1) {
            return false; // หาของไม่เจอ ไม่ต้องลบ
        }

        datas.splice(index, 1);
        this.writeFile(datas);

        return true;
    }



    static get() {
        return this.readFile();
    }

    static find(id: string) {
        return this.readFile().find((u) => u.id === id);
    }
}