import { idMapper } from "../db/idMapper.mjs";
import {queryEntities} from "../db/dynamodbClient.mjs";

export const getLatestInvoices = async (companyId, limit = 5) => {
    const pk = idMapper.toCompanyPk(companyId)
    const prefix = idMapper.toInvoicePrefix()
    return queryEntities(pk, prefix, limit);
};