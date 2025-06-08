/**
 * OpenCog LLM Frontend Integration for SillyCogUI
 *
 * This module provides a bridge between SillyCogUI and OpenCog cognitive architecture,
 * enabling sophisticated chatbot interactions with reasoning, knowledge management,
 * and cognitive analysis capabilities.
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Dynamic loading of the native addon
let openCogAddon;
try {
    // Use require for the native addon since it's not an ES module
    openCogAddon = require('../../build/Release/opencog_addon.node');
} catch (error) {
    console.warn('OpenCog native addon not available, using fallback implementation');
    openCogAddon = null;
}

/**
 * OpenCog Integration Manager
 */
class OpenCogManager {
    constructor() {
        this.client = null;
        this.isNativeAvailable = !!openCogAddon;
        this.connectionSettings = {
            endpoint: 'localhost',
            port: 17001,
            reasoning_mode: 'standard',
            confidence_threshold: 0.7,
            max_response_length: 1000,
        };
    }

    /**
     * Initialize the OpenCog client
     * @param {string} configPath Optional path to configuration file
     * @returns {Promise<boolean>} Success status
     */
    async initialize(configPath = '') {
        try {
            if (this.isNativeAvailable) {
                this.client = new openCogAddon.OpenCogClient();
                return this.client.initialize(configPath);
            } else {
                // Fallback implementation for when native addon is not available
                this.client = new FallbackOpenCogClient();
                return this.client.initialize(configPath);
            }
        } catch (error) {
            console.error('Failed to initialize OpenCog client:', error);
            return false;
        }
    }

    /**
     * Connect to OpenCog server
     * @param {string} endpoint Server endpoint
     * @param {number} port Server port
     * @returns {Promise<boolean>} Connection status
     */
    async connect(endpoint = this.connectionSettings.endpoint, port = this.connectionSettings.port) {
        if (!this.client) {
            throw new Error('OpenCog client not initialized');
        }

        this.connectionSettings.endpoint = endpoint;
        this.connectionSettings.port = port;

        return this.client.connect(endpoint, port);
    }

    /**
     * Disconnect from OpenCog server
     * @returns {Promise<boolean>} Disconnection status
     */
    async disconnect() {
        if (!this.client) {
            return false;
        }

        return this.client.disconnect();
    }

    /**
     * Check if connected to OpenCog
     * @returns {boolean} Connection status
     */
    isConnected() {
        return this.client ? this.client.isConnected() : false;
    }

    /**
     * Send a message to OpenCog for processing
     * @param {string} message Message content
     * @param {string} role Message role (user, assistant, system)
     * @returns {Promise<Object>} OpenCog response
     */
    async sendMessage(message, role = 'user') {
        if (!this.client) {
            throw new Error('OpenCog client not initialized');
        }

        if (!this.isConnected()) {
            throw new Error('Not connected to OpenCog');
        }

        const response = this.client.sendMessage(message, role);

        // Enhance response with SillyCogUI-specific formatting
        return {
            ...response,
            timestamp: new Date().toISOString(),
            source: 'opencog',
            formatted: this.formatResponseForSillyCog(response),
        };
    }

    /**
     * Load a knowledge base into OpenCog
     * @param {string} kbPath Path to knowledge base file
     * @returns {Promise<boolean>} Load status
     */
    async loadKnowledgeBase(kbPath) {
        if (!this.client) {
            throw new Error('OpenCog client not initialized');
        }

        return this.client.loadKnowledgeBase(kbPath);
    }

    /**
     * Add a concept to the knowledge base
     * @param {string} concept Concept name
     * @param {Object} attributes Concept attributes
     * @returns {Promise<boolean>} Success status
     */
    async addConcept(concept, attributes = {}) {
        if (!this.client) {
            throw new Error('OpenCog client not initialized');
        }

        return this.client.addConcept(concept, attributes);
    }

    /**
     * Query concepts matching a pattern
     * @param {string} pattern Search pattern
     * @returns {Promise<Array<string>>} Matching concepts
     */
    async queryConcepts(pattern) {
        if (!this.client) {
            throw new Error('OpenCog client not initialized');
        }

        return this.client.queryConcepts(pattern);
    }

    /**
     * Configure reasoning mode
     * @param {string} mode Reasoning mode (standard, creative, logical, etc.)
     */
    setReasoningMode(mode) {
        if (!this.client) {
            throw new Error('OpenCog client not initialized');
        }

        this.connectionSettings.reasoning_mode = mode;
        this.client.setReasoningMode(mode);
    }

