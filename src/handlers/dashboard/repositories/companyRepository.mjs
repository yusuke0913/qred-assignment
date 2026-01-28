import { getItem} from "../db/dynamodbClient.mjs";
import { idMapper } from "../db/idMapper.mjs";

/**
 * Fetches basic company metadata (credit limit, name, etc.)
 * @param {string} companyId - UUID of the company
 * @returns {Promise<Object|null>} Company data or null if not found
 */
export const getCompanyMetadata = async (companyId) => {
    const pk = idMapper.toCompanyPk(companyId)
    const sk = idMapper.toMetadataSk();
    return await getItem(pk, sk)
};
