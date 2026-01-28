import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "eu-central-1",
    endpoint: process.env.DYNAMODB_ENDPOINT || "http://host.docker.internal:8000",
});

const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = process.env.TABLE_NAME || "QredMain";

/**
 * Fetch a single item by PK and SK
 */
export const getItem = async (pk, sk) => {
    const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk, SK: sk },
    });
    const response = await docClient.send(command);
    return response.Item;
};

/**
 * Query specific entities under a Company Partition
 */
export const queryEntities = async (pk, skPrefix, limit = 5) => {
    const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
        ExpressionAttributeValues: {
            ":pk": pk,
            ":skPrefix": skPrefix,
        },
        Limit: limit,
        ScanIndexForward: false, // Get in descending order (newest first)
    });

    const response = await docClient.send(command);
    return response.Items || [];
};

export const getRecentCount = async (pk, skPrefix) => {
    // Define 30 days in milliseconds (24h * 60m * 60s * 1000ms * 30d)
    const THIRTY_DAYS_MS = 24 * 60 * 60 * 1000 * 30;

    // Generate ISO string for the date 30 days ago from current time
    const dateLimit = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

    const command = new QueryCommand({
        TableName: TABLE_NAME,
        // Identify the company by PK and filter by SK starting with 'TRANS#' and newer than dateLimit
        KeyConditionExpression: "PK = :pk AND SK > :dateLimit",
        ExpressionAttributeValues: {
            ":pk": pk,
            ":dateLimit": `${skPrefix}${dateLimit}`,
        },
        Select: "COUNT",
    });

    try {
        const response = await docClient.send(command);
        // Return the Count property from the response, defaulting to 0 if not found
        return response.Count || 0;
    } catch (error) {
        // Log error details for cloud monitoring services (e.g., CloudWatch)
        console.error(`Error fetching transaction count for company ${pk}: skPrefix:${skPrefix}`, error);
        throw error;
    }
};