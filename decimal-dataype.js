/**
 *      Decimal can operate and format decimal values without loosing precision like a float.
 *      convertions on instantiation:
 *          string: parsed as a decimal
 *          integer: the decimal part will be 0
 *          float: use the float part as the decimal part
 *          bool: convert to integer and parse
 *
 *      config opts:
 *          - prefix: string to concatenate before the value, like a currency sign
 *          - thousandsSeparator: if set, will be used to separate thousands
 *          - decimalSeparator: the char to separate the integer part and decimal part
 *          - decimalPlaces: how many numbers will be used when printing the value
 *          - suffix: string to cancatenate after the value, like a unit measure
 *
 *      TODO:
 *          remove prefix and suffix when creating a decimal instance from string
 */
(function () {
    "use strict";

    var env = this,
        Decimal, _partial, _slice, 
        defaults = {
            prefix: '',
            thousandsSeparator: undefined,
            decimalSeparator: '.',
            decimalPlaces: undefined,
            suffix: ''
        };

    _slice = Array.prototype.slice;
    //will only bind the arguments leaving the this dynamic
    _partial = function (fn) {
        var args;

        if (arguments.length <= 1) return fn;
        
        args = _slice.call(arguments, 1);

        return function () {
            return fn.apply(this,
                args.concat(
                    _slice(arguments, 0)
                )
            );
        };
    };

    //decimalPlaces not setted means the decimal places of this decimal number can vary over time
    env.Decimal = Decimal = function (val, config) {
        //if was invoked without the new will act as a conversor instead of a constructor
        if (!(this instanceof Decimal)) {
            //will not create a copy of decimal if the new was not explicity used
            if (val instanceof Decimal) {
                return val;
            }

            return new Decimal(val, config);
        }

        //if val is Decimal, than it will be used to config if no config is setted
        config || (config = (val instanceof Decimal) ? val : {});

        //dafaults configurations
        this.prefix = config.prefix || Decimal.prefix;
        this.thousandsSeparator = config.thousandsSeparator || Decimal.thousandsSeparator;
        this.decimalSeparator = config.decimalSeparator || Decimal.decimalSeparator;
        this.decimalPlaces = config.decimalPlaces || Decimal.decimalPlaces;
        this.suffix = config.suffix || Decimal.suffix;

        this.set(val);
    };

    //Global configuration
    //thousandsSeparator and decimalPlaces are intentionally not set
    Decimal.prefix = defaults.prefix;
    Decimal.thousandsSeparator = defaults.thousandsSeparator;
    Decimal.decimalSeparator = defaults.decimalSeparator;
    Decimal.decimalPlaces = defaults.decimalPlaces;   
    Decimal.suffix = defaults.suffix;

    //if no config is passed, then it will be reset the defaults
    Decimal.defaults = function (config) {
        config || (config = defaults)
        this.prefix = config.prefix || defaults.prefix;
        this.thousandsSeparator = config.thousandsSeparator || defaults.thousandsSeparator;
        this.decimalSeparator = config.decimalSeparator || defaults.decimalSeparator;
        this.decimalPlaces = config.decimalPlaces || defaults.decimalPlaces;
        this.suffix = config.suffix || defaults.suffix;
    };

    //public as a Decimal property if is necessary any fine tuning on those
    Decimal.floatSeparator = '.';
    Decimal.regexThousandsSeparator = /\B(?=(\d{3})+(?!\d))/g;
    Decimal.regexTrimDecimalZeros = /[0]+$/;

    Decimal.prototype = {
        set: function (val) {
            var type, pieces,
                trimDecimalZeros = Decimal.regexTrimDecimalZeros;

            if (!val) {
                this._integer = 0;
                this._tenthPow = 0;
                return;
            }

            if ((val instanceof Decimal)
             || (typeof val === 'object')) {
                this._integer = val._integer;
                this._tenthPow = val._tenthPow;
                return;
            }

            if (typeof val === 'boolean') {
                val = (val + 0).toString();
            }

            if (typeof val === 'number') {
                val = val.toString().replace(Decimal.floatSeparator, this.decimalSeparator);
            }

            pieces = val.split(this.decimalSeparator); 

            if ((pieces.length > 2) || ((val.split(this.thousandsSeparator).length > 1))) {
                throw new Error("The value (" + val + ") is malformed");
            }

            pieces[1] = (pieces[1] || '')
                            .toString()
                            .replace(trimDecimalZeros, '');
            
            if (window.parseInt(pieces[0].toString(), 10).toString() !== pieces[0].toString()) {
                throw new Error("The value (" + val + ") is malformed");
            }

            this._integer = +(pieces[0].toString() + pieces[1].toString());
            this._tenthPow = pieces[1].length;

            if (isNaN(this._integer)) {
                throw new Error("The value (" + val + ") is malformed");
            }
        },
        
        //math operations
        addWith: function (number) {
            var resultDecimal = this._sum(number);

            this._integer = resultDecimal._integer;
            this._tenthPow = resultDecimal._tenthPow;

            return this;
        },

        add: function (number) {
            resultDecimal = this._sum(number);

            return new Decimal(resultDecimal, this);
        },

        subWith: function (number) {
            var resultDecimal = this._subtraction(number);

            this._integer = resultDecimal._integer;
            this._tenthPow = resultDecimal._tenthPow;

            return this;
        },

        sub: function (number) {
            var resultDecimal = this._subtraction(number);

            return new Decimal(resultDecimal, this);
        },

        mulWith: function (number) {
            //converting
            number = Decimal(number);

            this._integer *= number._integer;
            this._tenthPow *= number._tenthPow;
            
            return this;
        },

        mul: function (number) {
            //copying the decimal
            var baseNumber = new Decimal(this);

            return this.mulWith(number);
        },

        compare: function (op, number) {
            number = Decimal(number);

            switch (op) {
                case '==':
                    return ((this._integer === number._integer)
                        && (this._tenthPow === number._tenthPow));
                    break;

                case '!=':
                   return ((this._integer !== number._integer)
                        || (this._tenthPow !== number._tenthPow));
                    break;

                case '>':
                    return this._toFloat() > number._toFloat();
                    break;

                case '>=':
                    return this._toFloat() >= number._toFloat();
                    break;

                case '<':
                    return this._toFloat() < number._toFloat();
                    break;

                case '<=':
                    return this._toFloat() <= number._toFloat();
                    break;
            }

            return false;
        },

        getIntegerPart: function (thousandsSeparator) {
            var integer;

            integer = Math.abs(this._integer);

            integer = (this._tenthPow === 0) ? 
                integer.toString()
                : integer.toString().slice(0, -this._tenthPow) || '0';

            if (this._integer < 0) integer = '-' + integer;

            if (!thousandsSeparator) return integer;

            return integer.replace(Decimal.regexThousandsSeparator, thousandsSeparator);
        },

        getFractionalPart: function (decimalPlaces) {
            var fraction,
                placesAdjustment,
                integer,
                trimDecimalZeros = Decimal.regexTrimDecimalZeros;

            integer = Math.abs(this._integer);

            if (decimalPlaces <= 0) return '';

            fraction = (this._tenthPow === 0) ? '0' : integer.toString().slice(-this._tenthPow);

            fraction = fraction.replace(trimDecimalZeros, '');

            fraction = (new Array(this._tenthPow - fraction.length + 1).join('0')) + fraction;

            fraction = fraction.replace(trimDecimalZeros, '');
            
            if (!fraction) return new Array((decimalPlaces || 0) + 1).join('0');

            if (decimalPlaces == null) return fraction;

            placesAdjustment = decimalPlaces - fraction.length;
            
            fractional = Math.round(fraction * Math.pow(10, placesAdjustment));

            return fractional.toString().slice(-decimalPlaces);
        },

        toString: function (config) {
            var number,
                parts,
                thousandsSeparator,
                decimalPlaces;

            config || (config = {});
            thousandsSeparator = (config.thousandsSeparator !== undefined) ? config.thousandsSeparator : this.thousandsSeparator;
            decimalPlaces = (config.decimalPlaces !== undefined) ? config.decimalPlaces : this.decimalPlaces;

            number = this._toFloat();

            if (typeof decimalPlaces === 'number') number = number.toFixed(decimalPlaces);

            parts = number.toString().split(Decimal.floatSeparator);

            if (thousandsSeparator) parts[0] = parts[0].replace(Decimal.regexThousandsSeparator, thousandsSeparator);

            return (config.prefix || this.prefix)
                + parts.join(config.decimalSeparator || this.decimalSeparator)
                + (config.suffix || this.suffix);
        },

        //inner methods
        _sum: function (number) {
            var resultDecimal, integer;

            //convert to decimal if it is not one already
            number = Decimal(number, this);

            return this._addDecimals(this, number);
        },

        _subtraction: function (number) {
            //copy to negativate the integer part with no side-effects
            var operand = new Decimal(number, this);
            operand._integer *= -1;

            return this._sum(operand);
        },

        _addDecimals: function (decimalA, decimalB) {
            var result,
                a, b,
                diffPow;

            a = { i: decimalA._integer, p: decimalA._tenthPow };
            b = { i: decimalB._integer, p: decimalB._tenthPow };

            diffPow = Math.abs(a.p - b.p);

            if (a.p > b.p) {
                b.i *= Math.pow(10, diffPow);
            } else {
                a.i *= Math.pow(10, diffPow);
            }

            result = a.i + b.i;

            return {
                _integer: result,
                _tenthPow: Math.max(a.p, b.p)
            };
        },

        _toFloat: function () {
            return this._integer / Math.pow(10, this._tenthPow);
        }
    };

    //shorthand methods
    Decimal.prototype.toJSON  = Decimal.prototype._toFloat;
    Decimal.prototype['+'] = Decimal.prototype.add;
    Decimal.prototype['+='] = Decimal.prototype.addWith;
    Decimal.prototype['-'] = Decimal.prototype.sub;
    Decimal.prototype['-='] = Decimal.prototype.subWith
    Decimal.prototype['*'] = Decimal.prototype.mul;
    Decimal.prototype['*='] = Decimal.prototype.mulWith;
    Decimal.prototype['/'] = Decimal.prototype.div;
    Decimal.prototype['=='] = _partial(Decimal.prototype.compare, '==');
    Decimal.prototype['!='] = _partial(Decimal.prototype.compare, '!=');
    Decimal.prototype['>'] = _partial(Decimal.prototype.compare, '>');
    Decimal.prototype['>='] = _partial(Decimal.prototype.compare, '>=');
    Decimal.prototype['<'] = _partial(Decimal.prototype.compare, '<');
    Decimal.prototype['<='] = _partial(Decimal.prototype.compare, '<=');

    //static methods
    Decimal.parse = Decimal;
    Decimal.format = function (val, config) {
        return Decimal(val).toString(config);
    };

    Decimal.isValid = function (val, config) {
        try {
            Decimal(val, config);
        } catch (e) {
            return false;
        }

        return true;
    };
}.call(this));