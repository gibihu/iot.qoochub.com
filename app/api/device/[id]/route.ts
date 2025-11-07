// app/api/hello/route.ts
//  PIN
import { DeviceModel } from "@/models/DeviceModel";
import { DeviceType } from "@/types/device";
import { NextRequest, NextResponse } from "next/server";

export async function GET( req: NextRequest, context: any){
    const { id } = await context.params;
    try {
        const data = DeviceModel.find(id);
        if (data) {
            return NextResponse.json({
                message: 'สำเร็จ',
                data: data,
                code: 200
            }, { status: 200 });
        } else {
            throw new Error("ไม่พบ");
        }
    } catch (e) {
        return NextResponse.json({
            message: 'ไม่สำเร็จ',
            error: e ?? 'ไม่พบหรือข้อมผิดพลาดในรบบ',
            code: 200
        }, { status: 200 });
    }
}



export async function PATCH(req: NextRequest, context: any) {
    try {
        const { id } = await context.params;
        // รับ FormData แทน JSON
        const formData = await req.formData();
        const deviceId = formData.get('id') as string;
        
        if(!deviceId || deviceId !== id){
            return NextResponse.json({
                message: 'ไม่พบตัวอ้างอิง',
                code: 404
            }, { status: 404 });
        }

        // ดึงข้อมูล device เดิมเพื่อใช้ items
        const existingDevice = DeviceModel.find(deviceId);
        if (!existingDevice) {
            return NextResponse.json({
                message: 'ไม่พบข้อมูล device',
                code: 404
            }, { status: 404 });
        }

        // อ่าน model_property (JSON) หากมีแนบมา
        let parsedModelProperty: any = undefined;
        const mpJson = formData.get('model_property') as string | null;
        if (mpJson) {
            try {
                const raw = JSON.parse(mpJson);
                // แปลงชนิดข้อมูลให้ถูกต้อง (number/boolean/string)
                parsedModelProperty = {
                    model_x: Number(raw.model_x ?? 0),
                    model_y: Number(raw.model_y ?? 0),
                    model_z: Number(raw.model_z ?? 0),
                    model_size: Number(raw.model_size ?? 1),
                    cam_x: Number(raw.cam_x ?? 2),
                    cam_y: Number(raw.cam_y ?? 2),
                    cam_z: Number(raw.cam_z ?? 2),
                    space_width: raw.space_width ?? '100%',
                    space_height: raw.space_height ?? '100%',
                    can_mouse: Boolean(raw.can_mouse ?? true),
                    can_zoom: Boolean(raw.can_zoom ?? true),
                    bg: String(raw.bg ?? '#ffffff'),
                    light_x: Number(raw.light_x ?? 0),
                    light_y: Number(raw.light_y ?? 100),
                    light_z: Number(raw.light_z ?? 0),
                    light_color: String(raw.light_color ?? '#ffffff'),
                    light_power: Number(raw.light_power ?? 3),
                };
            } catch {
                // ถ้า parse ไม่ได้ ไม่บล็อค flow
            }
        }

        // สร้าง DeviceType object
        const updateData: DeviceType = {
            id: deviceId,
            name: formData.get('name') as string,
            token: formData.get('token') as string,
            description: formData.get('description') as string || '',
            model_path: formData.get('model_path') as string || '',
            model_name: existingDevice.model_name || '', // จะถูกอัพเดทอัตโนมัติจากไฟล์ใหม่ถ้ามี
            items: existingDevice.items, // ใช้ items จากข้อมูลเดิม
            model_property: parsedModelProperty ?? existingDevice.model_property,
        };

        // ตรวจสอบไฟล์ 3D ใหม่
        let newModelFile: File | undefined = undefined;
        const modelFile = formData.get('model') as File | null;
        if (modelFile && modelFile.size > 0) {
            const allowedExtensions = ['.gltf', '.glb', '.obj', '.fbx', '.dae', '.ply', '.stl', '.3ds', '.3mf'];
            const fileName = modelFile.name.toLowerCase();
            const extension = fileName.substring(fileName.lastIndexOf('.'));
            
            if (!allowedExtensions.includes(extension)) {
                return NextResponse.json({
                    message: 'กรุณาอัพโหลดไฟล์ 3D เท่านั้น (.gltf, .glb, .obj, .fbx, .dae, .ply, .stl, .3ds, .3mf)',
                    error: 'Invalid file type',
                    code: 400
                }, { status: 400 });
            }
            newModelFile = modelFile;
        }

        const save = await DeviceModel.update(updateData, newModelFile);
        if (save) {
            return NextResponse.json({
                message: 'อัเดทฐานข้อมูล',
                data: save,
                code: 200
            }, { status: 200 });
        } else {
            throw new Error("เกิดข้อมผิดพลาด ลองใหม่");
        }
    } catch (e) {
        return NextResponse.json({
            message: 'ไม่สำเร็จ',
            error: e ?? 'ไม่พบหรือข้อมผิดพลาดในรบบ',
            code: 200
        }, { status: 200 });
    }
}

export async function DELETE(req: NextRequest, context: any) {
    try {
        const { id } = await context.params;
        if(!id){
            return NextResponse.json({
                message: 'ไม่พบตัวอ้างอิง',
                code: 404
            }, { status: 404 });
        }
        const save = DeviceModel.delete(id);
        if (save) {
            return NextResponse.json({
                message: 'อัเดทฐานข้อมูล',
                data: save,
                code: 200
            }, { status: 200 });
        } else {
            throw new Error("เกิดข้อมผิดพลาด ลองใหม่");
        }
    } catch (e) {
        return NextResponse.json({
            message: 'ไม่สำเร็จ',
            error: e ?? 'ไม่พบหรือข้อมผิดพลาดในรบบ',
            code: 200
        }, { status: 200 });
    }
}