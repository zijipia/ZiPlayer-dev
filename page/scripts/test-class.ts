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
}
