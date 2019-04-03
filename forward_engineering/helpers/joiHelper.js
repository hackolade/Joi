const ts = require("typescript");

function generateObjectProperty(propList) {
    let valueExpression = ts.createCall(
        ts.createPropertyAccess(
            ts.createCall(
                ts.createPropertyAccess(
                    ts.createIdentifier('Joi'),
                    ts.createIdentifier('object')
                ),
                undefined,
                []
            ),
            ts.createIdentifier('keys')
        ),
        undefined,
        [
            ts.createObjectLiteral(
                propList,
                true
            )
        ]
    );

    return valueExpression;
}

function generateDateProperty() {
    let valueExpression = ts.createCall(
        ts.createPropertyAccess(
            ts.createIdentifier('Joi'),
            ts.createIdentifier('date')
        ),
        undefined,
        []
    );

    return valueExpression;
}

function generateBoolProperty() {
    let valueExpression = ts.createCall(
        ts.createPropertyAccess(
            ts.createIdentifier('Joi'),
            ts.createIdentifier('bool')
        ),
        undefined,
        []
    );

    return valueExpression;
}

function generateStringProperty() {
    let valueExpression = ts.createCall(
        ts.createPropertyAccess(
            ts.createIdentifier('Joi'),
            ts.createIdentifier('string')
        ),
        undefined,
        []
    );

    return valueExpression;
}

function generateNumberProperty() {
    let valueExpression = ts.createCall(
        ts.createPropertyAccess(
            ts.createIdentifier('Joi'),
            ts.createIdentifier('number')
        ),
        undefined,
        []
    );

    return valueExpression;
}

function generateArrayProperty(propList) {
    let valueExpression =
        ts.createCall(
            ts.createPropertyAccess(
                ts.createCall(
                    ts.createPropertyAccess(
                        ts.createIdentifier('Joi'),
                        ts.createIdentifier('array')
                    ),
                    undefined,
                    []
                ),
                ts.createIdentifier('items')
            ),
            undefined,
            propList
        );

    return valueExpression;
}

//wrap required
function required(expression) {
    return ts.createCall(ts.createPropertyAccess(expression, ts.createIdentifier('required')), undefined, []);
}

function optional(expression) {
    return ts.createCall(ts.createPropertyAccess(expression, ts.createIdentifier('optional')), undefined, []);
}

function allowNull(expression) {
    return ts.createCall(ts.createPropertyAccess(expression, ts.createIdentifier('allow')), undefined, [ts.createNull()]);
}

function stringMinLength(expression, minLength) {
    return ts.createCall(ts.createPropertyAccess(expression, ts.createIdentifier('min')), undefined, [ts.createNumericLiteral(minLength.toString())]);
}

function stringMaxLength(expression, maxLength) {
    return ts.createCall(ts.createPropertyAccess(expression, ts.createIdentifier('max')), undefined, [ts.createNumericLiteral(maxLength.toString())]);
}

function stringLength(expression, length) {
    return ts.createCall(ts.createPropertyAccess(expression, ts.createIdentifier('length')), undefined, [ts.createNumericLiteral(length.toString())]);
}



function generateExpression(value, modelDefinitions) {
    var expression;

    // if its a reference type
    if(value['$ref']){
        let model = value['$ref'].replace("#model/definitions/", "");
        let modelValue = modelDefinitions.properties[model];
        return generateExpression(modelValue, modelDefinitions);
    }

    if (value.type === "string") {
        expression = generateStringProperty();
        if (value.length) {
            expression = stringLength(expression, value.length);
        }
        if (value.minLength) {
            expression = stringMinLength(expression, value.minLength);
        }
        if (value.maxLength) {
            expression = stringMaxLength(expression, value.maxLength);
        }
    }
    else if (value.type === "numeric" || value.type === "number") {
        expression = generateNumberProperty();
    }
    else if (value.type === "bool") {
        expression = generateBoolProperty();
    }
    else if (value.type === "date") {
        expression = generateDateProperty();
    }
    else if (value.type === "object" || value.type === "document") {
        expression = generateObjectProperty(generateJoiTypes(value, modelDefinitions));
    }
    else if (value.type === "array") {
        expression = generateArrayProperty(generateJoiTypes(value, modelDefinitions));
    }

    if (value.optional) {
        expression = optional(allowNull(expression));
    }


    return expression;
}

function generateJoiTypes(jsonSchema, modelDefinitions) {
    var propList = [];

    //this is needed because the json structure changes when 
    //1 item is only in the array (it becomes just an object)
    let itemsArray = [];
    if (jsonSchema.items) {
        itemsArray = jsonSchema.items instanceof Array ? jsonSchema.items : [jsonSchema.items];
    }
    // if array
    for (var index in itemsArray) {
        var value = itemsArray[index];

        let expression = generateExpression(value, modelDefinitions);

        //check for required is set to true
        if (jsonSchema.required) {
            var list = jsonSchema.required;
            if (list.includes(key)) {
                expression = required(expression);
            }
        }

        propList.push(expression);
    }

    // if object
    for (var key in jsonSchema.properties) {
        let value = jsonSchema.properties[key];

        let expression = generateExpression(value, modelDefinitions);
/*
        if (!expression) {
            throw Error(JSON.stringify(value) + JSON.stringify(expression));
        }
        */
        //check for required is set to true
        if (jsonSchema.required) {
            let list = jsonSchema.required;
            if (list.includes(key)) {
                expression = required(expression);
            }
        }

        propList.push(ts.createPropertyAssignment(
            ts.createIdentifier(key),
            expression
        ));

    }

    return propList;
}

const generateJoiObjects = (jsonSchema, modelDefinitions) => {

    var propList = generateJoiTypes(jsonSchema, modelDefinitions);

    //loop and add all props
    return ts.createVariableStatement(
        undefined,
        ts.createVariableDeclarationList(
            [
                ts.createVariableDeclaration(
                    ts.createIdentifier('schema'),
                    undefined,
                    ts.createCall(
                        ts.createPropertyAccess(
                            ts.createCall(
                                ts.createPropertyAccess(
                                    ts.createIdentifier('Joi'),
                                    ts.createIdentifier('object')
                                ),
                                undefined,
                                []
                            ),
                            ts.createIdentifier('keys')
                        ),
                        undefined,
                        [
                            ts.createObjectLiteral(
                                propList,
                                true
                            )
                        ]
                    )
                )
            ],
            ts.NodeFlags.Const
        )
    )
}

module.exports = {
    generateJoiObjects
};
