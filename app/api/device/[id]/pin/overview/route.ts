
import { DeviceModel } from "@/models/DeviceModel";
import { PinHistoryModel } from "@/models/devices/pins/PinHistoryModel";
import { PinModel } from "@/models/PinModel";
import { DeviceHisType, DevicePinHisType, DeviceType } from "@/types/device";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = await params;
    try {
        const data = PinHistoryModel.find({
            device_id: id,
        });

        if (!data.length) {
            throw new Error("ไม่พบ");
        }

        const history = data[0];

        // 🔹 join device
        const device = DeviceModel.find(history.device_id, ['items', 'model_property']);
        history.device = device as DeviceType | undefined;

        // 🔹 join pin ในแต่ละ item
        history.items = await Promise.all(history.items.map(async (item: DevicePinHisType) => {
            const pin = await PinModel.find(history.device_id, item.id, ['property']);
            return {
                ...item,
                pin: pin && pin.id ? (pin as any) : undefined,
            };
        }));

        return NextResponse.json({
            message: 'สำเร็จ',
            data: history,
            code: 200
        }, { status: 200 });

    } catch (e) {
        return NextResponse.json({
            message: 'ไม่สำเร็จ',
            error: e ?? 'ไม่พบหรือข้อมผิดพลาดในรบบ',
            code: 200
        }, { status: 200 });
    }
}