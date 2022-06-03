/**
 * @NApiVersion 2.1
 */
define(['N/search', 'N/log'],

    (search, _log) => {
        const Setup = {};
        const getSetup = () => {
            let method = 'getSetup';
            if (Object.keys(Setup).length == 0) {
                var setUpSearch = search.create({
                    type: 'customrecord_ks_pe_localization_setup',
                    filters: [
                        search.createFilter({
                            name: 'isinactive',
                            operator: search.Operator.IS,
                            values: false
                        })
                    ],
                    columns: [
                        search.createColumn({
                            name: 'custrecord_ks_pe_loc_subsidiaries',
                            label: 'subsidiaraies'
                        }),
                        search.createColumn({
                            name: 'custrecord_ks_pe_modules',
                            label: 'modules'
                        })
                    ]
                });
                let setupResults = jsonSearch(setUpSearch);
                for (let index = 0; index < setupResults.length; index++) {
                    const result = setupResults[index];
                    let subsidiaraies = result['subsidiaraies'].split(',');
                    for (let i = 0; i < subsidiaraies.length; i++) {
                        Setup[subsidiaraies[i]] = result.modules;
                    }
                }
            }
            return Setup;
        }
        const log = (type, method, details) => {
            _log[String(type).toLowerCase()]({
                title: method,
                details: details
            })
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
        const transactionLineTypes = ['line', 'item', 'expense'];

        return { getSetup, log, jsonSearch, transactionLineTypes }

    });