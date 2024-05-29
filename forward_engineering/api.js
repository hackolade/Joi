'use strict';

const joiHelper = require('./helpers/joiHelper');
const ts = require('typescript');

module.exports = {
	generateScript(data, logger, callback) {
		try {
			const jsonSchema = JSON.parse(data.jsonSchema);

			const modelDefinitions = JSON.parse(data.modelDefinitions);
			const internalDefinitions = JSON.parse(data.internalDefinitions);
			const externalDefinitions = JSON.parse(data.externalDefinitions);

			const resultFile = ts.createSourceFile(
				'someFileName.ts',
				'',
				ts.ScriptTarget.Latest,
				/*setParentNodes*/ false,
				ts.ScriptKind.TS,
			);
			const printer = ts.createPrinter({
				newLine: ts.NewLineKind.LineFeed,
			});
			const result = printer.printNode(
				ts.EmitHint.Unspecified,
				joiHelper.generateJoiObjects(jsonSchema, modelDefinitions),
				resultFile,
			);

			callback(null, buildScript(result));
		} catch (e) {
			logger.log('error', { message: e.message, stack: e.stack }, 'Joi Forward-Engineering Error');

			setTimeout(() => {
				callback({ message: e.message, stack: e.stack });
			}, 150);
		}
	},
};

const buildScript = (...statements) => {
	return statements.filter(statement => statement).join('\n\n');
};
