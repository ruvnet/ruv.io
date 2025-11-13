// TypeScript type definitions and exports for claude-parser

interface ParsedJSON {
  [key: string]: any;
}

/**
 * Parse a JSON string and return the parsed object
 * @param jsonString - The JSON string to parse
 * @returns The parsed JSON object
 * @throws Error if the JSON is invalid
 */
export function parse(jsonString: string): ParsedJSON | any;

/**
 * Parse a newline-delimited JSON stream
 * @param jsonStream - A string containing newline-delimited JSON objects
 * @returns An array of parsed JSON objects
 * @throws Error if any line contains invalid JSON
 */
export function parseStream(jsonStream: string): Array<ParsedJSON | any>;

/**
 * Validate if a string is valid JSON
 * @param jsonString - The JSON string to validate
 * @returns true if the string is valid JSON, false otherwise
 */
export function isValidJson(jsonString: string): boolean;

/**
 * Get the type of a JSON value
 * @param jsonString - The JSON string to check
 * @returns The type as a string: 'null', 'boolean', 'number', 'string', 'array', or 'object'
 * @throws Error if the JSON is invalid
 */
export function getJsonType(jsonString: string): string;

// Re-export native bindings
export * from './index.node';
