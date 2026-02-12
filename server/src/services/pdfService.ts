
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { Op } from 'sequelize';
import { Visitor } from '../models/Visitor';
import { Personnel } from '../models/Personnel';
import { VisitLog } from '../models/VisitLog';
import { User } from '../models/User';

function createHeader(doc: PDFKit.PDFDocument, title: string, subtitle?: string) {
    doc.fontSize(20).text('VisitTrack', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).text(title, { align: 'center' });
    if (subtitle) {
        doc.fontSize(10).text(subtitle, { align: 'center' });
    }
    doc.moveDown(1);
    doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);
}

function drawRow(doc: PDFKit.PDFDocument, y: number, columns: { text: string; width: number; align?: string }[]) {
    let x = 50;
    for (const col of columns) {
        doc.text(col.text, x, y, { width: col.width, align: (col.align as any) || 'left', lineBreak: false, ellipsis: true });
        x += col.width + 5; // buffer
    }
}

export const pdfService = {
    async generateVisitorsReport(res: Response, filters: any) {
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        createHeader(doc, 'Visitors Report');

        // Query data
        const where: any = {};
        if (filters.dateFrom || filters.dateTo) {
            where.createdAt = {};
            if (filters.dateFrom) where.createdAt[Op.gte] = new Date(filters.dateFrom);
            if (filters.dateTo) where.createdAt[Op.lte] = new Date(filters.dateTo);
        }

        const visitors = await Visitor.findAll({ where, order: [['createdAt', 'DESC']], limit: 500 }); // Limit for PDF perf

        // Table Header
        doc.fontSize(10).font('Helvetica-Bold');
        let y = doc.y;
        const cols = [
            { text: 'Name', width: 120 },
            { text: 'Contact', width: 80 },
            { text: 'ID Number', width: 80 },
            { text: 'Relation', width: 80 },
            { text: 'Created At', width: 100 },
        ];
        drawRow(doc, y, cols);
        doc.moveDown();
        y = doc.y;
        doc.lineWidth(0.5).moveTo(50, y).lineTo(550, y).stroke();
        doc.moveDown(0.5);

        // Rows
        doc.font('Helvetica').fontSize(9);
        for (const v of visitors) {
            if (doc.y > 700) {
                doc.addPage();
                y = 50;
            }
            y = doc.y;
            drawRow(doc, y, [
                { text: v.fullName, width: 120 },
                { text: v.contact || '-', width: 80 },
                { text: v.idNumber || '-', width: 80 },
                { text: v.relation || '-', width: 80 },
                { text: v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '-', width: 100 },
            ]);
            doc.moveDown(0.8);
        }

        doc.end();
    },

    async generatePersonnelReport(res: Response, filters: any) {
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        createHeader(doc, 'Personnel Report');

        const where: any = {};
        if (filters.dateFrom || filters.dateTo) {
            where.createdAt = {};
            if (filters.dateFrom) where.createdAt[Op.gte] = new Date(filters.dateFrom);
            if (filters.dateTo) where.createdAt[Op.lte] = new Date(filters.dateTo);
        }

        const personnel = await Personnel.findAll({ where, order: [['createdAt', 'DESC']], limit: 500 });

        doc.fontSize(10).font('Helvetica-Bold');
        let y = doc.y;
        const cols = [
            { text: 'Name', width: 150 },
            { text: 'Role', width: 100 },
            { text: 'Contact', width: 100 },
            { text: 'Created At', width: 100 },
        ];
        drawRow(doc, y, cols);
        doc.moveDown();
        y = doc.y;
        doc.lineWidth(0.5).moveTo(50, y).lineTo(550, y).stroke();
        doc.moveDown(0.5);

        doc.font('Helvetica').fontSize(9);
        for (const p of personnel) {
            if (doc.y > 700) {
                doc.addPage();
                y = 50;
            }
            y = doc.y;
            drawRow(doc, y, [
                { text: p.fullName, width: 150 },
                { text: (p as any).roleTitle || '-', width: 100 },
                { text: (p as any).contact || '-', width: 100 }, // Assuming contact exists roughly
                { text: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-', width: 100 },
            ]);
            doc.moveDown(0.8);
        }
        doc.end();
    },

    async generateVisitLogReport(res: Response, filters: any) {
        const doc = new PDFDocument({ margin: 50, layout: 'landscape' }); // Landscape for logs
        doc.pipe(res);

        createHeader(doc, 'Visit Logs Report');

        const where: any = {};
        // ... complex filters same as CSV ...
        if (filters.subjectType === 'visitor') {
            where.visitorId = filters.subjectId ? Number(filters.subjectId) : { [Op.ne]: null };
        } else if (filters.subjectType === 'personnel') {
            where.personnelId = filters.subjectId ? Number(filters.subjectId) : { [Op.ne]: null };
        } else if (filters.subjectId) {
            where[Op.or] = [{ visitorId: Number(filters.subjectId) }, { personnelId: Number(filters.subjectId) }];
        }
        if (filters.dateFrom || filters.dateTo) {
            where.timeIn = {} as any;
            if (filters.dateFrom) (where.timeIn as any)[Op.gte] = new Date(filters.dateFrom);
            if (filters.dateTo) (where.timeIn as any)[Op.lte] = new Date(filters.dateTo);
        }

        const logs = await VisitLog.findAll({
            where,
            order: [['timeIn', 'DESC']],
            limit: 500,
            include: [
                { model: Visitor, as: 'visitor', attributes: ['fullName'] },
                { model: Personnel, as: 'personnel', attributes: ['fullName', 'roleTitle'] },
                { model: User, as: 'handledBy', attributes: ['username'] }
            ]
        });

        doc.fontSize(10).font('Helvetica-Bold');
        let y = doc.y;
        // Landscape width is ~792
        const cols = [
            { text: 'Type', width: 60 },
            { text: 'Name', width: 150 },
            { text: 'Role/Info', width: 100 },
            { text: 'Time In', width: 120 },
            { text: 'Time Out', width: 120 },
            { text: 'Handled By', width: 100 },
        ];
        drawRow(doc, y, cols);
        doc.moveDown();
        y = doc.y;
        doc.lineWidth(0.5).moveTo(50, y).lineTo(742, y).stroke();
        doc.moveDown(0.5);

        doc.font('Helvetica').fontSize(9);
        for (const r of logs) {
            if (doc.y > 500) { // Landscape height is ~612
                doc.addPage({ layout: 'landscape' });
                y = 50;
            }
            const type = (r as any).visitorId ? 'Visitor' : 'Personnel';
            const name = (r as any).visitor?.fullName || (r as any).personnel?.fullName || '-';
            const info = (r as any).personnel?.roleTitle || (r as any).visitor?.relation || '-';
            const timeIn = r.timeIn ? new Date(r.timeIn).toLocaleString() : '-';
            const timeOut = r.timeOut ? new Date(r.timeOut).toLocaleString() : '-';
            const handled = (r as any).handledBy?.username || '-';

            y = doc.y;
            drawRow(doc, y, [
                { text: type, width: 60 },
                { text: name, width: 150 },
                { text: info, width: 100 },
                { text: timeIn, width: 120 },
                { text: timeOut, width: 120 },
                { text: handled, width: 100 },
            ]);
            doc.moveDown(0.8);
        }

        doc.end();
    }
};
