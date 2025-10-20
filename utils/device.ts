export class Device{
    static async get(){
        const res = await fetch('/api/device/data');
        const result = await res.json()
        return result;
    }

    static async find(id: string){
        const res = await fetch(`/api/device/${id}`);
        const result = await res.json();
        return result;
    }
}