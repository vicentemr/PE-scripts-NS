/**
 * @NApiVersion 2.1
 */
define([],

    () => {

        function numberToWords() { };
        (function () {
            /**
             * Converts numbers to their written form.
             *
             * @param {Number} n The number to convert
             * @param {Object} [options] An object representation of the options
             * @return {String} writtenN The written form of `n`
             */
            numberToWords.defaults = {
                noAnd: false,
                lang: "en"
            };
            numberToWords.convert = function (n, options) {
                if (!options)
                    return

                n = Math.round(+n);

                var language = typeof options.lang === 'string'
                    ? this.i18n[options.lang]
                    : options.lang;
                var scale = language.useLongScale ? this.longScale : this.shortScale;
                var unit;

                if (!language) {
                    if (languages.indexOf(this.defaults.lang) < 0) {
                        this.defaults.lang = 'en';
                    }
                    language = this.i18n[this.defaults.lang];
                }

                var baseCardinals = language.base;

                if (language.unitExceptions[n]) return language.unitExceptions[n];
                if (baseCardinals[n]) return baseCardinals[n];
                if (n < 100) return this.handleSmallerThan100(n, language, unit, baseCardinals, options);

                var m = n % 100;
                var ret = [];
                if (m) {
                    if (options.noAnd && !(language.andException && language.andException[10])) {
                        ret.push(this.convert(m, options));
                    } else {
                        ret.push(language.unitSeparator + this.convert(m, options));
                    }
                    n -= m;
                } else ret = [];

                for (var i = 0, len = language.units.length; i < len; i++) {
                    var r = Math.floor(n / scale[i]);
                    if (i === 0) {
                        r %= 10;
                    } else if (!language.useLongScale || (i === 1 && language.useLongScale)) {
                        r %= 1000;
                    } else r %= 1000000;

                    unit = language.units[i];
                    if (r && unit.useBaseInstead) {
                        if (unit.useBaseException.indexOf(r) < 0) {
                            ret.push(baseCardinals[r * scale[i]]);
                        }
                        else {
                            ret.push(r > 1 && unit.plural ? unit.plural : unit.singular);
                        }
                    }
                    else if (r) {
                        var str;
                        if (typeof unit === 'string') {
                            str = unit;
                        }
                        else {
                            str = r > 1 && unit.plural && (!unit.avoidInNumberPlural || !m) ? unit.plural : unit.singular;
                        }
                        if (unit.avoidPrefixException && unit.avoidPrefixException.indexOf(r) > -1) {
                            ret.push(str);
                        }
                        else {
                            var exception = language.unitExceptions[r];
                            var number = exception || this.convert(r, options);
                            ret.push(number + ' ' + str);
                        }
                    }

                }
                return ret.reverse().join(' ');
            };
            numberToWords.util = function (target, defs) {
                if (target == null) target = {};
                var ret = {};
                var keys = Object.keys(defs);
                for (var i = 0, len = keys.length; i < len; i++) {
                    var key = keys[i];
                    ret[key] = target[key] || defs[key];
                }
                return ret;
            }
            numberToWords.handleSmallerThan100 = function (n, language, unit, baseCardinals, options) {
                var dec = Math.floor(n / 10) * 10;
                unit = n - dec;
                if (unit) {
                    return baseCardinals[dec] + language.baseSeparator + this.convert(unit, options);
                }
                return baseCardinals[dec];
            }

            numberToWords.shortScale = [100];
            for (var i = 1; i <= 16; i++) {
                numberToWords.shortScale.push(Math.pow(10, i * 3));
            }

            numberToWords.longScale = [100, 1000];
            for (i = 1; i <= 15; i++) {
                numberToWords.longScale.push(Math.pow(10, i * 6));
            }
            /**
             * Configuración de los idiomas
             */
            numberToWords.i18n = {};
        })();

        return { numberToWords }

    });
