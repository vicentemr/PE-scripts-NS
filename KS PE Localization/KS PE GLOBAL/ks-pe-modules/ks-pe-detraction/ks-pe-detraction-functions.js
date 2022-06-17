/**
 * @NApiVersion 2.1
 */
define(['N/search', 'N/record', 'N/log'],
    (search, record, log) => {
        //Funcion para crear journal de detracciones
        const createJournalPurchase = (id, setupDetra) => {
            let method = 'createJournalPurchase';
            try {
                log.debug('generar journal', 'init');
                //var accountSetup = getAccountSetup();
                //Variable para guardar el id interno del journal de detracciones
                var idJournal = 0;
                let monedadetraccion = setupDetra.monedaDetra
                    //Objeto que carga la informaci�n del vendor bill creado
                var VendorBill = record.load({
                    type: 'vendorbill',
                    id: id,
                    isDynamic: true,
                });
                //Conteo de lineas de items en el vendor bill
                var count = VendorBill.getLineCount({
                    sublistId: 'item'
                });

                //Consulta los numeros de cuenta en el account setup para verificar spbre que lineas se debe crear journal de detracciones
                let accountOrigen = setupDetra.cuentaOrigen
                let accountDestino = setupDetra.cuentaDestino
                let accountOrigenDolares = setupDetra.cuentaOrigenDolar

                log.debug(method, 'init accountDestino ' + accountDestino);
                log.debug(method, 'init accountOrigen ' + accountOrigen);
                log.debug(method, 'init accountOrigenDolares ' + accountOrigenDolares);
                log.debug(method, 'init num items' + count);
                //Variable para almacenar el monto del journal
                let amount = 0;
                //Ciclo para recorrer las distintas lineas de items
                for (const i = 1; i <= count; i++) {
                    //Objeto que almacena el item que esta siendo verificado en el ciclo
                    let itemLine = VendorBill.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    log.debug(method, 'init item id ' + itemLine);
                    //Variable que almacena el tipo de articulo al que pertenece el item
                    let articletype = VendorBill.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemtype',
                        line: i
                    });
                    //var articletype=nlapiLookupField('item', itemLine, 'type');
                    log.debug(method, 'init line type ' + articletype);
                    //Valida si el item es un item de descuento
                    if (articletype == 'Discount') {
                        //Objeto que almacena el articulo que se incluyo en la linea
                        let article = record.load({
                            type: 'discountitem',
                            id: itemLine,
                            isDynamic: true,
                        });
                        //valor de la cuenta que tiene asignada el articulo
                        let accountLine = article.getValue('account');
                        log.debug(method, 'init line discount ' + i);
                        //var accountLine=nlapiLookupField('discountitem', itemLine, 'accountingbook');
                        log.debug(method, 'init item account ' + accountLine);
                        //Valida si la cuenta del articulo es igual a la cuenta configurada en el account setup
                        let exchangerate = VendorBill.getValue('exchangerate');
                        if (parseInt(accountLine) == parseInt(accountDestino) || parseInt(accountLine) == parseInt(accountOrigen) || parseInt(accountLine) == parseInt(accountOrigenDolares)) {
                            const am = VendorBill.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                line: i
                            });
                            amount = parseInt(Math.round(am) * exchangerate);
                            log.debug('Editar journal', 'item amount:: ' + amount + " exchangerate:: " + exchangerate);
                        }
                        //Objeto que almacenara el journal a crear
                        let journal = record.create({
                            type: 'journalentry',
                            isDynamic: true
                        });
                        //var moneda = nlapiLookupField('invoice', id, 'currency',true);
                        //Valor que almacena el tipo de moneda del vendor bill
                        let monedaID = VendorBill.getValue('currency');

                        log.debug(method, 'init moneda ' + monedaID);
                        //Valor que almacena la location del vendor bill

                        //var location = nlapiLookupField('vendorbill', id, 'location');
                        let location = VendorBill.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'location',
                            line: i
                        });
                        let department = VendorBill.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'department',
                            line: i
                        });
                        log.debug(method, 'init 2 ' + department);

                        //var clase = nlapiLookupField('vendorbill', id, 'class');
                        //Valor que almacenala clase del vendor bill
                        let clase = VendorBill.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'class',
                            line: i
                        });
                        //Valor que almacena la subsidiaria del vendor bill
                        let subsidiary = VendorBill.getValue('subsidiary');
                        log.debug(method, 'vendorBillJournal', 'init 2');
                        //nlapiSubmitField('invoice', id, 'custbody_ut001_provisionada', 'T');
                        log.debug(method, 'FacturaActualizada_', id);
                        //Valor que almacena el proveedor del vendor bill
                        let vendor = VendorBill.getValue('entity');
                        //Asigna los valores consultados al journal
                        journal.setValue('currency', monedadetraccion);
                        journal.setValue('approvalstatus', 2);

                        journal.setValue('custbody_ks_pe_factura_vinculada', id);
                        journal.setValue('custbody_ks_pe_tipo_journal', setupDetra.tipoAsiento);
                        journal.setValue('subsidiary', subsidiary);
                        if (department) {
                            journal.setValue('department', parseInt(department));
                        }

                        log.debug(method, 'vendorBillJournal', 'init 3');
                        journal.selectNewLine({
                            sublistId: 'line'
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'memo',
                            value: setupDetra.memoDetra
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'account',
                            value: parseInt(accountDestino)
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'debit',
                            value: amount
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'class',
                            value: clase
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'location',
                            value: location
                        });
                        if (department) {
                            journal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'department',
                                value: parseInt(department)
                            });
                        }
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'entity',
                            value: vendor
                        });
                        journal.commitLine({
                            sublistId: 'line'
                        });

                        journal.selectNewLine({
                            sublistId: 'line'
                        });
                        //Asigna el numerod e cuenta a el valor de la linea del journal dependiendo de la moneda origen
                        if (monedaID == monedadetraccion) {
                            journal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'account',
                                value: parseInt(accountOrigen)
                            });
                        } else {
                            journal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'account',
                                value: parseInt(accountOrigenDolares)
                            });
                        }
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'memo',
                            value: setupDetra.memoDetra
                        });

                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'credit',
                            value: amount
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'class',
                            value: clase
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'location',
                            value: location
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'entity',
                            value: vendor
                        });
                        if (department) {
                            journal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'department',
                                value: parseInt(department)
                            });
                        }
                        //Crea el journal
                        journal.commitLine({
                            sublistId: 'line'
                        });

                        log.debug('vendorBillJournal item', 'init 4 department ' + department);
                        log.debug('vendorBillJournal item', 'init 4 accountDestino ' + accountDestino);
                        log.debug('vendorBillJournal item', 'init 4 vendor ' + vendor);
                        log.debug('vendorBillJournal item', 'init 4 clase ' + clase);
                        log.debug('vendorBillJournal item', 'init 4 accountOrigen ' + accountOrigen);
                        log.debug('vendorBillJournal item', 'init 4 credit ' + amount);
                        log.debug('vendorBillJournal item', 'init 4 subsidiary ' + subsidiary);

                        idJournal = record.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        })
                        log.debug('JournalCreated', idJournal);
                    }

                    //amount = nlapiLookupField('vendorbill', id, 'total');

                }
                //Cuenta las lineas de gastos
                let countExpense = VendorBill.getLineCount({
                    sublistId: 'expense'
                });
                log.debug('generar journal', 'init num expenses ' + countExpense);
                //variable para almacenar el monto del journal
                var amount = 0;
                //Ciclo para recorrer las lineas de gastos 
                for (var i = 1; i <= countExpense; i++) {

                    //Variable que almacena las lineas de gastos
                    let accountLine = VendorBill.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'account',
                        line: i
                    });
                    log.debug('generar journal', 'init line account' + accountLine);
                    //log.debug('generar journal', 'init acc setup 1' +accountSetup[21]);
                    //log.debug('generar journal', 'init acc setup 1' +accountSetup[22]);
                    let exchangerate = VendorBill.getValue('exchangerate');
                    if (parseInt(accountLine) == parseInt(accountDestino) || parseInt(accountLine) == parseInt(accountOrigen) || parseInt(accountLine) == parseInt(accountOrigenDolares)) {
                        const am = VendorBill.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'amount',
                            line: i
                        });
                        amount = parseInt(Math.round(am) * exchangerate);
                        log.debug('generar journal', 'init' + amount);

                        //Objeto que almacenara el journal a crear
                        let journal = record.create({
                            type: 'journalentry',
                            isDynamic: true
                        });
                        //			var moneda = nlapiLookupField('invoice', id, 'currency',true);
                        let monedaID = VendorBill.getValue('currency');
                        //var location = nlapiLookupField('vendorbill', id, 'location');
                        let location = VendorBill.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'location',
                            line: i
                        });
                        let department = VendorBill.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'department',
                            line: i
                        });
                        log.debug('vendorBillJournal', 'init 2 ' + department);
                        //var clase = nlapiLookupField('vendorbill', id, 'class');
                        let clase = VendorBill.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'class',
                            line: i
                        });
                        var vendor = nlapiLookupField('vendorbill', id, 'entity');
                        var subsidiary = VendorBill.getValue('subsidiary');

                        log.debug('vendorBillJournal', 'init 2');
                        log.debug('FacturaActualizada_', id);

                        journal.setValue('currency', monedadetraccion);
                        journal.setValue('custbody_ks_pe_factura_vinculada', id);
                        journal.setValue('custbody_ks_pe_tipo_journal', setupDetra.tipoAsiento);
                        journal.setValue('subsidiary', subsidiary);
                        journal.setValue('department', parseInt(department));
                        journal.setValue('approvalstatus', 2);
                        log.debug('vendorBillJournal', 'init 3');
                        journal.selectNewLine({
                            sublistId: 'line'
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'memo',
                            value: setupDetra.memoDetra
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'account',
                            value: parseInt(accountDestino)
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'debit',
                            value: amount
                        });

                        log.debug('monto', amount);
                        if (clase) {
                            journal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'class',
                                value: clase
                            });
                        }
                        log.debug('clase', clase);
                        if (location) {
                            journal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'location',
                                value: location
                            });
                        }
                        if (department) {
                            journal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'department',
                                value: parseInt(department)
                            });
                        }

                        log.debug('ubicacion', location);
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'entity',
                            value: vendor
                        });
                        journal.commitLine({
                            sublistId: 'line'
                        });

                        journal.selectNewLine({
                            sublistId: 'line'
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'memo',
                            value: setupDetra.memoDetra
                        });
                        if (monedaID == 1) {
                            journal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'account',
                                value: parseInt(accountOrigen)
                            });
                        } else {
                            journal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'account',
                                value: parseInt(accountOrigenDolares)
                            });
                        }
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'credit',
                            value: amount
                        });
                        if (clase) {
                            journal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'class',
                                value: clase
                            });
                        }
                        if (location) {
                            journal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'location',
                                value: location
                            });
                        }
                        if (department) {
                            journal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'department',
                                value: parseInt(department)
                            });
                        }
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'entity',
                            value: vendor
                        });
                        journal.commitLine({
                            sublistId: 'line'
                        });

                        log.debug('vendorBillJournalexp', 'init 4 ' + department);
                        idJournal = record.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        })
                        log.debug('JournalCreated', idJournal);
                    }
                }


            } catch (e) {
                log.error('Error Creando Journal det', e);
            }
            return idJournal;

        }

        const editJournal = (id, setupDetra) => {
            try {
                var idJournal;
                let monedadetraccion = setupDetra.monedaDetra
                log.debug('generar journal', 'init');
                //var accountSetup = getAccountSetup();

                var VendorBill = record.load({
                    type: 'vendorbill',
                    id: id,
                    isDynamic: true,
                });
                var count = VendorBill.getLineCount({
                    sublistId: 'item'
                });
                let accountOrigen = setupDetra.cuentaOrigen
                let accountDestino = setupDetra.cuentaDestino
                let accountOrigenDolares = setupDetra.cuentaOrigenDolar

                log.debug('generar journal', 'init acc setup 1' + accountDestino);
                log.debug('generar journal', 'init acc setup 1' + accountOrigen);
                log.debug('generar journal', 'init acc setup 1' + accountOrigenDolares);
                log.debug('generar journal', 'init num items' + count);

                var amount = 0;
                for (var i = 1; i <= count; i++) {
                    let itemLine = VendorBill.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    log.debug('generar journal', 'init item id ' + itemLine);
                    let articletype = VendorBill.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemtype',
                        line: i
                    });
                    //var articletype=nlapiLookupField('ite8m', itemLine, 'type');
                    log.debug('generar journal', 'init line type ' + articletype);
                    if (articletype == 'Discount') {
                        let article = record.load({
                            type: 'discountitem',
                            id: itemLine,
                            isDynamic: true,
                        });
                        var accountLine = article.getValue('account');
                        log.debug('generar journal', 'init line discount ' + i);
                        //var accountLine=nlapiLookupField('discountitem', itemLine, 'accountingbook');
                        log.debug('generar journal', 'init item account ' + accountLine);
                        var exchangerate = VendorBill.getValue('exchangerate');
                        if (parseInt(accountLine) == parseInt(accountDestino) || parseInt(accountLine) == parseInt(accountOrigen) || parseInt(accountLine) == parseInt(accountOrigenDolares)) {
                            const am = VendorBill.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                line: i
                            });
                            amount = parseInt(Math.round(am) * exchangerate);
                            log.debug('Editar journal', 'item amount:: ' + amount + " exchangerate:: " + exchangerate);
                        }

                        let searchDetails = search.create({
                            type: 'journalentry',
                            filters: [
                                search.createFilter({
                                    name: 'custbody_ks_pe_factura_vinculada',
                                    operator: 'anyof',
                                    values: [id]
                                }),
                                search.createFilter({
                                    name: 'custbody_ks_pe_tipo_journal',
                                    operator: 'anyof',
                                    values: [setupDetra.tipoAsiento]
                                })
                            ],
                            columns: [
                                search.createColumn({
                                    name: 'internalid'
                                })
                            ]
                        })
                        log.debug('actualzar journal', 'journalResults ' + JSON.stringify(searchDetails));
                        let journalResults = searchDetails.run().getRange(0, 1000);
                        if (!journalResults) {
                            idJournal = createJournalPurchase(id, setupDetra);
                        } else {
                            for (j = 0; j < journalResults.length; j++) {
                                var journalId = journalResults[j].getValue(columns[0]);
                                log.debug('Jpurnal a actualizar', journalId);
                                let journal = record.load({
                                    type: journalentry,
                                    id: journalId,
                                    isDynamic: true,
                                });
                                //var moneda = nlapiLookupField('invoice', id, 'currency',true);
                                var monedaID = VendorBill.getValue('currency');
                                //var location = nlapiLookupField('vendorbill', id, 'location');
                                let itemlocationLine = VendorBill.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'location',
                                    line: i
                                });
                                let department = VendorBill.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'department',
                                    line: i
                                });
                                log.debug('vendorBillJournal', 'init 2 ' + department);
                                //var clase = nlapiLookupField('vendorbill', id, 'class');
                                let clase = VendorBill.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'class',
                                    line: i
                                });

                                var vendor = VendorBill.getValue('entity');

                                log.debug('vendorBillJournal', 'init 2');
                                //nlapiSubmitField('invoice', id, 'custbody_ut001_provisionada', 'T');
                                log.debug('FacturaActualizada_', id);

                                //log.debug('FacturaActualizada_', accountSetup);
                                //journal.setFieldValue('custbody_ut001_tipotra_je', '9');
                                //journal.setFieldValue('currency',monedadetraccion);
                                journal.setValue('custbody_ks_pe_factura_vinculada', id);
                                journal.setValue('custbody_ks_pe_tipo_journal', setupDetra.tipoAsiento);
                                journal.setValue('approvalstatus', 2);
                                if (department) {
                                    journal.setValue('department', parseInt(department));
                                }
                                log.debug('vendorBillJournal', 'init 3');
                                var objLine = journal.selectLine({
                                    sublistId: 'line',
                                    line: 1
                                });
                                //journal.selectNewLineItem('line');
                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'memo',
                                    value: setupDetra.memoDetra
                                });
                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'account',
                                    value: parseInt(accountDestino)
                                });
                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'debit',
                                    value: amount
                                });
                                if (clase) {
                                    objLine.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'class',
                                        value: clase
                                    });
                                }
                                if (location) {
                                    objLine.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'location',
                                        value: location
                                    });
                                }
                                if (department) {
                                    objLine.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'department',
                                        value: parseInt(department)
                                    });
                                }

                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'entity',
                                    value: vendor
                                });
                                objLine.commitLine({ sublistId: 'line' });

                                var objLine = journal.selectLine({
                                    sublistId: 'line',
                                    line: 2
                                });

                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'memo',
                                    value: setupDetra.memoDetra
                                });
                                if (monedaID == 1) {
                                    objLine.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'account',
                                        value: parseInt(accountOrigen)
                                    });
                                } else {
                                    objLine.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'account',
                                        value: parseInt(accountOrigenDolares)
                                    });
                                }

                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'credit',
                                    value: amount
                                });
                                if (clase) {
                                    objLine.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'class',
                                        value: clase
                                    });
                                }
                                if (location) {
                                    objLine.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'location',
                                        value: location
                                    });
                                }
                                if (department) {
                                    objLine.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'department',
                                        value: parseInt(department)
                                    });
                                }

                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'entity',
                                    value: vendor
                                });
                                objLine.commitLine({ sublistId: 'line' });

                                log.debug('vendorBillJournal item', 'init 4 ' + department);
                                idJournal = record.save({
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                })
                                log.debug('JournalCreated', idJournal);
                                break;

                            }
                        }
                    }
                }

                let countExpense = VendorBill.getLineCount({
                    sublistId: 'expense'
                });
                log.debug('generar journal', 'init num expenses' + countExpense);
                for (var i = 1; i <= countExpense; i++) {
                    let accountLine = VendorBill.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'account',
                        line: i
                    });
                    log.debug('generar journal', 'init line account' + accountLine);

                    //log.debug('generar journal', 'init acc setup 1' +accountSetup[21]);
                    //log.debug('generar journal', 'init acc setup 1' +accountSetup[22]);
                    var exchangerate = VendorBill.getValue('exchangerate');
                    if (parseInt(accountLine) == parseInt(accountDestino) || parseInt(accountLine) == parseInt(accountOrigen) || parseInt(accountLine) == parseInt(accountOrigenDolares)) {
                        const am = VendorBill.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'amount',
                            line: i
                        });
                        amount = parseInt(Math.round(am) * exchangerate);
                        //log.debug('Jpurnal a actualizar', journalResults.length);
                        let searchDetails = search.create({
                            type: 'journalentry',
                            filters: [
                                search.createFilter({
                                    name: 'custbody_ks_pe_factura_vinculada',
                                    operator: 'anyof',
                                    values: [id]
                                }),
                                search.createFilter({
                                    name: 'custbody_ks_pe_tipo_journal',
                                    operator: 'anyof',
                                    values: [setupDetra.tipoAsiento]
                                })
                            ],
                            columns: [
                                search.createColumn({
                                    name: 'internalid'
                                })
                            ]
                        })
                        log.debug('actualzar journal', 'journalResults ' + JSON.stringify(searchDetails));
                        let journalResults = searchDetails.run().getRange(0, 1000);
                        if (!journalResults) {
                            log.debug('generar journal', 'init create' + id);
                            idJournal = createJournalPurchase(id, setupDetra);
                        } else {
                            for (j = 0; j <= journalResults.length; j++) {
                                var journalId = journalResults[j].getValue(columns[0]);
                                log.debug('Jpurnal a actualizar', journalId);
                                var journal = record.load({
                                    type: 'journalentry',
                                    id: journalId,
                                    isDynamic: true,
                                });
                                //var moneda = nlapiLookupField('invoice', id, 'currency',true);
                                var monedaID = VendorBill.getValue('currency');
                                //var location = nlapiLookupField('vendorbill', id, 'location');
                                let location = VendorBill.getSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'location',
                                    line: i
                                });
                                let department = VendorBill.getSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'department',
                                    line: i
                                });
                                log.debug('vendorBillJournal', 'init 2 ' + department);
                                //var clase = nlapiLookupField('vendorbill', id, 'class');
                                let clase = VendorBill.getSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'class',
                                    line: i
                                });
                                var vendor = VendorBill.getValue('entity');

                                log.debug('vendorBillJournal', 'init 2');
                                //nlapiSubmitField('invoice', id, 'custbody_ut001_provisionada', 'T');
                                log.debug('FacturaActualizada_', id);

                                //log.debug('FacturaActualizada_', accountSetup);
                                //journal.setFieldValue('custbody_ut001_tipotra_je', '9');
                                journal.setValue('currency', monedadetraccion);
                                journal.setValue('custbody_ks_pe_factura_vinculada', id);
                                journal.setValue('department', parseInt(department));
                                journal.setValue('approvalstatus', 2);
                                journal.setValue('custbody_ks_pe_tipo_journal', setupDetra.tipoAsiento);

                                log.debug('vendorBillJournal', 'init 3');
                                var objLine = journal.selectLine({
                                    sublistId: 'line',
                                    line: 1
                                });
                                //journal.selectNewLineItem('line');
                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'memo',
                                    value: setupDetra.memoDetra
                                });
                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'account',
                                    value: accountDestino
                                });
                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'debit',
                                    value: amount
                                });
                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'class',
                                    value: clase
                                });
                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'location',
                                    value: location
                                });
                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'department',
                                    value: parseInt(department)
                                });
                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'entity',
                                    value: vendor
                                });
                                objLine.commitLine({ sublistId: 'line' });

                                var objLine = journal.selectLine({
                                    sublistId: 'line',
                                    line: 2
                                });
                                //journal.selectNewLineItem('line');
                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'memo',
                                    value: setupDetra.memoDetra
                                });
                                if (monedaID == monedadetraccion) {
                                    objLine.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'account',
                                        value: parseInt(accountOrigen)
                                    });
                                } else {
                                    objLine.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'account',
                                        value: parseInt(accountOrigenDolares)
                                    });
                                }
                                //journal.setCurrentLineItemValue('line', 'account', parseInt(accountOrigen));
                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'credit',
                                    value: amount
                                });
                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'class',
                                    value: clase
                                });
                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'location',
                                    value: location
                                });
                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'entity',
                                    value: vendor
                                });
                                objLine.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'department',
                                    value: department
                                });

                                objLine.commitLine({ sublistId: 'line' });


                                log.debug('vendorBillJournal exp ed', 'init 4 ' + department);
                                idJournal = record.save({
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                });
                                log.debug('JournalCreated', idJournal);
                                break;

                            }
                        }

                    }


                }

                //amount = nlapiLookupField('vendorbill', id, 'total');

            } catch (e) {
                log.error('error editando journal det', e);
            }
            return idJournal;

        }

        const RoundTax = (id, setupDetra) => {
            try {
                var title = 'RoundTax';
                var VendorBill = record.load({
                    type: 'vendorbill',
                    id: id,
                    isDynamic: true,
                });
                var exchangerate = VendorBill.getValue('exchangerate');
                var count = VendorBill.getLineCount({
                    sublistId: 'item'
                });
                let accountOrigenDolares = setupDetra.cuentaOrigenDolar;
                let accountOrigen = setupDetra.cuentaOrigen
                let accountDestino = setupDetra.cuentaDestino
                log.debug(title, 'accountOrigenDolares:: ' + accountOrigenDolares);
                log.debug(title, 'accountDestino:: ' + accountDestino);
                log.debug(title, 'accountOrigen:: ' + accountOrigen);
                log.debug(title, '# num items:: ' + count);

                var JournalLines = []

                for (var i = 1; i <= count; i++) {
                    var journalLine = {};
                    let itemLine = VendorBill.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    log.debug(title, 'init item id ' + itemLine);
                    let articletype = VendorBill.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemtype',
                        line: i
                    });
                    log.debug(title, 'init line type ' + articletype);
                    if (articletype == 'Discount') {
                        let article = record.load({
                            type: 'discountitem',
                            id: itemLine,
                            isDynamic: true,
                        });
                        var accountLine = article.getValue('account');
                        log.debug(title, 'init line discount ' + i);
                        log.debug(title, 'init item account ' + accountLine);
                        if (parseInt(accountLine) == parseInt(accountDestino) || parseInt(accountLine) == parseInt(accountOrigen) || parseInt(accountLine) == parseInt(accountOrigenDolares)) {
                            // var amount = parseInt( Math.round(VendorBill.getLineItemValue('item', 'amount', i)));
                            // log.debug('Redondeo impuesto', 'init' +amount);
                            // VendorBill.setLineItemValue('item', 'amount', i, amount);
                            let lineAmount = parseFloat(VendorBill.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'amout',
                                line: i
                            }));
                            log.debug(title, 'item amount ' + lineAmount);
                            lineAmount = parseFloat(lineAmount) * parseFloat(exchangerate);
                            log.debug(title, 'item amount converted' + lineAmount);
                            let amount = parseInt(Math.round(lineAmount * -1) * -1);
                            let originalAmount = parseFloat(amount)
                            log.debug(title, 'item amount or' + originalAmount);
                            VendorBill.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ks_det_original_amount',
                                line: i,
                                value: parseFloat(originalAmount)
                            });
                            amount = (parseFloat(amount) / parseFloat(exchangerate)).toFixed(2);
                            log.debug(title, 'amount items:: ' + amount);
                            VendorBill.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                line: i,
                                value: amount
                            });
                            VendorBill.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                line: i,
                                value: amount * 1
                            });

                            journalLine.originalAmount = parseFloat(originalAmount);
                            journalLine.newAmountER = parseFloat(amount * exchangerate);
                            journalLine.amountDif = Math.abs(parseFloat(originalAmount)) - Math.abs(parseFloat(amount * exchangerate));
                            journalLine.account = parseInt(accountLine);
                            journalLine.locationId = parseInt(VendorBill.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'location',
                                line: i
                            }));
                            journalLine.classId = parseInt(VendorBill.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'class',
                                line: i
                            }));
                            journalLine.departmentId = parseInt(VendorBill.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'department',
                                line: i
                            }));
                            if (parseFloat(journalLine.amountDif) != 0) {
                                JournalLines.push(journalLine);
                            }
                        }
                    }

                }
                let countExpense = VendorBill.getLineCount({
                    sublistId: 'expense'
                });
                log.debug('generar journal', '# num expenses::' + countExpense);
                var amount = 0;
                for (var i = 1; i <= countExpense; i++) {
                    var journalLine = {};
                    let accountLine = VendorBill.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'account',
                        line: i
                    });
                    log.debug(title, 'init line account:: ' + accountLine);
                    if (parseInt(accountLine) == parseInt(accountDestino) || parseInt(accountLine) == parseInt(accountOrigen) || parseInt(accountLine) == parseInt(accountOrigenDolares)) {
                        // var amount =parseInt( Math.round(VendorBill.getLineItemValue('expense', 'amount', i)));
                        // log.debug('Redondeo impuesto', 'init' +amount);
                        // VendorBill.setLineItemValue('expense', 'amount', i, amount);
                        var lineAmount = parseFloat(VendorBill.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'amount',
                            line: i
                        }));
                        lineAmount = parseFloat(lineAmount) * parseFloat(exchangerate);
                        var amount = parseInt(Math.round(lineAmount));
                        var originalAmount = parseFloat(amount)
                        log.debug(title, 'item amount or' + originalAmount);
                        VendorBill.setSublistValue({
                            sublistId: 'expense',
                            fieldId: 'custcol_ks_det_original_amount',
                            line: i,
                            value: parseFloat(originalAmount)
                        });
                        amount = (parseFloat(amount) / parseFloat(exchangerate)).toFixed(2);
                        log.debug(title, 'amount expenses: ' + amount);
                        VendorBill.setSublistValue({
                            sublistId: 'expense',
                            fieldId: 'amount',
                            line: i,
                            value: amount
                        });

                        var lineWhAmount = parseFloat(VendorBill.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'custcol_4601_witaxamt_exp',
                            line: i
                        }));
                        lineWhAmount = parseFloat(lineWhAmount) * parseFloat(exchangerate);
                        log.debug('Redondeo impuesto', 'init wh' + lineWhAmount);
                        var amountWh = parseInt(Math.round(lineWhAmount * -1) * -1);
                        amountWh = Math.round(parseFloat(amountWh) / parseFloat(exchangerate));
                        log.debug(title, 'init wh2' + amountWh);
                        VendorBill.setSublistValue({
                            sublistId: 'expense',
                            fieldId: 'custcol_4601_witaxamt_exp',
                            line: i,
                            value: amountWh
                        });


                        journalLine.originalAmount = parseFloat(originalAmount);
                        journalLine.newAmountER = parseFloat(amount * exchangerate);
                        journalLine.amountDif = Math.abs(parseFloat(originalAmount)) - Math.abs(parseFloat(amount * exchangerate));
                        journalLine.account = parseInt(accountLine);
                        journalLine.locationId = parseInt(VendorBill.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'location',
                            line: i
                        }));
                        journalLine.classId = parseInt(VendorBill.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'class',
                            line: i
                        }));
                        journalLine.departmentId = parseInt(VendorBill.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'department',
                            line: i
                        }));
                        if (parseFloat(journalLine.amountDif) != 0) {
                            JournalLines.push(journalLine);
                        }
                    }
                }
                let IdVendor = VendorBill.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
                let journalId = adjJournal(id, JournalLines, setupDetra)
                log.debug('adjJournal', 'journal updated/Created ' + journalId);

                log.debug('Redondeo impuesto', 'actualizado' + IdVendor);
                return IdVendor;
            } catch (e) {
                log.error(title, 'Detalles:: ' + e);
            }
        }

        const SETUP = {
            ACCOUNTS: {
                JOURNAL_ADJ: 538,
            },
            STATUS: {
                APPROVED: 2,
                JOURNAL_TYPE_TRM: 5
            }
        }

        const adjJournal = (internalId, JournalLines, setupDetra) => {
            try {
                var title = 'adjJournal'
                log.debug(title, 'JournalLines: ' + JSON.stringify(JournalLines));
                //Createn Adjustment Journal
                if (JournalLines && JournalLines.length > 0 && internalId) {
                    let VendorBill = record.load({
                        type: 'vendorbill',
                        id: internalId,
                        isDynamic: true,
                    });
                    var subsidiary = VendorBill.getValue('subsidiary');
                    var currency = VendorBill.getValue('currency');
                    var memo = VendorBill.getValue('memo');
                    var trandate = VendorBill.getValue('trandate');
                    var entity = VendorBill.getValue('entity');
                    var gClass = VendorBill.getValue('class');
                    var gLocation = VendorBill.getValue('location');
                    var gDepartment = VendorBill.getValue('department');

                    let accountOrigenDolares = setupDetra.cuentaOrigenDolar;
                    let accountOrigen = setupDetra.cuentaOrigen;
                    let accountDestino = setupDetra.cuentaDestino;
                    log.debug(title, 'accountOrigenDollars: ' + accountOrigenDolares);
                    log.debug(title, 'accountDestino: ' + accountDestino);
                    log.debug(title, 'accountOrigen: ' + accountOrigen);

                    let searchDetails = search.create({
                        type: 'journalentry',
                        filters: [
                            search.createFilter({
                                name: 'custbody_ks_pe_factura_vinculada',
                                operator: 'anyof',
                                values: [internalId]
                            }),
                            search.createFilter({
                                name: 'custbody_ks_pe_tipo_journal',
                                operator: 'anyof',
                                values: [setupDetra.tipoAjusteJournal]
                            })
                        ],
                        columns: [
                            search.createColumn({
                                name: 'internalid'
                            })
                        ]
                    })
                    let journalResults = searchDetails.run().getRange(0, 1000);
                    log.debug(title, 'journalResults: ' + JSON.stringify(journalResults));
                    let newJournal = null
                    var mode = 'create';
                    if (!journalResults) {
                        log.debug('New Adj journal', 'init create for transaction: ' + internalId);
                        newJournal = record.create({
                            type: 'journalentry',
                            isDynamic: true
                        });
                        newJournal.setValue('subsidiary', subsidiary);
                    } else {
                        var journalId = journalResults[0].getValue(columns[0]);
                        log.debug('Update Adj journal', 'init Update for transaction: ' + internalId);
                        newJournal = record.load({
                            type: 'journalentry',
                            id: journalId,
                            isDynamic: true,
                        });
                        mode = 'edit'
                    }

                    if (newJournal != null) {
                        log.debug('New Adj journal', 'init... ');
                        // New Journal Entry Body Fields
                        newJournal.setValue('currency', setupDetra.monedaDetra);
                        newJournal.setValue('memo', memo);
                        newJournal.setValue('trandate', trandate);
                        newJournal.setValue('approvalstatus', SETUP.STATUS.APPROVED)
                        newJournal.setValue('custbody_ks_pe_factura_vinculada', internalId);
                        newJournal.setValue('custbody_ks_pe_tipo_journal', setupDetra.tipoAjusteJournal);

                        //New Journal Entry Lines - Accourding to Journal Type (the function can be used again for other type of journal creation if necesary)
                        var totalDifAm = 0;
                        var currentLine = 0;
                        log.debug('New Adj journal', 'Creating Lines... ');
                        for (var jl = 0; jl < JournalLines.length; jl++) {
                            //Journal Entry Line jl - Reverse Accounting Movement of the Original transaction GL
                            currentLine++;
                            var currentJline = JournalLines[jl];

                            if (mode == 'create') {
                                newJournal.selectNewLine({
                                    sublistId: 'line'
                                });
                            } else {
                                newJournal.selectLine({
                                    sublistId: 'line',
                                    line: currentLine
                                });
                            }
                            log.debug(title, 'Creating Line: ' + currentLine);
                            totalDifAm = parseFloat(totalDifAm) + parseFloat(currentJline.amountDif);
                            log.debug(title, 'Creating Line: ' + JSON.stringify(currentJline));
                            newJournal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'account',
                                value: currentJline.account
                            });
                            var lineType = 'debit'
                            if (parseFloat(currentJline.amountDif) > 0) {
                                lineType = 'credit'
                            }
                            log.debug(title, 'lineType: ' + lineType);
                            newJournal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: lineType,
                                value: (currentJline.amountDif).toFixed(2)
                            });
                            newJournal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'memo',
                                value: memo
                            });
                            if (parseInt(entity) > 0 && entity != '' && entity != null) {
                                newJournal.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'entity',
                                    value: entity
                                });
                            }
                            if (parseInt(currentJline.classId) > 0 && currentJline.classId != '' && currentJline.classId != null) {
                                newJournal.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'class',
                                    value: currentJline.classId
                                });
                            }
                            if (parseInt(currentJline.departmentId) > 0 && currentJline.locationId != '' && currentJline.departmentId != null) {
                                newJournal.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'department',
                                    value: currentJline.departmentId
                                });
                            }
                            if (parseInt(currentJline.locationId) > 0 && currentJline.locationId != '' && currentJline.locationId != null) {
                                newJournal.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'location',
                                    value: currentJline.locationId
                                });
                            }
                            newJournal.commitLine({ sublistId: 'line' });

                        }

                        if (totalDifAm != 0) {
                            currentLine++;
                            var lineType = 'credit'
                            if (parseFloat(totalDifAm) > 0) {
                                lineType = 'debit'
                            }
                            log.debug(title, 'lineType: ' + lineType);
                            log.debug(title, 'Journal totalDifAm ' + totalDifAm);
                            if (mode == 'create') {
                                newJournal.selectNewLine({
                                    sublistId: 'line'
                                });
                            } else {
                                newJournal.selectLine({
                                    sublistId: 'line',
                                    line: currentLine
                                });
                            }
                            newJournal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'account',
                                value: SETUP.ACCOUNTS.JOURNAL_ADJ
                            });
                            newJournal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'debit',
                                value: (totalDifAm).toFixed(2)
                            });
                            newJournal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'memo',
                                value: memo
                            });
                            if (parseInt(entity) > 0 && entity != '' && entity != null) {
                                newJournal.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'entity',
                                    value: entity
                                });
                            }
                            if (parseInt(gClass) > 0 && gClass != '' && gClass != null) {
                                newJournal.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'class',
                                    value: gClass
                                });
                                newJournal.setCurrentLineItemValue('line', 'class', gClass);
                            }
                            if (parseInt(gDepartment) > 0 && gDepartment != '' && gDepartment != null) {
                                newJournal.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'department',
                                    value: gDepartment
                                });
                            }
                            if (parseInt(gLocation) > 0 && gLocation != '' && gClass != null) {
                                newJournal.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'location',
                                    value: gLocation
                                });
                                newJournal.setCurrentLineItemValue('line', 'location', gLocation);
                            }
                            newJournal.commitLine({ sublistId: 'line' });
                            log.debug(title, 'Creating Line: ' + currentLine);
                        }
                        var newJounalId = newJournal.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        });
                        log.debug(title, 'Journal Created/Updated: ' + newJounalId);
                        return newJounalId;
                    } else {
                        log.debug(title, 'Error creating/Updating Record');
                        return null
                    }
                } else {
                    log.debug(title, 'Adjustment Journal Not necessary');
                    return null
                }
            } catch (error) {
                log.error(title, error);
            }
        }

        const deleteJournal = (id) => {
            let searchDetails = search.create({
                type: 'journalentry',
                filters: [
                    search.createFilter({
                        name: 'custbody_ks_pe_factura_vinculada',
                        operator: search.Operator.IS,
                        values: id
                    })
                ],
                columns: [
                    search.createColumn({
                        name: 'internalid'
                    })
                ]
            })
            var journalResults = searchDetails.run().getRange(0, 1000);
            if (journalResults) {
                for (const j = 0; j <= journalResults.length; j++) {
                    const journalId = journalResults[j].getValue(columns[0]);
                    log.debug('Journal a actualizar', journalId);
                    record.delete({
                        type: 'journalentry',
                        id: journalId
                    });

                }
            }
        }

        const getSetupDetra = () => {
            const setUpDetra = [];
            var setUpSearch = search.create({
                type: 'customrecord_kis_account_setup_det',
                filters: [
                    search.createFilter({
                        name: 'isinactive',
                        operator: search.Operator.IS,
                        values: false
                    })
                ],
                columns: [
                    search.createColumn({
                        name: 'custrecord_kis_detracciones_origen',
                        label: 'cuentaOrigen'
                    }),
                    search.createColumn({
                        name: 'custrecord_kis_detracciones_destino',
                        label: 'cuentaDestino'
                    }),
                    search.createColumn({
                        name: 'custrecord_kis_detracciones_origen_dol',
                        label: 'cuentaOrigenDolar'
                    }),
                    search.createColumn({
                        name: 'custrecord_kis_detracciones_destino_do',
                        label: 'cuentaDestinoDolar'
                    }),
                    search.createColumn({
                        name: 'custrecord_kis_acount_letras',
                        label: 'cuentaLetras'
                    }),
                    search.createColumn({
                        name: 'custrecord_kis_acount_letras_dolares',
                        label: 'cuentaLetrasDolar'
                    }),
                    search.createColumn({
                        name: 'custrecord_kis_item_letras_dolares',
                        label: 'itemLetrasDolar'
                    }),
                    search.createColumn({
                        name: 'custrecord_kis_item_letras',
                        label: 'itemLetras'
                    }),
                    search.createColumn({
                        name: 'custrecord_kis_moneda_detra',
                        label: 'monedaDetra'
                    }),
                    search.createColumn({
                        name: 'custrecord_kis_pe_memodetraccion',
                        label: 'memoDetra'
                    }),
                    search.createColumn({
                        name: 'custrecord_kis_pe_clasificacioindetra',
                        label: 'tipoAsiento'
                    }),
                    search.createColumn({
                        name: 'custrecord_ks_pe_clasificacioindetra_adj',
                        label: 'tipoAjusteJournal'
                    }),
                ]
            });
            let setupResults = jsonSearch(setUpSearch);
            for (let index = 0; index < 1; index++) {
                const result = setupResults[index];
                setUpDetra.push({
                    'cuentaOrigen': result.cuentaOrigen,
                    'cuentaDestino': result.cuentaDestino,
                    'cuentaOrigenDolar': result.cuentaOrigenDolar,
                    'cuentaDestinoDolar': result.cuentaDestinoDolar,
                    'cuentaLetras': result.cuentaLetras,
                    'cuentaLetrasDolar': result.cuentaLetrasDolar,
                    'itemLetrasDolar': result.itemLetrasDolar,
                    'itemLetras': result.itemLetras,
                    'monedaDetra': result.monedaDetra,
                    'memoDetra': result.memoDetra,
                    'tipoAsiento': result.tipoAsiento,
                    'tipoAjusteJournal': result.tipoAjusteJournal,
                })
            }

            return setUpDetra[0];
        }

        const jsonSearch = (searchDetails, options) => {
            var results = [];
            var method = 'searchToJson';
            if (!options) {
                options = {
                    start: 0,
                    end: 1000
                }
            }
            var searchResults = searchDetails.run().getRange(options);
            if (searchResults && searchResults.length > 0) {
                searchResults.forEach(function(searchResult) {
                    var columns = searchResult.columns;
                    var recId = searchResult.id;
                    var recType = searchResult.type;

                    var thisResult = {};
                    thisResult.internalid = recId;
                    thisResult.type = recType;
                    if (columns) {
                        columns.forEach(function(column) {
                            var column_key = column.label || column.name;
                            thisResult[column_key] = searchResult.getValue(column)
                        })
                    }
                    results.push(thisResult)
                })
            }
            return results
        }
    });