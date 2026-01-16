import { DeviceType } from "@/types/device";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const FilePath = path.join(process.cwd(), "database/devices", "devices.json");
const ShapesDir = path.join(process.cwd(), "public", "shapes");

// Interface สำหรับรับข้อมูลไฟล์ (รองรับทั้ง browser File และ server Buffer)
export interface ModelFileInput {
    buffer: Buffer;
    filename: string;
}

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

    // Helper function สำหรับแปลง File (browser) เป็น ModelFileInput
    private static async fileToModelFileInput(file: File): Promise<ModelFileInput> {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return { buffer, filename: file.name };
    }

    private static async saveModelFile(deviceId: string, fileInput: File | ModelFileInput): Promise<string> {
        // สร้าง directory สำหรับ device
        const deviceDir = path.join(ShapesDir, deviceId);
        if (!fs.existsSync(deviceDir)) {
            fs.mkdirSync(deviceDir, { recursive: true });
        }

        // แปลง File เป็น ModelFileInput ถ้าเป็น File object
        let modelFile: ModelFileInput;
        if (fileInput instanceof File) {
            modelFile = await this.fileToModelFileInput(fileInput);
        } else {
            modelFile = fileInput;
        }

        // บันทึกไฟล์
        const filePath = path.join(deviceDir, modelFile.filename);
        fs.writeFileSync(filePath, modelFile.buffer);

        // คืนค่า path สำหรับใช้ใน model_path (ใช้ /shapes/... เพราะอยู่ใน public folder)
        return `/${deviceId}/${modelFile.filename}`;
    }

    private static deleteModelFiles(deviceId: string): void {
        const deviceDir = path.join(ShapesDir, deviceId);
        if (fs.existsSync(deviceDir)) {
            try {
                // ลบ directory และไฟล์ทั้งหมดภายในแบบ recursive
                fs.rmSync(deviceDir, { recursive: true, force: true });
            } catch (error) {
                // ถ้าเกิด error ให้ลองลบทีละไฟล์
                try {
                    const files = fs.readdirSync(deviceDir);
                    files.forEach((file) => {
                        const filePath = path.join(deviceDir, file);
                        const stat = fs.statSync(filePath);
                        if (stat.isDirectory()) {
                            fs.rmSync(filePath, { recursive: true, force: true });
                        } else {
                            fs.unlinkSync(filePath);
                        }
                    });
                    fs.rmdirSync(deviceDir);
                } catch {
                    // ถ้ายังเกิด error ก็ข้ามไป
                }
            }
        }
    }

    private static deleteOldModelFile(modelPath: string): void {
        if (!modelPath) return;
        
        // แปลงจาก /shapes/{id}/{file} เป็น absolute path
        const relativePath = modelPath.replace(/^\//, ''); // ลบ / หน้า
        const filePath = path.join(process.cwd(), "public", relativePath);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            
            // ลบ directory ถ้าว่าง
            const dir = path.dirname(filePath);
            try {
                if (fs.readdirSync(dir).length === 0) {
                    fs.rmdirSync(dir);
                }
            } catch {
                // ถ้า directory มีไฟล์อื่นอยู่ หรือมี error เกิดขึ้น ก็ข้ามไป
            }
        }
    }

    static async createToken(token: string, name: string, description: string, model?: File | ModelFileInput): Promise<DeviceType> {
        const datas = this.readFile();
        const now = new Date().toISOString();
        // const hashed = await bcrypt.hash(token, 2);

        const id = uuidv4();
        let modelPath = '';
        let modelName = '';

        // ถ้ามีไฟล์ model ให้บันทึกและดึงชื่อไฟล์
        if (model) {
            modelPath = await this.saveModelFile(id, model);
            // ดึงชื่อไฟล์จาก model
            if (model instanceof File) {
                modelName = model.name;
            } else {
                modelName = model.filename;
            }
        }

        const newData: DeviceType = {
            id: id,
            name: name ?? "device_" + token,
            token: token,
            description: description,
            model_path: modelPath,
            model_name: modelName,
            model_property: {
                model_x: 0,
                model_y: 0,
                model_z: 0,
                model_size: 1,
                cam_x: 2,
                cam_y: 2,
                cam_z: 2,
                space_width: "100%",
                space_height: "100%",
                can_mouse: true,
                can_zoom: true,
                bg: "#ffffff",
                light_x: 0,
                light_y: 100,
                light_z: 0,
                light_color: "#ffffff",
                light_power: 3,
            },
            items: [],
            created_at: now,
            updated_at: now,
        };

        datas.push(newData);
        this.writeFile(datas);
        return newData;
    }

    static async update(updateData: DeviceType, newModelFile?: File | ModelFileInput): Promise<DeviceType | null> {
        const datas = this.readFile();
        const index = datas.findIndex(d => d.id === updateData.id);

        if (index === -1) {
            return null; // or throw new Error("Device not found");
        }

        const oldData = datas[index];

        // ถ้ามีไฟล์ใหม่ ให้ลบไฟล์เก่าและบันทึกไฟล์ใหม่
        let modelPath = updateData.model_path || oldData.model_path;
        let modelName = updateData.model_name || oldData.model_name;
        if (newModelFile) {
            // ลบไฟล์เก่าถ้ามี
            if (oldData.model_path) {
                this.deleteOldModelFile(oldData.model_path);
            }
            // บันทึกไฟล์ใหม่
            modelPath = await this.saveModelFile(updateData.id, newModelFile);
            // ดึงชื่อไฟล์จากไฟล์ใหม่
            if (newModelFile instanceof File) {
                modelName = newModelFile.name;
            } else {
                modelName = newModelFile.filename;
            }
        }

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
            model_path: modelPath,
            model_name: modelName,
            model_property: updateData.model_property ?? oldData.model_property ?? {
                model_x: 0,
                model_y: 0,
                model_z: 0,
                model_size: 1,
                cam_x: 2,
                cam_y: 2,
                cam_z: 2,
                space_width: "100%",
                space_height: "100%",
                can_mouse: true,
                can_zoom: true,
                bg: "#ffffff",
                light_x: 0,
                light_y: 100,
                light_z: 0,
                light_color: "#ffffff",
                light_power: 3,
            },
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

        // ลบไฟล์ model ทั้งหมดของ device นี้
        this.deleteModelFiles(id);

        datas.splice(index, 1);
        this.writeFile(datas);

        return true;
    }



    static get() {
        return this.readFile();
    }

    static find(id: string, hide?: string[]): Partial<DeviceType> | undefined {
        const device = this.readFile().find((u) => u.id === id);
        if (!device) return undefined;

        // ถ้าไม่มี hide ให้คืนข้อมูลเต็ม
        if (!hide || hide.length === 0) return device;

        // ลบตัวแปรที่ระบุใน hide array
        const result = { ...device };
        hide.forEach((key) => {
            delete result[key as keyof DeviceType];
        });

        return result;
    }
}