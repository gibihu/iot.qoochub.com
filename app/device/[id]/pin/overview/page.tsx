'use client'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeviceHisType, DevicePinChageHisType, DevicePinRecordHisType } from "@/types/device";
import { LoaderCircle } from "lucide-react";
import { Fragment, use, useEffect, useState } from "react";
import { toast } from "sonner";

export default function Page({ params, }: { params: Promise<{ id: string }>; }) {
    const { id } = use(params);
    const [data, setData] = useState<DeviceHisType | null>(null);
    const [isLoad, serIsLoad] = useState(true);
    const [openRow, setOpenRow] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/device/${id}/pin/overview`);
                const result = await res.json();

                if (!res.ok) {
                    throw new Error(result.message);
                }

                setData(result.data);
            } catch (err: any) {
                toast.error(err.message || 'เกิดข้อผิดพลาด');
            } finally {
                serIsLoad(false);
            }
        };

        fetchData();
    }, [id]);

    return (
        <>

            {isLoad ? (
                <div className="flex justify-center">
                    <LoaderCircle className="size-4  animate-spin text-primary" />
                </div>
            ) : (
                <Card className="px-4">
                    <h2 className="text-xl font-bold">รายการสถิติของ {data?.device?.name}</h2>

                    <CardContent className="p-0 flex flex-col gap-4">

                        {!isLoad && data?.items.map((item, key) => (
                            <Card key={key} className="p-0 overflow-hidden">
                                <Accordion type="multiple" className="bg-accent">
                                    <AccordionItem value={`item-${key}`}>
                                        <AccordionTrigger className="p-4 bg-background hover:bg-accent shadow-md">
                                            {item.pin?.name}
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 bg-accent flex flex-col gap-4">
                                            <span>
                                                ค่าล่าสุด {item.pin?.value}
                                            </span>
                                            <Table>
                                                <TableCaption>Your recent data history</TableCaption>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>วันที่</TableHead>
                                                        <TableHead>ค่าเฉลี่ย/วัน</TableHead>
                                                        <TableHead>ต่ำสุด</TableHead>
                                                        <TableHead>สูงสุด</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {[...item.records]
                                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                        .map((i: DevicePinRecordHisType, rowIndex: number) => {

                                                            const rowKey = `${key}-${rowIndex}`; // key = index ของ item (pin)
                                                            const isOpen = openRow === rowKey;

                                                            return (
                                                                <Fragment key={rowKey}>
                                                                    {/* แถวหลัก */}
                                                                    <TableRow
                                                                        onClick={() => setOpenRow(isOpen ? null : rowKey)}
                                                                        className="cursor-pointer hover:bg-muted"
                                                                    >
                                                                        <TableCell>{i.date}</TableCell>
                                                                        <TableCell>{i.summary.avg_value}</TableCell>
                                                                        <TableCell>{i.summary.min_value}</TableCell>
                                                                        <TableCell>{i.summary.max_value}</TableCell>
                                                                    </TableRow>

                                                                    {/* แถวรายละเอียด */}
                                                                    <TableRow>
                                                                        <TableCell colSpan={4} className="p-0">
                                                                            <Accordion
                                                                                type="single"
                                                                                collapsible
                                                                                value={isOpen ? rowKey : undefined}
                                                                            >
                                                                                <AccordionItem value={rowKey} className="border-none">
                                                                                    <AccordionContent className="px-3 mb-4 py-2">
                                                                                        {/* <Table className="border-l-1">
                                                                                            <TableBody>
                                                                                                {i.changes.map((t, k) => (
                                                                                                    <TableRow key={k}>
                                                                                                        <TableCell>เวลา: {t.time}</TableCell>
                                                                                                        <TableCell>ค่า: {t.value}</TableCell>
                                                                                                    </TableRow>
                                                                                                ))}
                                                                                            </TableBody>
                                                                                        </Table> */}
                                                                                        <div className="flex flex-col gap-0 border-l-1 pl-4">
                                                                                            {i.changes.map((t: DevicePinChageHisType, k: number) => (
                                                                                                <div className="flex gap-6" key={k}>
                                                                                                    <span>เวลา: {t.time}</span>
                                                                                                    <span>ค่า: {t.value}</span>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </AccordionContent>
                                                                                </AccordionItem>
                                                                            </Accordion>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                </Fragment>
                                                            );
                                                        })}

                                                </TableBody>
                                            </Table>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </Card>
                        ))}

                        {!isLoad && !data && (
                            <div className="p-4 text-muted-foreground">ไม่พบข้อมูล</div>
                        )}
                    </CardContent>
                </Card>
            )}
        </>
    );
}