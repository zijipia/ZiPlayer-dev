const fs = require("fs");
const path = require("path");

// Tạo file test với JSDoc comments
const testContent = `
/**
 * Test class với JSDoc comments
 * 
 * @example
 * const test = new TestClass();
 * test.testMethod("hello");
 */
export class TestClass {
    /**
     * Test method với JSDoc
     * 
     * @param {string} message - Message to display
     * @returns {void}
     * @example
     * test.testMethod("Hello World");
     */
    testMethod(message: string): void {
        console.log(message);
    }

    /**
     * Another method
     * 
     * @param {number} value - Numeric value
     * @returns {number} Doubled value
     */
    anotherMethod(value: number): number {
        return value * 2;
    }

    // Method without JSDoc
    noDocMethod(): void {
        // No documentation
    }
}
`;

// Ghi file test
fs.writeFileSync("test-class.ts", testContent);

// Import và test generator
const ApiContentGenerator = require("./generateApiContent.js");
const generator = new ApiContentGenerator();

// Test parse file
generator.parseFile("test-class.ts");

// In kết quả
console.log("Generated API content:");
console.log(JSON.stringify(generator.apiContent, null, 2));

// Xóa file test
fs.unlinkSync("test-class.ts");
