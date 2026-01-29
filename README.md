# Qred Backend Case Study

Backend implementation for the Qred mobile dashboard view (Appendix 1).
## Local Setup

### Prerequisites
- Node.js 24+
- Docker
- AWS SAM CLI
- NoSQL Workbench (optional, for data modeling visualization)

### DynamoDB Local + SAM

1. Start DynamoDB Local:
```bash
docker run --rm -p 8000:8000 amazon/dynamodb-local
```

2. Import data model via NoSQL Workbench:
   - Open NoSQL Workbench → Data modeler → Import
   - Select `docs/databaseSchema/workbench-data-model.json`
   - Commit to DynamoDB Local (enable DDB Local connection)

3. Start API locally:
```bash
sam local start-api --env-vars env.json
```

4. Test the endpoint:
```bash
curl http://localhost:3000/companies/019bffec-3afb-7b63-8461-a89366547b11/dashboard
```

Alternatively, you can import `docs/apiSpecification/openapi.yaml` into Postman to test the API with a pre-configured collection.

## Database Schema

### Single Table Design

Using DynamoDB Single Table Design to minimize read operations and optimize for the dashboard use case.

| Entity | PK | SK                              | GSI1 (DueDateIndex) |
|--------|----|---------------------------------|---------------------|
| Company | `COMPANY#<id>` | `METADATA`                      | - |
| Transaction | `COMPANY#<id>` | `TX#<date>#<txId>`              | - |
| Invoice | `COMPANY#<id>` | `INVOICE#<dueDate>#<invoiceId>` | `dueDate` |

### Access Patterns

1. **Get company info** → Query PK=`COMPANY#<id>`, SK=`METADATA`
2. **Get recent transactions** → Query PK=`COMPANY#<id>`, SK begins_with `TX#`, ScanIndexForward=false
3. **Get unpaid invoices** → Query PK=`COMPANY#<id>`, SK begins_with `INVOICE#`, ScanIndexForward=false

Data model file: `docs/databaseSchema/workbench-data-model.json`

## API Specification

### Endpoint

```
GET /companies/{companyId}/dashboard
```

### Response Structure

```json
{
  "company": {
    "companyName": "Company AB",
    "creditLimit": 10000,
    "remainingSpend": 5400,
    "currency": "SEK"
  },
  "recentTransactions": {
    "items": [
       {
          "amount": 1159,
          "SK": "TX#2026-01-27T16:00:00Z#0193a100",
          "currency": "SEK",
          "PK": "COMPANY#019bffec-3afb-7b63-8461-a89366547b11",
          "transactionDate": "2026-01-27T16:00:00Z",
          "category": "Finance",
          "merchantName": "Starbucks"
       }
    ],
    "totalCount": 57,
    "additionalItemsCount": 52
  },
  "invoiceSummary": {
    "hasOverdueInvoice": true,
    "nextPaymentDueDate": "2026-02-10",
    "totalOutstandingAmount": 12500
  }
}
```

OpenAPI specification: `docs/apiSpecification/openapi.yaml`

## Implementation

### Tech Stack
- Node.js + AWS SAM
- DynamoDB (Single Table Design)
- Jest for testing

### Project Structure
```
src/handlers/dashboard/
├── getDashboard.mjs          # Main handler
├── db/
│   ├── dynamodbClient.mjs    # DynamoDB client setup
│   └── idMapper.mjs          # PK/SK helpers
└── repositories/
    ├── companyRepository.mjs
    ├── transactionRepository.mjs
    └── invoiceRepository.mjs
```

### Design Decisions

- **Single API endpoint**: Consolidated response to minimize frontend API calls and reduce latency
- **Repository pattern**: Separation of data access logic for testability
- **SK design for transactions**: `TX#<date>#<id>` and invoices**: `INVOICE#<dueDate>#<id>` enables efficient reverse chronological queries

## Testing

```bash
npm test
```

- Handler tests: Error handling, response payload structure
- Repository tests: DynamoDB command verification

### Mock Server (API Only)

For quick API testing without waiting for backend implementation, use Prism to mock the OpenAPI specification:

```bash
  npx @stoplight/prism-cli mock docs/apiSpecification/openapi.yaml                                                                                                     
                                                                                                                                                                       
  # Test with dynamic response generation:                                                                                                                               
  curl http://127.0.0.1:4010/companies/123/dashboard -H "Prefer: dynamic=true"                                                                                         
```
This enables frontend and backend teams to develop in parallel.  
             
## Future Improvements

- **Authentication**: Retrieve companyId from access token instead of path parameter
- **Input validation**: Add schema validation for request parameters
- **Monitoring**: CloudWatch metrics and alarms for error rates and latency
