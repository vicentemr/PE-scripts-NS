/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
    'N/transaction',
    'N/record',
    './ks-pe-functions/ks-pe-core',
    './ks-pe-modules/ks-pe-ontransactions-ue',
    './ks-pe-modules/ks-pe-onaccounts-ue',
    './ks-pe-modules/ks-pe-amountotwords/ks-pe-atw-ue',
    './ks-pe-modules/ks-pe-detraction/ks-pe-detraction-ue',
    // './ks-pe-modules/ks-pe-setlinesmandatory/ks-pe-slm-ue'
], (transaction,
    record,
    core,
    onTransactions,
    onAccounts,
    amounttowords,
    detraction
    // setlinesmandatory
) => {
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
        let method = 'GLOBAL UE PE beforeLoad';
        try {
            let newRecord = scriptContext.newRecord;
            //Si el registro es una transacción
            // for (const transactionTypeEnum in transaction.Type) {
            //     if (Object.hasOwnProperty.call(transaction.Type, transactionTypeEnum)) {
            //         const transactionType = transaction.Type[transactionTypeEnum];
            //         if (transactionType == newRecord.type) {
            //             let setup = core.getSetup();
            //             let recordSubsidiary = newRecord.getValue({
            //                 fieldId: 'subsidiary'
            //             });
            //             if (recordSubsidiary && setup[recordSubsidiary]) {
            //                 let subsidiaryModules = setup[recordSubsidiary];
            //                 if (subsidiaryModules.indexOf('setlinesmandatory')) {
            //                     setlinesmandatory.beforeLoad(scriptContext);
            //                 }
            //             }
            //         }
            //     }
            // }
            if (scriptContext.newRecord.type == record.Type.ACCOUNT) {
                onAccounts.beforeLoad(scriptContext);
            }

        } catch (error) {
            core.log('error', method, error)
        }
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
        let method = 'GLOBAL UE PE beforeSubmit';
        try {
            let newRecord = scriptContext.newRecord;
            //Si el registro es una transacción
            for (const transactionTypeEnum in transaction.Type) {
                if (Object.hasOwnProperty.call(transaction.Type, transactionTypeEnum)) {
                    const transactionType = transaction.Type[transactionTypeEnum];
                    if (transactionType == newRecord.type) {
                        let setup = core.getSetup();
                        let recordSubsidiary = newRecord.getValue({
                            fieldId: 'subsidiary'
                        });
                        if (recordSubsidiary && setup[recordSubsidiary]) {
                            let subsidiaryModules = setup[recordSubsidiary];

                            onTransactions.beforeSubmit(scriptContext);

                        }
                    }
                }
            }
        } catch (error) {
            core.log('error', method, error)
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
        let method = 'GLOBAL UE PE afterSubmit';
        try {
            let newRecord = scriptContext.newRecord;
            //Si el registro es una transacción
            for (const transactionTypeEnum in transaction.Type) {
                if (Object.hasOwnProperty.call(transaction.Type, transactionTypeEnum)) {
                    const transactionType = transaction.Type[transactionTypeEnum];
                    if (transactionType == newRecord.type) {
                        let setup = core.getSetup();
                        let recordSubsidiary = newRecord.getValue({
                            fieldId: 'subsidiary'
                        });
                        if (recordSubsidiary && setup[recordSubsidiary]) {
                            let subsidiaryModules = setup[recordSubsidiary];
                            if (subsidiaryModules.indexOf('amounttowords') != -1) {
                                amounttowords.afterSubmit(scriptContext);
                            }

                            if (subsidiaryModules.indexOf('detraction') != -1) {
                                detraction.afterSubmit(scriptContext);
                            }

                        }
                    }
                }
            }
        } catch (error) {
            core.log('error', method, error)
        }
    }

    return { beforeLoad, beforeSubmit, afterSubmit }

});