    /**
     * Set confidence threshold for responses
     * @param {number} threshold Confidence threshold (0.0 - 1.0)
     */
    setConfidenceThreshold(threshold) {
        if (!this.client) {
            throw new Error('OpenCog client not initialized');
        }

        this.connectionSettings.confidence_threshold = threshold;
        this.client.setConfidenceThreshold(threshold);
    }

    /**
     * Set maximum response length
     * @param {number} maxLength Maximum response length in characters
     */
    setMaxResponseLength(maxLength) {
        if (!this.client) {
            throw new Error('OpenCog client not initialized');
        }

        this.connectionSettings.max_response_length = maxLength;
        this.client.setMaxResponseLength(maxLength);
    }

    /**
     * Get OpenCog status information
     * @returns {Promise<string>} Status information
     */
    async getStatus() {
        if (!this.client) {
            return 'OpenCog client not initialized';
        }

        return this.client.getStatus();
    }

    /**
     * Get cognitive statistics
     * @returns {Promise<Object>} Cognitive statistics
     */
    async getCognitiveStats() {
        if (!this.client) {
            return {};
        }

        return this.client.getCognitiveStats();
    }

    /**
     * Format OpenCog response for SillyCogUI
     * @private
     * @param {Object} response OpenCog response
     * @returns {Object} Formatted response
     */
    formatResponseForSillyCog(response) {
        return {
            text: response.content,
            confidence: response.confidence,
            suggestions: response.suggestions || [],
            metadata: {
                reasoning_engine: 'opencog',
                cognitive_data: response.cognitiveData || {},
                processing_type: 'cognitive_architecture',
            },
        };
    }

    /**
     * Get current connection settings
     * @returns {Object} Connection settings
     */
    getConnectionSettings() {
        return { ...this.connectionSettings };
    }

    /**
     * Check if native OpenCog addon is available
     * @returns {boolean} Native availability status
     */
    isNativeAddonAvailable() {
        return this.isNativeAvailable;
    }
}

/**
 * Fallback implementation when native addon is not available
 */
class FallbackOpenCogClient {
    constructor() {
        this.connected = false;
        this.concepts = [];
        this.knowledgeBase = new Map();
    }

    initialize(configPath) {
        console.log('Using fallback OpenCog implementation');
        return true;
    }

    connect(endpoint, port) {
        console.log(`Connecting to OpenCog at ${endpoint}:${port} (fallback mode)`);
        this.connected = true;
        return true;
    }

    disconnect() {
        this.connected = false;
        return true;
    }

    isConnected() {
        return this.connected;
    }

    sendMessage(message, role) {
        const responses = [
            `OpenCog cognitive analysis of: "${message}" - This demonstrates symbolic reasoning capabilities.`,
            `Through pattern recognition and semantic networks, I understand: "${message}"`,
            `Applying cognitive architecture principles to: "${message}" - Multiple reasoning pathways activated.`,
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];

        return {
            content: response,
            confidence: 0.8 + Math.random() * 0.15,
            suggestions: [
                'Explore related concepts',
                'Request deeper analysis',
                'Ask about reasoning process',
            ],
            cognitiveData: {
                reasoning_mode: 'fallback',
                processing_time: '0.1s',
                concepts_activated: this.concepts.length.toString(),
            },
        };
    }

    loadKnowledgeBase(kbPath) {
        console.log(`Loading knowledge base: ${kbPath} (fallback mode)`);
        this.concepts.push('ai', 'cognition', 'reasoning', 'language');
        return true;
    }

    addConcept(concept, attributes) {
        this.concepts.push(concept);
        this.knowledgeBase.set(concept, attributes);
        return true;
    }

    queryConcepts(pattern) {
        return this.concepts.filter(concept => concept.includes(pattern));
    }

    setReasoningMode(mode) {
        console.log(`Set reasoning mode: ${mode} (fallback)`);
    }

    setConfidenceThreshold(threshold) {
        console.log(`Set confidence threshold: ${threshold} (fallback)`);
    }

    setMaxResponseLength(maxLength) {
        console.log(`Set max response length: ${maxLength} (fallback)`);
    }

    getStatus() {
        return `OpenCog Fallback Mode - Connected: ${this.connected}, Concepts: ${this.concepts.length}`;
    }

    getCognitiveStats() {
        return {
            mode: 'fallback',
            connected: this.connected.toString(),
            concepts_count: this.concepts.length.toString(),
            knowledge_base_size: this.knowledgeBase.size.toString(),
        };
    }
}

function createOpenCogManager() {
    return new OpenCogManager();
}

export {
    OpenCogManager,
    createOpenCogManager,
};
