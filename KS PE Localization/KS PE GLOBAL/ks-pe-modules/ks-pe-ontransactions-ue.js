/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/transaction', '../ks-pe-functions/ks-pe-core'],
    (transaction, core) => {

        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            let method = 'On Transactions beforeSubmit'
            if (scriptContext.type != 'delete') {
                let newRecord = scriptContext.newRecord;
                let recordType = newRecord.type;
                if (recordType == transaction.Type.JOURNAL_ENTRY) {
                    const lineType = 'line';
                    let lineCount = newRecord.getLineCount({
                        sublistId: lineType
                    });
                    if (lineCount > 0) {
                        for (let l = 0; l < lineCount; l++) {
                            let currentLineEntity = newRecord.getSublistValue({
                                sublistId: lineType,
                                fieldId: 'entity',
                                line: l
                            })
                            let currentLineKsName = newRecord.getSublistValue({
                                sublistId: lineType,
                                fieldId: 'custcol_ks_name',
                                line: l
                            })

                            if (currentLineEntity != currentLineKsName) { //Se copia la entidad de la linea en Journals y se pega en el KS Name
                                newRecord.setSublistValue({
                                    sublistId: lineType,
                                    fieldId: 'custcol_ks_name',
                                    line: l,
                                    value: currentLineEntity
                                })
                            }

                            let currentLineTaxAccount = newRecord.getSublistValue({
                                sublistId: lineType,
                                fieldId: 'tax1acct',
                                line: l
                            })
                            let currentLineKsTaxAccount = newRecord.getSublistValue({
                                sublistId: lineType,
                                fieldId: 'custcol_ks_journal_tax_line',
                                line: l
                            })
                            if (currentLineTaxAccount != currentLineKsTaxAccount) { //Se copia la cuenta de impuestos del Journal y se pega en el campo de localización
                                newRecord.setSublistValue({
                                    sublistId: lineType,
                                    fieldId: 'custcol_ks_journal_tax_line',
                                    line: l,
                                    value: currentLineTaxAccount
                                })
                            }
                        }
                    }
                }

            }
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

        }

        return { beforeLoad, beforeSubmit, afterSubmit }

    });