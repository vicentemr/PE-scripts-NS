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
            let method = 'UE PE OnAccount beforeLoad';
            let form = scriptContext.form;
            let peruvianAccountFields = ['custrecord_ks_pe_nivel1', 'custrecord_ks_pe_nivel2', 'custrecord_ks_pe_nivel3', 'custrecord_ks_pe_nivel4', 'custrecord_ks_pe_nivel5'];
            form.addTab({
                id: 'custpage_ks_pe_accounttab',
                label: 'KS Perú'
            });
            form.addFieldGroup({
                id: 'custpage_ks_pe_accountgroup',
                label: 'Perú',
                tab: 'custpage_ks_pe_accounttab'
            });
            let hideFields = form.addField({
                id: 'custpage_ks_pe_accounttab',
                type: serverWidget.FieldType.TEXT,
                label: 'KS PE ACCOUNT FORM PROTOCOL',
                container: 'custpage_ks_pe_accountgroup'
            });
            hideFields.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            for (let index = 0; index < peruvianAccountFields.length; index++) {
                const fieldId = peruvianAccountFields[index];
                let field = form.getField({
                    id: fieldId
                });
                form.insertField({
                    field: field,
                    nextfield: 'custpage_ks_pe_accounttab'
                });
            }

        }
        return { beforeLoad }

    });