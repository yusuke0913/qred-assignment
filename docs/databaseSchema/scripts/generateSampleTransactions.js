const companyId = "019bffec-3afb-7b63-8461-a89366547b11";
const merchants = ["Starbucks", "Amazon.se", "Uber", "ICA", "Shell", "H&M", "Telia", "Spotify"];
let csv = "PK,SK,merchantName,amount,currency,baseAmount,transactionDate,category\n";

for (let i = 0; i < 100; i++) {
    const date = new Date(new Date("2026-01-27T16:00:00Z").getTime() - i * 600000); // 10-minute intervals
    const isoDate = date.toISOString().split('.')[0] + 'Z';
    const sk = `TX#${isoDate}#0193a${100 + i}`;
    const merchant = merchants[i % merchants.length];
    const amount = Math.floor(Math.random() * 2000) + 50;
    csv += `COMPANY#${companyId},${sk},${merchant},${amount},SEK,${amount},${isoDate},Finance\n`;
}
console.log(csv);