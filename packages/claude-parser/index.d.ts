/**
 * @ruv.io/claude-parser
 *
 * A high-performance JSON parser with stream support for Claude Code CLI.
 * Built with Rust and napi-rs for optimal performance.
 */

/**
 * Parse a JSON string and return the parsed object
 *
 * @param jsonString - The JSON string to parse
 * @returns The parsed JSON object or primitive value
 * @throws Error if the JSON is invalid
 *
 * @example
 * ```typescript
 * const data = parse('{"name": "Claude", "version": "1.0.5"}');
 * console.log(data.name); // "Claude"
 * ```
 */
export function parse(jsonString: string): any;

/**
 * Parse a newline-delimited JSON stream
 *
 * This function parses JSON objects or values separated by newlines,
 * skipping empty lines and trimming whitespace.
 *
 * @param jsonStream - A string containing newline-delimited JSON objects
 * @returns An array of parsed JSON objects or values
 * @throws Error if any line contains invalid JSON
 *
 * @example
 * ```typescript
 * const stream = `{"id": 1}\n{"id": 2}\n{"id": 3}`;
 * const results = parseStream(stream);
 * console.log(results.length); // 3
 * ```
 */
export function parseStream(jsonStream: string): any[];

/**
 * Validate if a string is valid JSON
 *
 * This is a lightweight validation function that checks JSON syntax
 * without performing full parsing.
 *
 * @param jsonString - The JSON string to validate
 * @returns true if the string is valid JSON, false otherwise
 *
 * @example
 * ```typescript
 * isValidJson('{"valid": true}'); // true
 * isValidJson('{invalid}'); // false
 * ```
 */
export function isValidJson(jsonString: string): boolean;

/**
 * Get the type of a JSON value
 *
 * Returns the JavaScript type of the root JSON value.
 *
 * @param jsonString - The JSON string to check
 * @returns The type as a string: 'null', 'boolean', 'number', 'string', 'array', or 'object'
 * @throws Error if the JSON is invalid
 *
 * @example
 * ```typescript
 * getJsonType('{"key": "value"}'); // "object"
 * getJsonType('[1, 2, 3]'); // "array"
 * getJsonType('"hello"'); // "string"
 * getJsonType('42'); // "number"
 * getJsonType('true'); // "boolean"
 * getJsonType('null'); // "null"
 * ```
 */
export function getJsonType(jsonString: string): 'null' | 'boolean' | 'number' | 'string' | 'array' | 'object';
