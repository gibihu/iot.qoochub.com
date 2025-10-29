import { DeviceType, PinType } from "@/types/device";


export class Pin{
    static async delete(id: string, pinId: string){
        const res = await fetch(`/api/device/pin/${id}`, {
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
        const res = await fetch(`/api/device/pin/${raw.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedItem)
        });
        const result = await res.json();
        return result;
    }
    
    static async updateSort(raw: DeviceType, updated: PinType[]){
        const res = await fetch(`/api/device/pin/${raw.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updated)
        });
        const result = await res.json();
        return result;
    }
}