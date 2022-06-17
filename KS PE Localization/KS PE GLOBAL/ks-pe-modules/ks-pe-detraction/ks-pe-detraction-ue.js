/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/log', 'N/search', 'N/record', 'N/format', 'N/runtime',
    '../../ks-pe-functions/ks-pe-core',
    './ks-pe-detraction-functions'
], (log, search, record, format, runtime, core, lbry_detra) => {


    const beforeLoad = (context) => {}

    const afterSubmit = (context) => {
        let newRecord = context.newRecord;
        let contextType = context.type;
        let recType = newRecord.type;
        let recId = newRecord.id;
        let setupDetra = lbry_detra.getSetupDetra();
        try {
            if (recType == 'invoice') { // DETRACCION EN VENTAS
                var method = 'ksDetraOnSales.afterSubmit'
                if (contextType == 'edit' || contextType == 'create') {
                    var total = newRecord.getValue('total');
                    var detra = newRecord.getValue('custbody_kis_concep_detra');
                    var detraRate = newRecord.getValue('custbody_kspe_porcentaje_de_detraccion');
                    var tipoCambio = parseFloat(newRecord.getValue('exchangerate'));
                    var moneda = newRecord.getValue('currencysymbol');
                    core.log('DEBUG', method, 'detraRate: ' + detraRate + ' - ' + typeof(detraRate));
                    var montoDetraccion = 0;
                    var montoDetraccionCuota = 0;
                    if (detra && detraRate > 0) {
                        // if (moneda != 'PEN') {
                        //     montoDetraccion = total * detraRate / 100;
                        //     body = body.replace('-MONTODETRACCION-', Math.round(montoDetraccion * tipoCambio));
                        // } else {
                        //     montoDetraccion = Math.round(total * detraRate / 100);
                        //     body = body.replace('-MONTODETRACCION-', montoDetraccion);
                        // }
                        montoDetraccion = (total * detraRate / 100);
                        core.log('DEBUG', method, 'montoDetraccion: ' + montoDetraccion);

                        record.submitFields({
                            type: recType,
                            id: newRecord.id,
                            values: {
                                'custbody_kspe_monto_detraccion': montoDetraccion
                            },
                            options: {
                                ignoreMandatoryFields: true,
                                enableSourcing: true,
                                disableTriggers: true
                            }
                        });

                        //Creación o actualización de Journal
                        montoDetraccion = montoDetraccion * tipoCambio;
                        core.log('DEBUG', method, 'montoDetraccion para Journal: ' + montoDetraccion);
                        var credAcc_id = newRecord.getValue('account');
                        var customer = newRecord.getValue('customer');
                        if (customer == '' || customer == null) {
                            customer = newRecord.getValue('entity');
                        }
                        var subsiId = newRecord.getValue('subsidiary');
                        var fecha = newRecord.getValue('trandate');

                        var busqDebAcct = search.lookupFields({
                            type: 'customrecord_ks_pe_sunat_tablaanexo3',
                            id: detra,
                            columns: ['custrecord_kspe_cuenta_contable_temporal']
                        });
                        var debAcc_id = busqDebAcct.custrecord_kspe_cuenta_contable_temporal[0].value;
                        var transactionId = newRecord.id;

                        var busqRelatedJournals = search.create({
                            type: search.Type.JOURNAL_ENTRY,
                            columns: [
                                search.createColumn({
                                    name: "internalid",
                                    summary: "GROUP",
                                    label: "ID interno"
                                })
                            ],
                            filters: [
                                ['custbody_ks_pe_factura_vinculada', 'anyof', transactionId], 'and', ['mainline', 'is', 'T'], 'and', ['custbody_ks_pe_tipo_journal', 'anyof', 4]
                            ]
                        });

                        rsBusqRelatedJournals = busqRelatedJournals.run().getRange(0, 10);
                        core.log('DEBUG', method, 'Journals: ' + JSON.stringify(rsBusqRelatedJournals));
                        core.log('DEBUG', method, 'Journal relacionado: ' + rsBusqRelatedJournals.length);
                        if (rsBusqRelatedJournals.length > 0) {
                            for (var j = 0; j < rsBusqRelatedJournals.length; j++) {
                                var columns = rsBusqRelatedJournals[j].columns;
                                journalId = rsBusqRelatedJournals[j].getValue(columns[0]);
                                recJournal = record.load({
                                    type: record.Type.JOURNAL_ENTRY,
                                    id: journalId,
                                    isDynamic: true,
                                });

                                var lines = recJournal.getLineCount({ sublistId: 'line' })
                                core.log('DEBUG', method, 'lines: ' + lines);
                                for (var k = 0; k < lines; k++) {
                                    var objLine = recJournal.selectLine({
                                        sublistId: 'line',
                                        line: k
                                    });

                                    var debitAmount = objLine.getCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'debit'
                                    });

                                    var creditAmount = objLine.getCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'credit'
                                    });

                                    if (debitAmount) {
                                        objLine.setCurrentSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'debit',
                                            value: montoDetraccion
                                        });
                                        objLine.commitLine({ sublistId: 'line' });
                                    } else if (creditAmount) {
                                        objLine.setCurrentSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'credit',
                                            value: montoDetraccion
                                        });
                                        objLine.commitLine({ sublistId: 'line' });
                                    }
                                }
                                var idJournal = recJournal.save({
                                    enableSourcing: true,
                                    ignoreMandatoryFields: true
                                });

                                core.log('DEBUG', method, 'idJournal actualizado: ' + idJournal);
                            }
                        } else {
                            CreateJOURNAL(customer, subsiId, fecha, montoDetraccion, debAcc_id, credAcc_id, transactionId, setupDetra.monedaDetra);
                        }
                    }
                }
            }

            if (recType == 'vendorbill') { // DETRACCION EN COMPRAS
                var method = 'ksDetraOnPurchase.afterSubmit';
                try {
                    if (contextType.type != 'delete' && contextType.type != 'xedit') {
                        //Valida que el registro sea un vendor bill
                        let currentscript = runtime.getCurrentScript();
                        core.log('DEBUG', method, 'moneda:' + moneda);

                        if (contextType.type == 'create' || contextType.type == 'copy') {
                            var ajuste = lbry_detra.RoundTax(recId, setupDetra);
                            var journal = lbry_detra.createJournalPurchase(recId, setupDetra);
                            //nlapiLogExecution('DEBUG', 'vendorBillJournal', 'journal created 2'+journal);
                            core.log('DEBUG', method, 'CREACIÓN JOURNAL' + journal);
                        }
                        if (contextType.type == 'edit') {
                            var ajuste = lbry_detra.RoundTax(recId, setupDetra);
                            //Llamado a la funci�n para editar journal de detracciones
                            var journal = lbry_detra.editJournal(recId, setupDetra);
                            //nlapiSubmitField(recType, recId, 'custbody_ks_pe_factura_vinculada', journal);
                            core.log('DEBUG', method, 'EDICIÓN JOURNAL' + journal);
                        }
                    }
                } catch (e) {
                    core.log('ERROR', method, 'error: ' + e);
                }
            }
        } catch (e) {
            core.log('ERROR', method, 'error: ' + e);
        }
    }

    const beforeSubmit = (context) => {

        let newRecord = context.newRecord;
        let recType = newRecord.type;
        let recId = newRecord.id;
        try {
            if (recType == 'vendorbill') { // DETRACCION EN COMPRAS
                /**
                 * Si se elimina la factura se elimina el journal
                 */
                let method = 'recDetraBeforeSubmit';
                if (type == 'delete') {
                    deleteJournal(recId);
                }
                const whBase = newRecord.getValue('custpage_4601_witaxbaseamount');
                const whTaxAmount = newRecord.getValue('custpage_4601_witaxamount');
                newRecord.setValue("custbody_kspe_wh_base", whBase)
                newRecord.setValue("custbody_kspe_wh_amount", whTaxAmount)
            }
        } catch (e) {
            core.log('ERROR', method, 'error: ' + e);
        }
    }

    const CreateJOURNAL = function(customerId, subsidiary, trandate, numMonto, debitAccId, creditAccId, transactionId, monedaDetra) {
        var method = 'Crear JOURNAL';
        var strRegistro = 0;
        var currentscript = runtime.getCurrentScript();
        var moneda = monedaDetra
        try {
            var jeRec = record.create({
                type: record.Type.JOURNAL_ENTRY,
                isDynamic: true
            });

            core.log('DEBUG', method, 'Cliente: ' + customerId);

            jeRec.setValue({
                fieldId: 'subsidiary',
                value: subsidiary
            });

            jeRec.setValue({
                fieldId: 'approvalstatus',
                value: 2 //Aprobado
            });

            jeRec.setValue({
                fieldId: 'custbody_ks_pe_tipo_journal',
                value: 4 //Detraccion
            });

            jeRec.setValue({
                fieldId: 'currency',
                value: moneda //Soles
            });

            jeRec.setValue({
                fieldId: 'memo',
                value: 'JE AUTOMATICO calculo de detracciones'
            });

            jeRec.setValue({
                fieldId: 'trandate',
                value: format.parse({ value: trandate, type: format.Type.DATE })
            });

            jeRec.setValue({
                fieldId: 'custbody_ks_pe_factura_vinculada',
                value: transactionId
            });


            //  linea de debito
            jeRec.selectNewLine({
                sublistId: 'line'
            });
            jeRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'account',
                value: debitAccId
            });

            jeRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'debit',
                value: numMonto
            });

            jeRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'entity',
                value: customerId
            });

            jeRec.commitLine({
                sublistId: 'line'
            });


            // linea credito

            jeRec.selectNewLine({
                sublistId: 'line'
            });
            jeRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'account',
                value: creditAccId
            });

            jeRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'credit',
                value: numMonto
            });

            jeRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'entity',
                value: customerId
            });

            jeRec.commitLine({
                sublistId: 'line'
            });


            strRegistro = jeRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

            core.log('DEBUG', method, 'Id Journal: ' + strRegistro);

        } catch (ex) {
            core.log('ERROR', method, 'error journal: ' + ex);
        }
        return strRegistro

    }

    return {
        // beforeLoad,
        beforeSubmit,
        afterSubmit
    }
});