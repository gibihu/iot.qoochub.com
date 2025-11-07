// app/api/hello/route.ts
import { DeviceModel } from "@/models/DeviceModel";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        message: 'สำเร็จ',
        data: DeviceModel.get(),
        code: 200
    }, {status: 200});
}

export async function POST(req: NextRequest) {
    try{
        // รับ FormData แทน JSON
        const formData = await req.formData();
        const name = formData.get('title') as string;
        const token = formData.get('token') as string;
        const description = formData.get('description') as string;
        const modelFile = formData.get('model') as File | null;

        // ตรวจสอบไฟล์ 3D
        let model: File | undefined = undefined;
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
            model = modelFile;
        }

        const save = await DeviceModel.createToken(token, name, description, model);
        if(save){
            return NextResponse.json({
                message: 'สำเร็จ',
                data: save,
                code: 201
            }, {status: 201});
        }else{
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
