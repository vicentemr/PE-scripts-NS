/**
 /**
 * @NApiVersion 2.1
 * @NScriptType MassUpdateScript
 */
define(['N/runtime','N/record','../../ks-co-functions/ks-co-core'],
    
    (runtime,record,core) => {
        /**
         * Defines the Mass Update trigger point.
         * @param {Object} params
         * @param {string} params.type - Record type of the record being processed
         * @param {number} params.id - ID of the record being processed
         * @since 2016.1
         */
        const each = (params) => {
            let method = 'ks-co-sumarizeaccounts';
            let scriptObj = runtime.getCurrentScript();
            let sumarize = scriptObj.getParameter({
                name: 'custscript_ks_co_sumarize'
            })
            try {
                core.log('debug',method,'sumarize:'+sumarize)
                record.submitFields({
                    type: params.type,
                    id: params.id,
                    values: {
                        isinactive:sumarize,
                        issummary:sumarize
                    },
                    options: {
                        enablesourcing: true,
                    }
                })
            } catch (e) {
                core.log('error',method,e)
            }
        }

        return {each}

    });
