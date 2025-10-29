import { DeviceType } from "@/types/device";

export class DeviceModel {
    static async get() {
        const res = await fetch('/api/device/data');
        const result = await res.json()
        return result;
    }

    static async find(id: string) {
        const res = await fetch(`/api/device/${id}`);
        const result = await res.json();
        return result;
    }

    static async update(item: DeviceType) {
        const res = await fetch(`/api/device/${item.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(item),
        });
        const result = await res.json();
        return result;
    }

    static async delete(id: string){
        const res = await fetch(`/api/device/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(id),
        });
        const result = await res.json();
        return result;
    }
}