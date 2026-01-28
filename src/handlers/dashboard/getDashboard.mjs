import { getCompanyMetadata} from "./repositories/companyRepository.mjs";
import {getLatestTransactions, getRecentTransactionsCount} from "./repositories/transactionRepository.mjs";
import {getLatestInvoices} from "./repositories/invoiceRepository.mjs";

export const handler = async (event) => {
    const companyId = event.pathParameters?.id;

    // console.log('requesting getDashboard handler', { companyId });

    try {
        // Execute repositories in parallel for better performance
        const [company, transactions, transactionCount, invoices] = await Promise.all([
            getCompanyMetadata(companyId),
            getLatestTransactions(companyId),
            getRecentTransactionsCount(companyId),
            getLatestInvoices(companyId)
        ]);

        if (!company) {
            return { statusCode: 404, body: JSON.stringify({ message: "Not Found" }) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                company,
                recentTransactions: {
                    items: transactions,
                    totalCount: transactionCount,
                    additionalItemsCount: Math.max(0, transactionCount - transactions.length)
                },
                invoiceSummary: {
                    hasOverdueInvoice: invoices.some(i => !i.isPaid && new Date(i.dueDate) < new Date()),
                }
            }),
        };
    } catch (error) {
        console.log(error);
        return { statusCode: 500, body: JSON.stringify({ error: 'INTERNAL_SERVER_ERROR' }) };
    }
};