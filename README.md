*[last update: 2015-08-29]*

# Decimal JS

Decimal is a small library that makes easy and safe to work with decimal values in Javascript. Since the `float` type is focused on represent high order numbers, it's a better fit for scientific operations and not monetary/precise ones. The problem is that `float` is the only datatype javascript has natively to work with fractional numbers. And that makes any operation involving decimal, like currency, unreliable.

### 1. Features
- can convert the base js types to decimal
- allows arithmetical operations
- allows string formatting
- can safely be converted back to number

### 2. Basic Interface
To convert a JS value to Decimal, you can just wrap it with the `Decimal` function. Or, use the `Decimal.parse` if you want a more idiomatic approach.
```js
    fromFloat = Decimal(12.30);
    fromString = Decimal('1234.34');
    fromInt = Decimal.parse(12);
```
It's possible to convert a lot of different string formats to decimal by using the configuration options.
```js
    var x = new Decimal('U$ 10,234.89', {
        prefix: 'U$ ',
        thousandsSeparator: ',',
        decimalSeparator: '.'
    });
    
    console.log(x.toJSON()); //10234.89
```

### 3. Arithmetic Operations
All arithmetic operations are decimal methods and can be used by method names or string symbols. Whichever is closer to your project standards.
```js
    var x = Decimal.parse(0.1);
    x.addWith(0.2);

    console.log(x.toJSON()); //0.3

    x['+='](0.4);

    console.log(x.toJSON()); //0.7
```

The simple arithmetic methods will instantiate a new Decimal containing the result. The `With`|`'='` suffixed methods will change the instance used to call the operation. Supported operations are:
```js
    //[addition]
    x.add(y); //creates a new Decimal instace with the result
    x.addWith(y); //x will contain the result
    //aliases
    x['+'](y);
    x['+='](y);
    
    //[subtraction]
    x.sub(y);
    x.subWith(y);
    //aliases
    x['-'](y);
    x['-='](y);
    
    //[multiplication]
    x.mul(y);
    x.mulWith(y);
    //aliases
    x['*'](y);
    x['*='](y);
```

### 4. Comparison
To compare Decimal values instead of object instances, the method `.compare(op, value)` is provided. It can be called passing in the operator as the first parameter and the decimal to compare as the second. The supported operators are: equality `==`, inequality `!=`, greater than `>`, greater or equal `>=`, less than `<`, and less or equal `<=`. There are shorthands for every comparison in the same way arithmetic operations have.
```js
    x['=='](y); //x.compare('==', y);
    x['!='](y); //x.compare('!=', y);
    x['>'](y);  //x.compare('>', y);
    x['>='](y); //x.compare('>=', y);
    x['<'](y);  //x.compare('<', y);
    x['<='](y); //x.compare('<=', y);
```

### 5. Formatting Options

To format a Decimal instance to string, you can set a default configuration format (that will also be used when converting strings to decimal), or you can invoke `.toString` explicitily and pass in a configuration object. The options are:
- `prefix`: string to concatenate before the value, like a currency sign
- `thousandsSeparator`: if set, will be used to separate thousands
- `decimalSeparator`: the char to separate the integer part and decimal part
- `decimalPlaces`: how many numbers will be used when printing the value. If this is undefined, then the formatting function will print every significant decimal places.
- `suffix`: string to cancatenate after the value, like a unit measure

```js
    var d = Decimal(1652238.8, {
        prefix: '€ ',
        thousandsSeparator: '.',
        decimalPlaces: 2,
        decimalSeparator: ','
    });
    
    console.log('Total: ' + d);
    //Total: € 1.652.238,80
```

##### Multilanguage and Locale Integration

You can work with multilanguage by setting the defaults of conversion in the base `Decimal` object. The following example shows how to configure the values and the default library values for each property.
```js
    Decimal.prefix = '';
    Decimal.thousandsSeparator = '';
    Decimal.decimalSeparator = '.';
    Decimal.decimalPlaces = undefined;
    Decimal.suffix = '';
    
    //or setting every property at once, so you can map an object to the locale
    Deimal.defaults(config);
```


### 6. Using with JSON
It's common to use the number notation to exchange data instead of working with strings, since a lot of automatic server side conversions will infer the correct type by the JSON property type. The function `.toJSON` converts the `Decimal` to float with no precision loss.
