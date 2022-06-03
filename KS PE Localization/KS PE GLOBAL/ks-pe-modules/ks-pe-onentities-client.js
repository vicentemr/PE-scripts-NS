/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],
    function () {
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
            customerVendorFieldVal(scriptContext,true)
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

        function localizationContextEnter(scriptContext){
            customerVendorFieldVal(scriptContext);
            employeFieldVal(scriptContext)
        }
        function employeFieldVal(scriptContext){
            let _currentRecord = scriptContext.currentRecord;
            let recType = _currentRecord.type;
            if(recType=='employee'){
                showPersonLocalFields(scriptContext);
            }
        }
        function customerVendorFieldVal(scriptContext,fromFieldChange){
            let _currentRecord = scriptContext.currentRecord;
            let recType = _currentRecord.type;
            let entiiesTypeToProcess = ['customer','vendor'];
            if(entiiesTypeToProcess.indexOf(recType)>-1){
                if(((scriptContext.fieldId=='isperson' || scriptContext.fieldId=='subsidiary') && fromFieldChange) || !fromFieldChange){
                    let isperson = _currentRecord.getValue({
                        fieldId:'isperson'
                    });
                    if(isperson=='T'){ showPersonLocalFields(scriptContext) } else { showCompanyLocalFields(scriptContext)}
                }
            }
        }
        let companyFields = ['custentity_ks_nombre_comercial'];
        let personFields = ['custentity_ks_primer_nombre','custentity_ks_segundo_nombre','custentity_ks_primer_apellido','custentity_ks_segundo_apellido'];
        function showPersonLocalFields(scriptContext){
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
        function showCompanyLocalFields(scriptContext){
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
        function validateKsDocument(scriptContext){
            let method = 'validateKsDocument';
            let result = true;
            let _currentRecord = scriptContext.currentRecord;
            let docType = _currentRecord.getValue({
                fieldId: 'custentity_ks_tipo_doc_identidad'
            });
            let digitoVerificacion = _currentRecord.getValue({
                fieldId: 'custentity_ks_digitoverificacion'
            });
            let ks_document = _currentRecord.getValue({
                fieldId: 'custentity_ks_documento'
            });
            
            if(docType=='10' || docType=='7'){//Si es NIT o Cedula
                var regNumber = /[^0-9]/g;
                if (!regNumber.test(ks_document)) {
                    if(docType=='10'){//Si es NIT
                        var digitoDeVerificacionCalculado = calcularDigitoVerificacion(ks_document);
                        if(String(digitoDeVerificacionCalculado)!=digitoVerificacion){
                            alert('El digito de verificación es incorrecto.');
                            result = false;
                        }
                    }
                }else{
                    alert('El numero de documento para cedula de ciudadanía o NIT debe contener solo números.')
                    result = false;
                }
            }
            return result;
        }
        function  calcularDigitoVerificacion(ks_document){
            var vpri,x,y,z;
            // Procedimiento
            vpri = new Array(16) ; 
            z = ks_document.length ;
            vpri[1]  =  3 ;
            vpri[2]  =  7 ;
            vpri[3]  = 13 ; 
            vpri[4]  = 17 ;
            vpri[5]  = 19 ;
            vpri[6]  = 23 ;
            vpri[7]  = 29 ;
            vpri[8]  = 37 ;
            vpri[9]  = 41 ;
            vpri[10] = 43 ;
            vpri[11] = 47 ;  
            vpri[12] = 53 ;  
            vpri[13] = 59 ; 
            vpri[14] = 67 ; 
            vpri[15] = 71 ;
            x = 0 ;
            y = 0 ;
            for  ( var i = 0; i < z; i++ )  { 
              y = ( ks_document.substr (i, 1 ) ) ;
              x += ( y * vpri [z-i] ) ;
            }
            y = x % 11 ;
            return ( y > 1 ) ? 11 - y : y ;
        }

        return {
            fieldChanged: fieldChanged,
            saveRecord:saveRecord,
            localizationContextEnter:localizationContextEnter
        };

    });
