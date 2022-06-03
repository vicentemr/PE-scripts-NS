/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
    'N/query', 'N/record', 'N/search'
    , './ks-co-atw-api'
    , '../../ks-co-functions/ks-co-core'
],

    /**
     * @param{query} query
     * @param{record} record
     * @param{search} search
     */
    (
        query, record, search
        , awtApi
        , core
    ) => {

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            var method = 'KS_AWT_userEvent.afterSubmit';

            try {
                var newRecord = scriptContext.newRecord;

                var strSubsidiary = newRecord.getValue("subsidiary");
                var strCurrency = newRecord.getValue("currency");
                var strTransactionType = newRecord.getValue("ntype");
                var strTotal = newRecord.getValue("total");
                var recId = newRecord.id;
                var recType = newRecord.type;

                var resulConfig = KS_AWT_userEvent.fnGetConfiguration(strSubsidiary, strCurrency, strTransactionType);
                if(resulConfig.length==0){
                    return;
                }
                var fields = KS_AWT_userEvent.fnGetFields(resulConfig);

                if (fields) {
                    var strTypeLanguage = fields.custrecord_ks_atw_language;
                    var strTypeATW = fields.custrecord_ks_atw_type;
                    var strTypePhrase = fields.custrecord_ks_atw_show_type;
                    var strCurrencyPlural = fields.custrecord_ks_display_currency_plural;
                    var strCurrencySingular = fields.custrecord_ks_atw_display_currency_singu;
                    var strCentPlural = fields.custrecord_ks_atw_display_cent_plural;
                    var strCentSingular = fields.custrecord_ks_atw_display_cent_singular;
                    var strOrderPhrase = fields.custrecord_ks_atw_order_phrase;
                    var strAmountField = fields.custrecord_ks_atw_amount;
                    if (strAmountField) {
                        strTotal = newRecord.getValue(strAmountField);
                    }
                    core.log('DEBUG', method, 'strTotal:'+strTotal+' strOrderPhrase: ' + strOrderPhrase + '| strTypeLanguage: ' + strTypeLanguage + ' | strTypeATW: ' + strTypeATW + ' | strTypePhrase' + strTypePhrase + ' |strCurrencyPlural: ' + strCurrencyPlural + ' | strCurrencySingular: ' + strCurrencySingular + ' | strCentPlural: ' + strCentPlural + ' | strCentSingular: ' + strCentSingular);

                    var jsonCustomLanguage = search.lookupFields({
                        type: "customrecord_ks_languaje_for_atw",
                        id: strTypeLanguage,
                        columns: ["name", "custrecord_ks_json_languaje", "custrecord_ks_connector_of_cents"]
                    })
                    strTypeLanguage = jsonCustomLanguage.name;
                    var strConector = jsonCustomLanguage.custrecord_ks_connector_of_cents;

                    awtApi.numberToWords.i18n[jsonCustomLanguage.name] = JSON.parse(jsonCustomLanguage.custrecord_ks_json_languaje);
                
                    var strResult = KS_AWT_userEvent.fnATW(String(strTotal), strTypeLanguage, strTypeATW, strTypePhrase, strCurrencyPlural, strCurrencySingular, strCentPlural, strCentSingular, strConector, strOrderPhrase);
                    core.log('debug',method,'strResult'+strResult)
                    var values = {};
                    values['custbody_ks_amount_to_words'] = strResult;
                    record.submitFields({
                        type: recType,
                        id: recId,
                        values: values,
                        options: {
                            enablesourcing: false,
                        }
                    })
                    core.log('DEBUG', method, "valor en letras: " + strResult);
                }
                else {
                    core.log('DEBUG', method, "No vienen Campos para la configuracion");
                }

            } catch (e) {
                core.log('ERROR', method, e);
            }
        }

        function KS_AWT_userEvent(){}
        KS_AWT_userEvent.fnGetConfiguration = function(strSubsidiary,strCurrency,strTransactionType)
        {
            var method= "KS_AWT_userEvent.fnGetConfiguration";
            try {
                var filters = [];
                filters.push(search.createFilter({
                    name: "custrecord_ks_atw_subsidiaria",
                    join: null,
                    operator: search.Operator.ANYOF,
                    values: strSubsidiary
                }));
                filters.push(search.createFilter({
                    name: "custrecord_ks_atw_currency",
                    join: null,
                    operator: search.Operator.ANYOF,
                    values: strCurrency
                }));
                filters.push(search.createFilter({
                    name: "isinactive",
                    join: null,
                    operator: search.Operator.IS,
                    values: false
                }));
                filters.push(search.createFilter({
                    name: "custrecord_ks_atw_transaction_type",
                    join: null,
                    operator: search.Operator.ANYOF,
                    values: strTransactionType
                }));               
                
                return search.create({
                    type: "customrecord_ks_amount_to_words_config",
                    filters: filters,
                }).run().getRange({
                    start: 0,
                    end: 1
                })
            } catch (e) {
                core.log('ERROR', method, e);
            }
        }
        KS_AWT_userEvent.fnGetFields = function(resulConfig)
        {
            var method = "KS_AWT_userEvent.fnGetFields";
            var result = null;
            try {
                if(resulConfig)
                {
                    var config = {};
                    resulConfig.forEach(function(_element)
                    {
                        var nlapiConfig = record.load({
                            type: "customrecord_ks_amount_to_words_config",
                            id: _element.id
                        })
                        
                        var fields = nlapiConfig.getFields();
                        fields.forEach(function(element)
                        {
                            if(element.indexOf("custrecord_ks") != -1)
                            {
                                config[element] = nlapiConfig.getValue(element);
                                if(element.indexOf("custrecord_ks_atw_transaction_type") != -1)
                                    config[element] = nlapiConfig.getValue(element);
                            }
                        });
                    });
                    
                    result = config;
                }
                else
                {
                    core.log('DEBUG', method, "Subsidiary: "+subsidiary+" con currency :"+strCurrency+" sin configuracion para la transaccion.");
                }
            } catch (e) {
                core.log('ERROR', method, e);
            }
            
            return result;
        }
        KS_AWT_userEvent.fnATW = function(strTotal,strTypeLanguage,strTypeATW,strTypePhrase,strCurrencyPlural,strCurrencySingular,strCentPlural,strCentSingular, strConector, strOrderPhrase) 
        {
            var method = "KS_AWT_userEvent.fnATW";
            if(strConector == null)
            {
                strConector = "";
            }
            var strResult = null;
            try 
            {
                if(strTotal.length >= 0)
                {
                    if (strTotal.indexOf(",") >= 0 || strTotal.indexOf(".") >= 0) 
                    {
                        if(strTotal.indexOf(",") >= 0)
                            strTotal = strTotal.split(",");
                        else if (strTotal.indexOf(".") >= 0)
                            strTotal = strTotal.split(".");
        
                        numPartFirts = KS_AWT_userEvent.fnGetWords(strTotal[0], strTypeLanguage);
                        numPartSecond = KS_AWT_userEvent.fnGetWords(strTotal[1], strTypeLanguage);
        
                        if(strTypeATW == "1")
                        {
                            strCentSingular = "";
                            strCentPlural = "";
                    
                            numPartSecond = strTotal[1]+"/100";
                            /*if(parseInt(strTotal[1]) == 0)
                            {
                                numPartSecond = "";
                                strConector = "";
                            }*/
                        }
        
                        if(strOrderPhrase == 1)
                        {
                            strCentSingular = strCurrencyPlural;
                            strCurrencySingular = '';
                            strCentPlural = strCurrencyPlural;
                            strCurrencyPlural = '';
                        }
                        
                        if(strTotal[0] == "1" & strTotal[1] == "1")
                        {
                            strResult = numPartFirts+" "+strCurrencySingular+" "+strConector+" "+numPartSecond+" "+strCentSingular;
                        }
                        else if(strTotal[0] == "1")
                        {
                            strResult = numPartFirts+" "+strCurrencySingular+" "+strConector+" "+numPartSecond+" "+strCentPlural;	
                        }
                        else if(strTotal[1] == "1")
                        {
                            strResult = numPartFirts+" "+strCurrencyPlural+" "+strConector+" "+numPartSecond+" "+strCentSingular;	
                        }
                        else
                        {
                            strResult = numPartFirts+" "+strCurrencyPlural+" "+strConector+" "+numPartSecond+" "+strCentPlural;		
                        }
                    }
                    else 
                    { 
                        core.log('debug',method,'entra a sin decimales')
                        numPartFirts = KS_AWT_userEvent.fnGetWords(strTotal, strTypeLanguage);
                        
                        if(strTotal == "1")
                        {
                            strResult = numPartFirts+" "+strCurrencySingular;
                        }
                        else 
                        {
                            strResult = numPartFirts+" "+strCurrencyPlural;
                        }
                    }	
                    
                    switch(strTypePhrase)
                    {
                        case "1":
                            strResult = KS_AWT_userEvent.fnUpperCase(strResult);
                            break;
                        case "2":
                            strResult = KS_AWT_userEvent.fnFirstCapitalLetter(strResult);
                            break;
                        case "3":
                            strResult = KS_AWT_userEvent.fnFirstCapitalLetterInSentence(strResult);
                            break;
                    }			
                }
            }
            catch (e) 
            {
                core.log('ERROR', method, e);
            }
            
            return strResult;
        }
        KS_AWT_userEvent.fnFirstCapitalLetter = function (phrase) 
        {
            var result = null;
            var method = "KS_AWT_userEvent.fnFirstCapitalLetter";
            try {
                result = phrase.charAt(0).toUpperCase() + phrase.slice(1);
            } catch (e) {
                core.log('ERROR', method, e);
            }
            return result;
        }
        KS_AWT_userEvent.fnUpperCase = function (phrase) 
        {
            var result = null;
            var method = "KS_AWT_userEvent.fnUpperCase";
            try {
                result = phrase.toUpperCase();
            } catch (e) {
                core.log('ERROR', method, e);
            }
            return result;
        }
        KS_AWT_userEvent.fnFirstCapitalLetterInSentence = function (phrase) 
        {
            
            var result = ""; 
            var method = "KS_AWT_userEvent.fnFirstCapitalLetterInSentence ";
            try 
            {
                phrase = phrase.split(" ");
                phrase.forEach(
                    function(element)
                    {
                        result += KS_AWT_userEvent.fnFirstCapitalLetter(element)+" ";
                    });
            } catch (e) {
                core.log('ERROR', method, e);
            }
            return result;
        }
        KS_AWT_userEvent.fnGetWords = function(strNum, strLanguage)
        {
            var method = "KS_AWT_userEvent.fnGetWords";
            var result = null;
            try {
                result = awtApi.numberToWords.convert(strNum, {lang: strLanguage});
            } catch (e) {
                core.log('ERROR', method, e);
            }
            return result;
        }

        return { afterSubmit }

    });
