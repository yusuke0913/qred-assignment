import { idMapper } from "../db/idMapper.mjs";
import {getRecentCount, queryEntities} from "../db/dynamodbClient.mjs";

export const getLatestTransactions = async (companyId, limit = 3) => {
    const pk = idMapper.toCompanyPk(companyId)
    const prefix = idMapper.toTransactionPrefix()
    return queryEntities(pk, prefix, limit);
};

export const getRecentTransactionsCount = async (companyId) => {
    const pk = idMapper.toCompanyPk(companyId)
    const prefix = idMapper.toTransactionPrefix()
    return await getRecentCount(pk, prefix)
}