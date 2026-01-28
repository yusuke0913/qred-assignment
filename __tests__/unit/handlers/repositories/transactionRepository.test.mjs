import { describe, test, expect, beforeEach } from '@jest/globals'

import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { getRecentTransactionsCount } from "../../../../src/handlers/dashboard/repositories/transactionRepository.mjs";

const ddbMock = mockClient(DynamoDBDocumentClient);

describe("transactionRepository", () => {
    beforeEach(() => ddbMock.reset());

    describe('getRecentTransactionsCount', () => {
        test("getRecentTransactionCount returns correct count", async () => {
            // Mocking the DynamoDB response
            ddbMock.on(QueryCommand).resolves({ Count: 57 });

            const count = await getRecentTransactionsCount("test-company-id");

            expect(count).toBe(57);

            /**
             * expecting the input
             *
             * {
             *   "TableName": "QredMain",
             *   "KeyConditionExpression": "PK = :pk AND SK > :dateLimit",
             *   "ExpressionAttributeValues": {
             *     ":pk": "COMPANY#test-company-id",
             *     ":dateLimit": "TX#2025-12-29T11:25:59.221Z"
             *   },
             *   "Select": "COUNT"
             * }
             *
             */
            const input = ddbMock.calls()[0].args[0].input
            expect(input.KeyConditionExpression).toContain("PK = :pk AND SK > :dateLimit");
            expect(input.ExpressionAttributeValues[":pk"]).toBe("COMPANY#test-company-id");
            expect(input.ExpressionAttributeValues[":dateLimit"]).toContain("TX#");

            const dateLimitValue = input.ExpressionAttributeValues[":dateLimit"];
            const extractedDate = new Date(dateLimitValue.replace("TX#", ""));

            // Expected timestamp is roughly 30 days ago
            const expectedTimestamp = Date.now() - (24 * 60 * 60 * 1000 * 30);

            // Allow a 10-second margin of error to account for the execution time of the test
            const marginOfError = 10000;

            expect(extractedDate.getTime()).toBeGreaterThanOrEqual(expectedTimestamp - marginOfError);
            expect(extractedDate.getTime()).toBeLessThanOrEqual(expectedTimestamp + marginOfError);
        });
    })
});