const crypto = require('crypto');

const companyId = "019bffec-3afb-7b63-8461-a89366547b11";
let csv = "PK,SK,amountDue,dueDate,isPaid,currency,invoiceStatus\n";

const today = new Date("2026-01-27T10:00:00Z");

for (let i = 0; i < 24; i++) {
    const baseDate = new Date("2026-01-01T10:00:00Z");
    baseDate.setMonth(baseDate.getMonth() - i);

    const dueDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 10, 10, 0, 0);
    const isoDueDate = dueDate.toISOString().split('T')[0];

    // Generate UUID v7
    const u7 = crypto.randomUUID({ version: 'v7' });

    // SK format: INVOICE#YYYY-MM-DD#UUIDv7
    // This allows both date-order sorting and uniqueness
    const sk = `INVOICE#${isoDueDate}#${u7}`;

    const amountDue = Math.floor(Math.random() * 5000) + 1000;
    const isPaid = dueDate < today;
    const status = isPaid ? "Paid" : "Outstanding";

    csv += `COMPANY#${companyId},${sk},${amountDue},${isoDueDate},${isPaid},SEK,${status}\n`;
}

console.log(csv);