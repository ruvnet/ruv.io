import { describe, it, expect } from 'vitest';
import { parse, parseStream, isValidJson, getJsonType } from '../src/index';

describe('claude-parser', () => {
  describe('parse()', () => {
    it('should parse a simple JSON object', () => {
      const jsonString = '{"name": "Claude", "version": "1.0.5"}';
      const result = parse(jsonString);
      expect(result).toEqual({ name: 'Claude', version: '1.0.5' });
    });

    it('should parse a JSON array', () => {
      const jsonString = '[1, 2, 3, 4, 5]';
      const result = parse(jsonString);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should parse a JSON string', () => {
      const jsonString = '"hello world"';
      const result = parse(jsonString);
      expect(result).toBe('hello world');
    });

    it('should parse a JSON number', () => {
      const jsonString = '42';
      const result = parse(jsonString);
      expect(result).toBe(42);
    });

    it('should parse a JSON boolean', () => {
      const jsonString = 'true';
      const result = parse(jsonString);
      expect(result).toBe(true);
    });

    it('should parse JSON null', () => {
      const jsonString = 'null';
      const result = parse(jsonString);
      expect(result).toBeNull();
    });

    it('should parse nested JSON structures', () => {
      const jsonString = '{"data": {"nested": [1, 2, {"deep": true}]}}';
      const result = parse(jsonString);
      expect(result).toEqual({
        data: {
          nested: [1, 2, { deep: true }],
        },
      });
    });

    it('should throw on invalid JSON', () => {
      const jsonString = '{invalid json}';
      expect(() => parse(jsonString)).toThrow();
    });

    it('should handle special characters in strings', () => {
      const jsonString = '{"text": "Hello\\nWorld\\t!"}';
      const result = parse(jsonString);
      expect(result.text).toContain('World');
    });

    it('should handle Unicode characters', () => {
      const jsonString = '{"emoji": "🚀", "text": "unicode"}';
      const result = parse(jsonString);
      expect(result.emoji).toBe('🚀');
    });
  });

  describe('parseStream()', () => {
    it('should parse newline-delimited JSON', () => {
      const stream = '{"id": 1}\n{"id": 2}\n{"id": 3}';
      const result = parseStream(stream);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: 1 });
      expect(result[1]).toEqual({ id: 2 });
      expect(result[2]).toEqual({ id: 3 });
    });

    it('should skip empty lines', () => {
      const stream = '{"id": 1}\n\n{"id": 2}';
      const result = parseStream(stream);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 1 });
      expect(result[1]).toEqual({ id: 2 });
    });

    it('should handle mixed types in stream', () => {
      const stream = '{"type": "object"}\n[1, 2, 3]\n"string"\n42\ntrue';
      const result = parseStream(stream);
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({ type: 'object' });
      expect(result[1]).toEqual([1, 2, 3]);
      expect(result[2]).toBe('string');
      expect(result[3]).toBe(42);
      expect(result[4]).toBe(true);
    });

    it('should handle whitespace variations', () => {
      const stream = '  {"id": 1}  \n\t{"id": 2}\t\n{"id": 3}';
      const result = parseStream(stream);
      expect(result).toHaveLength(3);
    });

    it('should throw on invalid JSON in stream', () => {
      const stream = '{"id": 1}\n{invalid}\n{"id": 3}';
      expect(() => parseStream(stream)).toThrow();
    });

    it('should handle empty stream', () => {
      const stream = '';
      const result = parseStream(stream);
      expect(result).toHaveLength(0);
    });

    it('should handle stream with only whitespace', () => {
      const stream = '\n\n\n';
      const result = parseStream(stream);
      expect(result).toHaveLength(0);
    });
  });

  describe('isValidJson()', () => {
    it('should return true for valid JSON', () => {
      expect(isValidJson('{"valid": true}')).toBe(true);
      expect(isValidJson('[1, 2, 3]')).toBe(true);
      expect(isValidJson('"string"')).toBe(true);
      expect(isValidJson('42')).toBe(true);
      expect(isValidJson('true')).toBe(true);
      expect(isValidJson('null')).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      expect(isValidJson('{invalid}')).toBe(false);
      expect(isValidJson("{'single': 'quotes'}'")).toBe(false);
      expect(isValidJson('undefined')).toBe(false);
      expect(isValidJson('NaN')).toBe(false);
      expect(isValidJson('')).toBe(false);
    });

    it('should validate complex structures', () => {
      const complex = '{"arr": [1, 2, 3], "obj": {"nested": true}, "str": "value"}';
      expect(isValidJson(complex)).toBe(true);
    });
  });

  describe('getJsonType()', () => {
    it('should identify object type', () => {
      expect(getJsonType('{}')).toBe('object');
      expect(getJsonType('{"key": "value"}')).toBe('object');
    });

    it('should identify array type', () => {
      expect(getJsonType('[]')).toBe('array');
      expect(getJsonType('[1, 2, 3]')).toBe('array');
    });

    it('should identify string type', () => {
      expect(getJsonType('"hello"')).toBe('string');
    });

    it('should identify number type', () => {
      expect(getJsonType('42')).toBe('number');
      expect(getJsonType('3.14')).toBe('number');
    });

    it('should identify boolean type', () => {
      expect(getJsonType('true')).toBe('boolean');
      expect(getJsonType('false')).toBe('boolean');
    });

    it('should identify null type', () => {
      expect(getJsonType('null')).toBe('null');
    });

    it('should throw on invalid JSON', () => {
      expect(() => getJsonType('{invalid}')).toThrow();
    });
  });

  describe('Integration tests', () => {
    it('should validate before parsing', () => {
      const jsonString = '{"data": [1, 2, 3]}';

      if (isValidJson(jsonString)) {
        const type = getJsonType(jsonString);
        expect(type).toBe('object');

        const result = parse(jsonString);
        expect(result).toEqual({ data: [1, 2, 3] });
      }
    });

    it('should handle Claude Code CLI stream format', () => {
      const codeOutput = `{"type": "text", "content": "Hello"}
{"type": "code", "language": "rust", "content": "fn main() {}"}
{"type": "result", "success": true}`;

      const results = parseStream(codeOutput);
      expect(results).toHaveLength(3);
      expect(results[0].type).toBe('text');
      expect(results[1].type).toBe('code');
      expect(results[2].type).toBe('result');
    });
  });
});
