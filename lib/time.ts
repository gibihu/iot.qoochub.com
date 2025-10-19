export function timeSince(dateString: string) {
    const startDate = new Date(dateString).getTime();
    const now = Date.now();

    let diff = now - startDate; // milliseconds

    const msInSecond = 1000;
    const msInMinute = msInSecond * 60;
    const msInHour = msInMinute * 60;
    const msInDay = msInHour * 24;

    const days = Math.floor(diff / msInDay);
    diff %= msInDay;

    const hours = Math.floor(diff / msInHour);
    diff %= msInHour;

    const minutes = Math.floor(diff / msInMinute);
    diff %= msInMinute;

    const seconds = Math.floor(diff / msInSecond);

    // สร้าง array ของหน่วยเวลา
    const parts = [
        { value: days, unit: "ว." },
        { value: hours, unit: "ช." },
        { value: minutes, unit: "น." },
        { value: seconds, unit: "วิ." },
    ];

    // filter ตัวที่ value เป็น 0
    const result = parts
        .filter(part => part.value > 0)
        .map(part => `${part.value}${part.unit}`)
        .join(" ");

    return result || "0 วิ."; // ถ้าเวลาผ่านไป 0ms ก็แสดง 0 วิ.
}
