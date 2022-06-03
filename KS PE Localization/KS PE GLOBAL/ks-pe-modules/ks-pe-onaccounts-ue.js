/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'],
    /**
 * @param{serverWidget} serverWidget
 */
    (serverWidget) => {
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
            let method = 'UE OnAccount beforeLoad';
            let form = scriptContext.form;
            let colombianAccountFields = ['custrecord_ks_co_clase','custrecord_ks_co_grupo','custrecord_ks_co_cuenta','custrecord_ks_co_subcuenta','custrecord_ks_co_cuenta_auxiliar','custrecord_kis_numero_cuenta','custrecord_co_ks_formato','custrecord_co_ks_concepto'];
            form.addTab({
                id : 'custpage_ks_co_accounttab',
                label : 'KS Colombia'
            });
            form.addFieldGroup({
                id : 'custpage_ks_co_accountgroup',
                label : 'Colombia',
                tab:'custpage_ks_co_accounttab'
            });
            let hideFields = form.addField({
                id : 'custpage_ks_co_accounttab',
                type : serverWidget.FieldType.TEXT,
                label : 'KS CO ACCOUNT FORM PROTOCOL',
                container:'custpage_ks_co_accountgroup'
            });
            hideFields.updateDisplayType({
                displayType : serverWidget.FieldDisplayType.HIDDEN
            });
            
            for (let index = 0; index < colombianAccountFields.length; index++) {
                const fieldId = colombianAccountFields[index];
                let field = form.getField({
                    id : fieldId
                });
                form.insertField({
                    field : field,
                    nextfield : 'custpage_ks_co_accounttab'
                });
            }
            
        }
        return {beforeLoad}

    });
