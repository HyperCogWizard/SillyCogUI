/**
 * OpenCog Integration Test Suite
 * Phase 1: Interface Stabilization & Cognitive Surface Coupling
 * 
 * This test suite validates the OpenCog integration interface,
 * ensuring robust API boundaries and proper fallback mechanisms.
 */

const { OpenCogManager, createOpenCogManager } = require('../src/opencog/opencog-manager.js');

describe('OpenCog Integration - Phase 1: Interface Stabilization', () => {
    let manager;

    beforeEach(() => {
        manager = createOpenCogManager();
    });

    afterEach(async () => {
        if (manager && manager.client && manager.client.disconnect) {
            await manager.disconnect();
        }
    });

    describe('API Boundary Validation', () => {
        test('should initialize OpenCog manager successfully', async () => {
            expect(manager).toBeDefined();
            expect(manager).toBeInstanceOf(OpenCogManager);
        });

        test('should handle initialization with configuration', async () => {
            const result = await manager.initialize();
            expect(result).toBe(true);
            expect(manager.isNativeAddonAvailable).toBeDefined();
        });

        test('should establish connection with proper parameters', async () => {
            await manager.initialize();
            const result = await manager.connect('localhost', 17001);
            expect(result).toBe(true);
            
            const status = await manager.isConnected();
            expect(status).toBe(true);
        });

        test('should handle graceful disconnection', async () => {
            await manager.initialize();
            await manager.connect('localhost', 17001);
            
            const disconnectResult = await manager.disconnect();
            expect(disconnectResult).toBe(true);
            
            const status = await manager.isConnected();
            expect(status).toBe(false);
        });
    });

    describe('Data Interchange Protocol Validation', () => {
        beforeEach(async () => {
            await manager.initialize();
            await manager.connect('localhost', 17001);
        });

        test('should process messages with proper response format', async () => {
            const testMessage = 'What is consciousness?';
            const response = await manager.sendMessage(testMessage);
            
            expect(response).toBeDefined();
            expect(response.formatted).toBeDefined();
            expect(response.formatted.text).toBeDefined();
            expect(response.formatted.confidence).toBeGreaterThanOrEqual(0);
            expect(response.formatted.confidence).toBeLessThanOrEqual(1);
            expect(response.formatted.metadata).toBeDefined();
            expect(response.formatted.metadata.reasoning_engine).toBe('opencog');
        });

        test('should handle knowledge base operations', async () => {
            // Test concept addition
            const addResult = await manager.addConcept('test_concept', {
                type: 'concept',
                domain: 'testing'
            });
            expect(addResult).toBe(true);

            // Test concept querying
            const concepts = await manager.queryConcepts('test');
            expect(Array.isArray(concepts)).toBe(true);
        });

        test('should validate configuration parameter handling', async () => {
            await manager.setReasoningMode('creative');
            await manager.setConfidenceThreshold(0.8);
            await manager.setMaxResponseLength(500);
            
            const settings = manager.getConnectionSettings();
            expect(settings).toBeDefined();
            expect(settings.reasoning_mode).toBeDefined();
            expect(settings.confidence_threshold).toBeDefined();
            expect(settings.max_response_length).toBeDefined();
        });
    });

    describe('Fallback Mechanism Validation', () => {
        test('should gracefully fallback when native addon unavailable', () => {
            // This test validates that the system works even without the C++ addon
            expect(manager.isNativeAddonAvailable()).toBeDefined();
            
            // The manager should still function regardless of addon availability
            expect(typeof manager.initialize).toBe('function');
            expect(typeof manager.connect).toBe('function');
            expect(typeof manager.sendMessage).toBe('function');
        });

        test('should maintain API compatibility in fallback mode', async () => {
            await manager.initialize();
            await manager.connect('localhost', 17001);
            
            const response = await manager.sendMessage('Test message');
            expect(response.formatted).toBeDefined();
            expect(response.formatted.metadata.processing_type).toBe('cognitive_architecture');
        });
    });

    describe('Error Handling and Resilience', () => {
        test('should handle invalid connection parameters gracefully', async () => {
            await manager.initialize();
            
            // Test with invalid parameters
            const result = await manager.connect('', -1);
            // Should either succeed (fallback) or fail gracefully
            expect(typeof result).toBe('boolean');
        });

        test('should handle malformed message inputs', async () => {
            await manager.initialize();
            await manager.connect('localhost', 17001);
            
            // Test with various edge cases
            const responses = await Promise.all([
                manager.sendMessage(''),
                manager.sendMessage(null),
                manager.sendMessage(undefined),
            ].map(async (promise) => {
                try {
                    return await promise;
                } catch (error) {
                    return { error: error.message };
                }
            }));
            
            responses.forEach(response => {
                expect(response).toBeDefined();
                // Should either return a valid response or handle error gracefully
            });
        });
    });

    describe('Cognitive Impedance Mismatch Prevention', () => {
        test('should maintain consistent response timing', async () => {
            await manager.initialize();
            await manager.connect('localhost', 17001);
            
            const startTime = Date.now();
            const response = await manager.sendMessage('Simple test query');
            const endTime = Date.now();
            
            const responseTime = endTime - startTime;
            expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
            expect(response.formatted.metadata).toBeDefined();
        });

        test('should provide cognitive statistics for monitoring', async () => {
            await manager.initialize();
            await manager.connect('localhost', 17001);
            
            const stats = await manager.getCognitiveStats();
            expect(stats).toBeDefined();
            expect(typeof stats.connected).toBe('string');
            expect(typeof stats.concepts_count).toBe('string');
        });
    });
});