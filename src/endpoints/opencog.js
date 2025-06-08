/**
 * OpenCog LLM Integration Endpoints for SillyCogUI
 *
 * This module provides HTTP endpoints for integrating OpenCog cognitive architecture
 * with SillyCogUI's chat interface, enabling advanced reasoning and knowledge management.
 */

import express from 'express';
import { OpenCogManager } from '../opencog/opencog-manager.js';

const router = express.Router();

// Global OpenCog manager instance
let openCogManager = null;

/**
 * Initialize OpenCog manager if not already done
 */
async function ensureOpenCogManager() {
    if (!openCogManager) {
        openCogManager = new OpenCogManager();
    }
    return openCogManager;
}

/**
 * Initialize OpenCog client
 * POST /api/opencog/initialize
 */
router.post('/initialize', async (req, res) => {
    try {
        const manager = await ensureOpenCogManager();
        const { configPath } = req.body;

        const success = await manager.initialize(configPath);

        res.json({
            success,
            message: success ? 'OpenCog initialized successfully' : 'Failed to initialize OpenCog',
            nativeAvailable: manager.isNativeAddonAvailable(),
        });
    } catch (error) {
        console.error('OpenCog initialization error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * Connect to OpenCog server
 * POST /api/opencog/connect
 */
router.post('/connect', async (req, res) => {
    try {
        const manager = await ensureOpenCogManager();
        const { endpoint = 'localhost', port = 17001 } = req.body;

        const success = await manager.connect(endpoint, port);

        res.json({
            success,
            message: success ? `Connected to OpenCog at ${endpoint}:${port}` : 'Failed to connect to OpenCog',
            connected: manager.isConnected(),
        });
    } catch (error) {
        console.error('OpenCog connection error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * Disconnect from OpenCog server
 * POST /api/opencog/disconnect
 */
router.post('/disconnect', async (req, res) => {
    try {
        const manager = await ensureOpenCogManager();
        const success = await manager.disconnect();

        res.json({
            success,
            message: success ? 'Disconnected from OpenCog' : 'Failed to disconnect from OpenCog',
            connected: manager.isConnected(),
        });
    } catch (error) {
        console.error('OpenCog disconnection error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * Send message to OpenCog for processing
 * POST /api/opencog/chat
 */
router.post('/chat', async (req, res) => {
    try {
        const manager = await ensureOpenCogManager();
        const { message, role = 'user' } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message content is required',
            });
        }

        if (!manager.isConnected()) {
            return res.status(400).json({
                success: false,
                error: 'Not connected to OpenCog. Please connect first.',
            });
        }

        const response = await manager.sendMessage(message, role);

        res.json({
            success: true,
            response: response.formatted,
            raw: response,
            metadata: {
                timestamp: response.timestamp,
                source: response.source,
                confidence: response.confidence,
            },
        });
    } catch (error) {
        console.error('OpenCog chat error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * Load knowledge base
 * POST /api/opencog/knowledge/load
 */
router.post('/knowledge/load', async (req, res) => {
    try {
        const manager = await ensureOpenCogManager();
        const { kbPath } = req.body;

        if (!kbPath) {
            return res.status(400).json({
                success: false,
                error: 'Knowledge base path is required',
            });
        }

        const success = await manager.loadKnowledgeBase(kbPath);

        res.json({
            success,
            message: success ? `Knowledge base loaded from ${kbPath}` : 'Failed to load knowledge base',
        });
    } catch (error) {
        console.error('Knowledge base loading error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * Add concept to knowledge base
 * POST /api/opencog/knowledge/concept
 */
router.post('/knowledge/concept', async (req, res) => {
    try {
        const manager = await ensureOpenCogManager();
        const { concept, attributes = {} } = req.body;

        if (!concept) {
            return res.status(400).json({
                success: false,
                error: 'Concept name is required',
            });
        }

        const success = await manager.addConcept(concept, attributes);

        res.json({
            success,
            message: success ? `Concept '${concept}' added successfully` : 'Failed to add concept',
        });
    } catch (error) {
        console.error('Concept addition error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * Query concepts
 * GET /api/opencog/knowledge/concepts
 */
router.get('/knowledge/concepts', async (req, res) => {
    try {
        const manager = await ensureOpenCogManager();
        const { pattern = '' } = req.query;

        const concepts = await manager.queryConcepts(pattern);

        res.json({
            success: true,
            concepts,
            count: concepts.length,
            pattern: pattern || 'all',
        });
    } catch (error) {
        console.error('Concept query error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * Configure reasoning mode
 * POST /api/opencog/config/reasoning
 */
router.post('/config/reasoning', async (req, res) => {
    try {
        const manager = await ensureOpenCogManager();
        const { mode } = req.body;

        if (!mode) {
            return res.status(400).json({
                success: false,
                error: 'Reasoning mode is required',
            });
        }

        manager.setReasoningMode(mode);

        res.json({
            success: true,
            message: `Reasoning mode set to '${mode}'`,
        });
    } catch (error) {
        console.error('Reasoning mode configuration error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * Set confidence threshold
 * POST /api/opencog/config/confidence
 */
router.post('/config/confidence', async (req, res) => {
    try {
        const manager = await ensureOpenCogManager();
        const { threshold } = req.body;

        if (typeof threshold !== 'number' || threshold < 0 || threshold > 1) {
            return res.status(400).json({
                success: false,
                error: 'Threshold must be a number between 0 and 1',
            });
        }

        manager.setConfidenceThreshold(threshold);

        res.json({
            success: true,
            message: `Confidence threshold set to ${threshold}`,
        });
    } catch (error) {
        console.error('Confidence threshold configuration error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * Set maximum response length
 * POST /api/opencog/config/response-length
 */
router.post('/config/response-length', async (req, res) => {
    try {
        const manager = await ensureOpenCogManager();
        const { maxLength } = req.body;

        if (typeof maxLength !== 'number' || maxLength <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Max length must be a positive number',
            });
        }

        manager.setMaxResponseLength(maxLength);

        res.json({
            success: true,
            message: `Max response length set to ${maxLength}`,
        });
    } catch (error) {
        console.error('Response length configuration error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * Get OpenCog status
 * GET /api/opencog/status
 */
router.get('/status', async (req, res) => {
    try {
        const manager = await ensureOpenCogManager();
        const status = await manager.getStatus();
        const stats = await manager.getCognitiveStats();
        const settings = manager.getConnectionSettings();

        res.json({
            success: true,
            status,
            connected: manager.isConnected(),
            nativeAvailable: manager.isNativeAddonAvailable(),
            stats,
            settings,
        });
    } catch (error) {
        console.error('Status retrieval error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * Get cognitive statistics
 * GET /api/opencog/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const manager = await ensureOpenCogManager();
        const stats = await manager.getCognitiveStats();

        res.json({
            success: true,
            stats,
        });
    } catch (error) {
        console.error('Stats retrieval error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * Health check endpoint
 * GET /api/opencog/health
 */
router.get('/health', async (req, res) => {
    try {
        const manager = await ensureOpenCogManager();

        res.json({
            success: true,
            healthy: true,
            initialized: !!openCogManager,
            connected: manager.isConnected(),
            nativeAvailable: manager.isNativeAddonAvailable(),
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            success: false,
            healthy: false,
            error: error.message,
        });
    }
});

export { router };
export default router;
