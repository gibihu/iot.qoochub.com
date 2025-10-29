// app/api/hello/route.ts
//  PIN
import { DeviceModel } from "@/models/DeviceModel";
import { PinModel } from "@/models/PinModel";
import { PinType } from "@/types/device";
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
        const body = await req.json();
        if(!body.id){
            return NextResponse.json({
                message: 'ไม่พบตัวอ้างอิง',
                code: 404
            }, { status: 404 });
        }
        const save = DeviceModel.update(body);
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