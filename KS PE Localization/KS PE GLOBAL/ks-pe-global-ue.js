/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
    'N/transaction',
    'N/record',
    './ks-co-functions/ks-co-core',
    './ks-co-modules/ks-co-ontransactions-ue',
    './ks-co-modules/ks-co-onaccounts-ue',
    './ks-co-modules/ks-co-amountotwords/ks-co-atw-ue',
    './ks-co-modules/ks-co-setlinesmandatory/ks-co-slm-ue'
],(   transaction,
        record,
        core,
        onTransactions,
        onAccounts,
        amounttowords,
        setlinesmandatory) => {
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
            let method = 'GLOBAL UE beforeLoad';
            try {
                let newRecord = scriptContext.newRecord;
                //Si el registro es una transacción
                for (const transactionTypeEnum in transaction.Type) {
                    if (Object.hasOwnProperty.call(transaction.Type, transactionTypeEnum)) {
                        const transactionType = transaction.Type[transactionTypeEnum];
                        if(transactionType==newRecord.type){
                            let setup = core.getSetup();
                            let recordSubsidiary = newRecord.getValue({
                                fieldId: 'subsidiary'
                            });
                            if(recordSubsidiary && setup[recordSubsidiary]){
                                let subsidiaryModules = setup[recordSubsidiary];
                                if(subsidiaryModules.indexOf('setlinesmandatory')){
                                    setlinesmandatory.beforeLoad(scriptContext);
                                }
                            }
                        }
                    }
                }
                if(scriptContext.newRecord.type==record.Type.ACCOUNT){
                    onAccounts.beforeLoad(scriptContext);
                }               
                
            } catch (error) {
                core.log('error',method,error)
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
            let method = 'GLOBAL UE beforeSubmit';
            try {
                let newRecord = scriptContext.newRecord;
                //Si el registro es una transacción
                for (const transactionTypeEnum in transaction.Type) {
                    if (Object.hasOwnProperty.call(transaction.Type, transactionTypeEnum)) {
                        const transactionType = transaction.Type[transactionTypeEnum];
                        if(transactionType==newRecord.type){
                            let setup = core.getSetup();
                            let recordSubsidiary = newRecord.getValue({
                                fieldId: 'subsidiary'
                            });
                            if(recordSubsidiary && setup[recordSubsidiary]){
                                let subsidiaryModules = setup[recordSubsidiary];
                                
                                onTransactions.beforeSubmit(scriptContext);
                                
                            }
                        }
                    }
                }
            } catch (error) {
                core.log('error',method,error)
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
            let method = 'GLOBAL UE afterSubmit';
            try {
                let newRecord = scriptContext.newRecord;
                //Si el registro es una transacción
                for (const transactionTypeEnum in transaction.Type) {
                    if (Object.hasOwnProperty.call(transaction.Type, transactionTypeEnum)) {
                        const transactionType = transaction.Type[transactionTypeEnum];
                        if(transactionType==newRecord.type){
                            let setup = core.getSetup();
                            let recordSubsidiary = newRecord.getValue({
                                fieldId: 'subsidiary'
                            });
                            if(recordSubsidiary && setup[recordSubsidiary]){
                                let subsidiaryModules = setup[recordSubsidiary];
                                if(subsidiaryModules.indexOf('amounttowords')){
                                    amounttowords.afterSubmit(scriptContext);
                                }
                                
                            }
                        }
                    }
                }
            } catch (error) {
                core.log('error',method,error)
            }
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
