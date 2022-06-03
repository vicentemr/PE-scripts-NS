/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],
    function() {
        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            customerVendorFieldVal(scriptContext, true)
        }
        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {
            return validateKsDocument(scriptContext);
        }

        function localizationContextEnter(scriptContext) {
            customerVendorFieldVal(scriptContext);
            employeFieldVal(scriptContext)
        }

        function employeFieldVal(scriptContext) {
            let _currentRecord = scriptContext.currentRecord;
            let recType = _currentRecord.type;
            if (recType == 'employee') {
                showPersonLocalFields(scriptContext);
            }
        }

        function customerVendorFieldVal(scriptContext, fromFieldChange) {
            let _currentRecord = scriptContext.currentRecord;
            let recType = _currentRecord.type;
            let entiiesTypeToProcess = ['customer', 'vendor'];
            if (entiiesTypeToProcess.indexOf(recType) > -1) {
                if (((scriptContext.fieldId == 'isperson' || scriptContext.fieldId == 'subsidiary') && fromFieldChange) || !fromFieldChange) {
                    let isperson = _currentRecord.getValue({
                        fieldId: 'isperson'
                    });
                    if (isperson == 'T') { showPersonLocalFields(scriptContext) } else { showCompanyLocalFields(scriptContext) }
                }
            }
        }
        let companyFields = ['custentity_ks_nombre_comercial'];
        let personFields = [];

        function showPersonLocalFields(scriptContext) {
            let method = 'showPersonLocalFields';
            let _currentRecord = scriptContext.currentRecord;
            for (let index = 0; index < personFields.length; index++) {
                const field = personFields[index];
                var fieldObj = _currentRecord.getField({
                    fieldId: field
                });
                fieldObj.isDisplay = true;
            }
            for (let index = 0; index < companyFields.length; index++) {
                const field = companyFields[index];
                var fieldObj = _currentRecord.getField({
                    fieldId: field
                });
                fieldObj.isDisplay = false;
                _currentRecord.setValue({
                    fieldId: field,
                    value: ''
                })
            }
        }

        function showCompanyLocalFields(scriptContext) {
            let method = 'showCompanyLocalFields';
            let _currentRecord = scriptContext.currentRecord;
            for (let index = 0; index < companyFields.length; index++) {
                const field = companyFields[index];
                var fieldObj = _currentRecord.getField({
                    fieldId: field
                });
                fieldObj.isDisplay = true;
            }
            for (let index = 0; index < personFields.length; index++) {
                const field = personFields[index];
                var fieldObj = _currentRecord.getField({
                    fieldId: field
                });
                fieldObj.isDisplay = false;
                _currentRecord.setValue({
                    fieldId: field,
                    value: ''
                })
            }
        }

        function validateKsDocument(scriptContext) {
            let method = 'validateKsDocument';
            let result = true;
            let _currentRecord = scriptContext.currentRecord;
            let docType = _currentRecord.getValue({
                fieldId: 'custentity_ks_tipo_doc_identidad'
            });
            let ks_document = _currentRecord.getValue({
                fieldId: 'custentity_ks_documento'
            });

            if (docType == '2' || docType == '3' || docType == '4') { //Si es DNI o Carnet extranjería o RUC
                var regNumber = /[^0-9]/g;
                if (!regNumber.test(ks_document)) {
                    if (docType == '2') { //Si es DNI
                        var valid = lengthValidation(ks_document, 8);
                        if (!valid) {
                            alert('El número de DNI debe contener 8 dígitos.');
                            result = false;
                        }
                    }
                    if (docType == '4') { //Si es RUC
                        var valid = lengthValidation(ks_document, 11);
                        if (!valid) {
                            alert('El número de RUC debe contener 11 dígitos.');
                            result = false;
                        }
                    }
                } else {
                    alert('El numero de documento para DNI, RUC o Carnet de extranjería debe contener solo números.')
                    result = false;
                }
            }
            return result;
        }

        function lengthValidation(docNumber, limit) {
            if (docNumber.length == limit) {
                return true;
            } else return false;
        }

        return {
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            localizationContextEnter: localizationContextEnter
        };

    });