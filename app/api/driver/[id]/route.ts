// app/api/hello/route.ts
//  PIN
import { Driver } from "@/models/DriverModel";
import { NextRequest, NextResponse } from "next/server";

export async function GET( req: NextRequest, context: any){
    const { id } = await context.params;
    try {
        const data = Driver.find(id);
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

export async function POST(req: NextRequest, context: any) {
    try {
        const { id } = await context.params;
        const body = await req.json();
        const data = {
            id: body.id ?? null,
            name: body.name as string,
            type: body.type as string,
            pin: body.pin as string,
            value: body.value as number,
            min_value: body.min_value as number,
            max_value: body.max_value as number,
            widget: body.widget as string,
            color: body.color as string,
            width: body.width as number,
            height: body.height as number,
        }
        const save = Driver.addItem(id, data);
        if (save) {
            return NextResponse.json({
                message: 'สำเร็จ',
                data: save,
                code: 201
            }, { status: 201 });
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

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
    try {
        const { id } = context.params;
        const body = await req.json();
        const data = {
            id: body.id ?? null,
            name: body.name as string,
            type: body.type as string,
            pin: body.pin as string,
            value: body.value as number,
            min_value: body.min_value as number,
            max_value: body.max_value as number,
            widget: body.widget as string,
            color: body.color as string,
            width: body.width as number,
            height: body.height as number,
        }
        const save = Driver.update(id, data);
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
