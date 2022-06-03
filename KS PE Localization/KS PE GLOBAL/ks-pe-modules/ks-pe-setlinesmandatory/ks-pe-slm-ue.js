/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
    'N/search', 'N/error',
    '../../ks-co-functions/ks-co-core'
], (search, error, core) => {
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
        var method = 'ksSFLM.beforeLoad';
        var controlError = false;
        var newRecord = scriptContext.newRecord;
        var form = scriptContext.form;
        try {
            var customForm = newRecord.getValue({ fieldId: 'customform' });
            var setup = getSetup(customForm) //Buscamos si en este formulario se ejeuta el script
            if (setup !== null) {
                var filedsToSetMandatories = setup['custrecord_ks_sflm_mandatoryfields'];
                var arrFiledsToSetMandatories = filedsToSetMandatories.split(',');
                if (arrFiledsToSetMandatories.length > 0) {
                    for (var index = 0; index < arrFiledsToSetMandatories.length; index++) {
                        var strField = arrFiledsToSetMandatories[index];
                        if(strField){
                            var arrField = strField.split(':');
                            if(arrField.length==2){
                                var fieldSublit = form.getSublist({
                                    id: arrField[0]
                                });
                                if(fieldSublit){
                                    var nsField = fieldSublit.getField({
                                        id: arrField[1]
                                    })
                                    if(nsField){
                                        nsField.isMandatory = true;
                                    }                                    
                                }                                
                            }
                        }
                    }
                }
            }
        } catch (e) {
            core.log('ERROR', method, e);
            if (controlError) {
                throw e;
            }
        }
    }

    const getSetup = function (form) {
        var method = 'ksSFLM.getSetup';
        var controlError = false;
        var result = null;
        try {
            var filters = new Array();
            filters.push(search.createFilter({
                name: 'isinactive',
                operator: search.Operator.IS,
                values: false
            }))
            filters.push(search.createFilter({
                name: 'custrecord_ks_sflm_form',
                operator: search.Operator.ANYOF,
                values: form
            }))
            var columns = new Array();
            columns.push(search.createColumn({
                name: 'custrecord_ks_sflm_form',
                label: 'custrecord_ks_sflm_form'
            }))
            columns.push(search.createColumn({
                name: 'custrecord_ks_sflm_mandatoryfields',
                label: 'custrecord_ks_sflm_mandatoryfields'
            }))

            var __search = search.create({
                type: 'customrecord_ks_set_field_lines_mandator',
                filters: filters,
                columns: columns
            })
            var _search = core.jsonSearch(__search);
            if (_search && _search.length > 0) {
                result = _search[0];
            } else {
                controlError = true;
                throw error.create({
                    message: 'Setup no encontrado para el formulario ' + form + '.',
                    name: 'NOT_FIND_SETUP',
                    notifyOff: false
                })
            }
        } catch (e) {
            core.log('ERROR', method, e);
            if (controlError) {
                throw e;
            }
        }
        return result;
    }


    return { beforeLoad }

});
