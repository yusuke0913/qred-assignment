
export const idMapper = {
    toCompanyPk: (id) => `COMPANY#${id}`,
    toMetadataSk: () => "METADATA",
    toTransactionPrefix: (date = "") => `TX#${date}`,
    toInvoicePrefix: (date = "") => `INVOICE#${date}`,

    // Parse the SK returned from DB into human-readable format
    parseSk: (sk) => sk.split('#')[1]
};
