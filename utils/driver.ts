"use client"

interface ResponseType{
    message: string;
    data: string[];
    code: number;
}

export class Driver{
    static async get(){
        const res = await fetch('/api/driver/data');
        const result = await res.json()
        return result;
    }

    static async find(id: string){
        const res = await fetch(`/api/driver/${id}`);
        const result = await res.json();
        return result;
    }
    static async deletePin(id: string, pinId: string){
        const res = await fetch(`/api/driver/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: pinId
        });
        const result = await res.json();
        return result;
    }
}