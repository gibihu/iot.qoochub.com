// app/api/hello/route.ts
import { Driver } from "@/models/DriverModel";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        message: 'สำเร็จ',
        data: Driver.get(),
        code: 200
    }, {status: 200});
}
export async function POST(req: NextRequest) {
    try{
        const body = await req.json();
        const name = body.title;
        const token = body.token;
        const description = body.description;
        const save = Driver.createToken(token, name, description);
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
