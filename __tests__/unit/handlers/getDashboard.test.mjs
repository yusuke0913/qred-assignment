import { jest, describe, test, expect, beforeEach } from '@jest/globals'

// Mock the modules BEFORE importing the handler
jest.unstable_mockModule('../../../src/handlers/dashboard/repositories/companyRepository.mjs', () => ({
    getCompanyMetadata: jest.fn()
}));

jest.unstable_mockModule('../../../src/handlers/dashboard/repositories/transactionRepository.mjs', () => ({
    getLatestTransactions: jest.fn(),
    getRecentTransactionsCount: jest.fn()
}));

jest.unstable_mockModule('../../../src/handlers/dashboard/repositories/invoiceRepository.mjs', () => ({
    getLatestInvoices: jest.fn()
}));

// Dynamic imports AFTER mocking
const { handler } = await import('../../../src/handlers/dashboard/getDashboard.mjs');
const { getCompanyMetadata } = await import('../../../src/handlers/dashboard/repositories/companyRepository.mjs');
const { getLatestTransactions, getRecentTransactionsCount } = await import('../../../src/handlers/dashboard/repositories/transactionRepository.mjs');
const { getLatestInvoices } = await import('../../../src/handlers/dashboard/repositories/invoiceRepository.mjs');

describe('getDashboard Handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should aggregate repository data into a valid response', async () => {
        const mockTransactions = [{ amount: 100 }, { amount: 200 }];
        getCompanyMetadata.mockResolvedValue({ companyName: 'Test Corp' });
        getLatestTransactions.mockResolvedValue(mockTransactions);
        getRecentTransactionsCount.mockResolvedValue(57);
        getLatestInvoices.mockResolvedValue([]);

        const event = { pathParameters: { id: 'uuid-123' } };
        const response = await handler(event);
        const body = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(body.recentTransactions.totalCount).toBe(57);
        expect(body.recentTransactions.additionalItemsCount).toBe(55); // 57 - 2
    });

    // Error Handling
    test('should return 404 when company is not found', async () => {
        getCompanyMetadata.mockResolvedValue(null);
        getLatestTransactions.mockResolvedValue([]);
        getRecentTransactionsCount.mockResolvedValue(0);
        getLatestInvoices.mockResolvedValue([]);

        const event = { pathParameters: { id: 'non-existent-id' } };
        const response = await handler(event);
        const body = JSON.parse(response.body);

        expect(response.statusCode).toBe(404);
        expect(body.message).toBe('Not Found');
    });

    test('should return 500 when repository throws an error', async () => {
        getCompanyMetadata.mockRejectedValue(new Error('Database connection failed'));
        getLatestTransactions.mockResolvedValue([]);
        getRecentTransactionsCount.mockResolvedValue(0);
        getLatestInvoices.mockResolvedValue([]);

        const event = { pathParameters: { id: 'uuid-123' } };
        const response = await handler(event);
        const body = JSON.parse(response.body);

        expect(response.statusCode).toBe(500);
        expect(body.error).toBe('INTERNAL_SERVER_ERROR');
    });

    // Business Logic - additionalItemsCount
    test('should return additionalItemsCount as 0 when totalCount equals items length', async () => {
        const mockTransactions = [{ amount: 100 }, { amount: 200 }];
        getCompanyMetadata.mockResolvedValue({ companyName: 'Test Corp' });
        getLatestTransactions.mockResolvedValue(mockTransactions);
        getRecentTransactionsCount.mockResolvedValue(2); // Same as array length
        getLatestInvoices.mockResolvedValue([]);

        const event = { pathParameters: { id: 'uuid-123' } };
        const response = await handler(event);
        const body = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(body.recentTransactions.additionalItemsCount).toBe(0);
    });

    // Business Logic - hasOverdueInvoice
    test('should return hasOverdueInvoice true when unpaid invoice has past due date', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7); // 7 days ago

        getCompanyMetadata.mockResolvedValue({ companyName: 'Test Corp' });
        getLatestTransactions.mockResolvedValue([]);
        getRecentTransactionsCount.mockResolvedValue(0);
        getLatestInvoices.mockResolvedValue([
            { id: 'inv-1', isPaid: false, dueDate: pastDate.toISOString() }
        ]);

        const event = { pathParameters: { id: 'uuid-123' } };
        const response = await handler(event);
        const body = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(body.invoiceSummary.hasOverdueInvoice).toBe(true);
    });

    test('should return hasOverdueInvoice false when all invoices are paid', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7);

        getCompanyMetadata.mockResolvedValue({ companyName: 'Test Corp' });
        getLatestTransactions.mockResolvedValue([]);
        getRecentTransactionsCount.mockResolvedValue(0);
        getLatestInvoices.mockResolvedValue([
            { id: 'inv-1', isPaid: true, dueDate: pastDate.toISOString() }
        ]);

        const event = { pathParameters: { id: 'uuid-123' } };
        const response = await handler(event);
        const body = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(body.invoiceSummary.hasOverdueInvoice).toBe(false);
    });

    test('should return hasOverdueInvoice false when unpaid invoice has future due date', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

        getCompanyMetadata.mockResolvedValue({ companyName: 'Test Corp' });
        getLatestTransactions.mockResolvedValue([]);
        getRecentTransactionsCount.mockResolvedValue(0);
        getLatestInvoices.mockResolvedValue([
            { id: 'inv-1', isPaid: false, dueDate: futureDate.toISOString() }
        ]);

        const event = { pathParameters: { id: 'uuid-123' } };
        const response = await handler(event);
        const body = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(body.invoiceSummary.hasOverdueInvoice).toBe(false);
    });

    // Edge Cases
    test('should handle empty transactions list', async () => {
        getCompanyMetadata.mockResolvedValue({ companyName: 'Test Corp' });
        getLatestTransactions.mockResolvedValue([]);
        getRecentTransactionsCount.mockResolvedValue(0);
        getLatestInvoices.mockResolvedValue([]);

        const event = { pathParameters: { id: 'uuid-123' } };
        const response = await handler(event);
        const body = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(body.recentTransactions.items).toEqual([]);
        expect(body.recentTransactions.totalCount).toBe(0);
        expect(body.recentTransactions.additionalItemsCount).toBe(0);
    });
});