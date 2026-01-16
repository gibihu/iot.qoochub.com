import { DeviceHisType } from '@/types/device';
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), "database/devices", "item_value_histories.json");

/* ---------- Types ---------- */

export interface Change {
    time: string
    value: number
}

export interface Summary {
    avg_value: number
    min_value: number
    max_value: number
    count: number
}

export interface ValueGroup {
    value: number
    count: number
}

export interface DateRecord {
    date: string
    changes: Change[]
    summary: Summary
    value_groups: ValueGroup[]
}

export interface Item {
    id: string
    records: DateRecord[]
}

export interface Device {
    device_id: string
    items: Item[]
}

/* ---------- Model ---------- */

export class PinHistoryModel {
    /* ===== Internal ===== */

    private static read(): Device[] {
        if (!fs.existsSync(DB_PATH)) return []

        const raw = fs.readFileSync(DB_PATH, 'utf-8').trim()

        if (!raw) return []

        try {
            return JSON.parse(raw)
        } catch (err) {
            console.error('JSON file corrupted:', err)
            return []
        }
    }

    private static write(data: Device[]) {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
    }

    private static recalc(changes: Change[]) {
        if (changes.length === 0) {
            return {
                summary: { avg_value: 0, min_value: 0, max_value: 0, count: 0 },
                value_groups: []
            }
        }

        const values = changes.map(c => c.value)
        const sum = values.reduce((a, b) => a + b, 0)

        const groups: Record<number, number> = {}
        values.forEach(v => (groups[v] = (groups[v] || 0) + 1))

        return {
            summary: {
                avg_value: Number((sum / values.length).toFixed(2)),
                min_value: Math.min(...values),
                max_value: Math.max(...values),
                count: values.length
            },
            value_groups: Object.entries(groups).map(([value, count]) => ({
                value: Number(value),
                count
            }))
        }
    }

    /* ===== Public APIs ===== */

    /** เพิ่มหรืออัปเดต change ตามเงื่อนไข */
    static addChangeIf(
        filter: { device_id: string; item_id: string; date: string },
        change: Change
    ) {
        const data = this.read()

        // หา device
        let device = data.find(d => d.device_id === filter.device_id)
        if (!device) {
            device = {
                device_id: filter.device_id,
                items: []
            }
            data.push(device)
        }

        // หา item
        let item = device.items.find(i => i.id === filter.item_id)
        if (!item) {
            item = {
                id: filter.item_id,
                records: []
            }
            device.items.push(item)
        }

        // หา record ของวันที่
        let record = item.records.find(r => r.date === filter.date)
        if (!record) {
            record = {
                date: filter.date,
                changes: [],
                summary: { avg_value: 0, min_value: 0, max_value: 0, count: 0 },
                value_groups: []
            }
            item.records.push(record)
        }

        // เพิ่มหรืออัปเดต change
        const idx = record.changes.findIndex(c => c.time === change.time)
        if (idx !== -1) {
            record.changes[idx] = change
        } else {
            record.changes.push(change)
        }

        // คำนวณใหม่
        const recalced = this.recalc(record.changes)
        record.summary = recalced.summary
        record.value_groups = recalced.value_groups

        this.write(data)
        return record
    }

    /** ลบ change ตามเวลา */
    static removeChange(
        filter: { device_id: string; item_id: string; date: string },
        time: string
    ) {
        const data = this.read()

        const device = data.find(d => d.device_id === filter.device_id)
        if (!device) return null

        const item = device.items.find(i => i.id === filter.item_id)
        if (!item) return null

        const record = item.records.find(r => r.date === filter.date)
        if (!record) return null

        record.changes = record.changes.filter(c => c.time !== time)

        const recalced = this.recalc(record.changes)
        record.summary = recalced.summary
        record.value_groups = recalced.value_groups

        this.write(data)
        return record
    }

    /** ดึงข้อมูล - ยืดหยุ่นในการ query */
    static find(filter: { device_id?: string }): DeviceHisType[] {
        const data = this.read()
        const results: Device[] = []

        for (const device of data) {
            if (filter.device_id && device.device_id !== filter.device_id) continue
            results.push(device)
        }

        return results
    }


    static findPin(filter: {
        device_id?: string
        item_id?: string
    }) {
        const data = this.read()
        const results: Item[] = []

        for (const device of data) {
            if (filter.device_id && device.device_id !== filter.device_id) continue

            for (const item of device.items) {
                if (filter.item_id && item.id !== filter.item_id) continue
                results.push(item)
            }
        }

        return results
    }

    /** ดึง device ทั้งหมด */
    static findDevices(device_id?: string): Device[] {
        const data = this.read()
        if (device_id) {
            const device = data.find(d => d.device_id === device_id)
            return device ? [device] : []
        }
        return data
    }

    /** ดึง items ของ device */
    static findItems(device_id: string, item_id?: string): Item[] {
        const device = this.read().find(d => d.device_id === device_id)
        if (!device) return []

        if (item_id) {
            const item = device.items.find(i => i.id === item_id)
            return item ? [item] : []
        }
        return device.items
    }

    static deleteItem(filter: { device_id: string; item_id: string }): boolean {
        const data = this.read()

        const device = data.find(d => d.device_id === filter.device_id)
        if (!device) return false

        const itemIndex = device.items.findIndex(i => i.id === filter.item_id)
        if (itemIndex === -1) return false

        // ลบ item
        device.items.splice(itemIndex, 1)

        // ถ้า device ไม่มี items แล้ว ให้ลบ device ด้วย (optional)
        if (device.items.length === 0) {
            const deviceIndex = data.findIndex(d => d.device_id === filter.device_id)
            data.splice(deviceIndex, 1)
        }

        this.write(data)
        return true
    }
}