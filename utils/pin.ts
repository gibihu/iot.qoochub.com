import { DeviceType, PinType } from "@/types/device";


export class Pin{
    static async delete(id: string, pinId: string){
        const res = await fetch(`/api/device/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: pinId
        });
        const result = await res.json();
        return result;
    }
    static async update(raw: DeviceType, updatedItem: PinType){
        const res = await fetch(`/api/device/${raw.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedItem)
        });
        const result = await res.json();
        return result;
    }
}